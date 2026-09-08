// Builds a three.js avatar from the player's equipped Bloxity cosmetics.
//
// Framework-free (Tech.md rule 2); PlayerAvatar.jsx only mounts what this
// returns. Every asset is remote and optional: any slot that 404s or fails to
// parse falls back to the base rig's own default_* mesh, and a total failure
// leaves the caller on the capsule.
//
// Budget note (Tech.md §6/§7): the base rig is 6 meshes (104 tris) sharing ONE
// material, so a bare avatar costs 6 draw calls and 1 material. Each equipped
// part or item adds one mesh and one material. This is the documented exception
// to "one shared material for the entire prop set" — props stay atlased and
// instanced; only the player is multi-mesh.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import {
  AVATAR_SLOTS,
  BASE_MODEL_URL,
  RIG,
  RIG_HEIGHT,
  isEquipped,
  itemUrls,
  partUrl,
  skinUrl,
} from '../data/bloxity.js'
import { PLAYER_HEIGHT, PLAYER_RADIUS } from './playerState.js'

// The base rig is refetched on every rebuild; let three serve it from cache.
THREE.Cache.enabled = true

const gltfLoader = new GLTFLoader()
const objLoader = new OBJLoader()
const textureLoader = new THREE.TextureLoader()

// Tech.md §7 permits MeshLambertMaterial / MeshBasicMaterial only. Remote
// glTFs arrive as MeshStandardMaterial, so every loaded material is rebuilt.
function toLambert(material, owned) {
  const source = Array.isArray(material) ? material[0] : material
  const lambert = new THREE.MeshLambertMaterial({
    map: source && source.map ? source.map : null,
    color: source && source.color ? source.color.clone() : new THREE.Color(0xffffff),
    side: source && source.side !== undefined ? source.side : THREE.FrontSide,
    transparent: !!(source && source.transparent),
    alphaTest: source && source.alphaTest ? source.alphaTest : 0,
  })
  owned.materials.push(lambert)
  return lambert
}

function convertMaterials(object3d, owned) {
  object3d.traverse((o) => {
    if (!o.isMesh && !o.isSkinnedMesh) return
    const previous = o.material
    const source = Array.isArray(previous) ? previous[0] : previous
    const key = source ? source.uuid : 'none'
    // Meshes that shared a source material must keep sharing one after the
    // swap — the base rig's six body meshes all use the single `char`
    // material, and converting per mesh would turn 1 material into 6.
    let lambert = owned.converted.get(key)
    if (!lambert) {
      lambert = toLambert(previous, owned)
      owned.converted.set(key, lambert)
    }
    o.material = lambert
    o.castShadow = false
    o.receiveShadow = false
    // Dispose the PBR material the loader made; its map is now ours to keep.
    for (const m of Array.isArray(previous) ? previous : [previous]) {
      if (m && m !== o.material) m.dispose()
    }
  })
}

// Skins are pixel art (the base rig samples NEAREST) and glTF UVs are not
// flipped, so a plain PNG has to match that convention explicitly.
function configureSkinTexture(texture) {
  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestMipmapLinearFilter
  texture.anisotropy = 1
  return texture
}

function configureItemTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestMipmapLinearFilter
  texture.anisotropy = 1
  return texture
}

function firstSkinnedMesh(root) {
  let found = null
  root.traverse((o) => {
    if (!found && o.isSkinnedMesh) found = o
  })
  return found
}

function firstMesh(root) {
  let found = null
  root.traverse((o) => {
    if (!found && (o.isMesh || o.isSkinnedMesh)) found = o
  })
  return found
}

async function applySkin(built, id) {
  if (!isEquipped(id)) return
  let texture
  try {
    texture = configureSkinTexture(await textureLoader.loadAsync(skinUrl(id)))
  } catch {
    return // keep the rig's embedded texture
  }
  built.owned.textures.push(texture)
  // One material spans the whole base body, so this touches a single material
  // even though it walks every mesh.
  for (const mesh of built.baseMeshes) {
    mesh.material.map = texture
    mesh.material.needsUpdate = true
  }
}

async function applyPart(built, slot, id) {
  let gltf
  try {
    gltf = await gltfLoader.loadAsync(partUrl(slot, id))
  } catch {
    return // slot unavailable: the default_* mesh stays visible
  }
  const mesh = firstMesh(gltf.scene)
  if (!mesh) return

  convertMaterials(gltf.scene, built.owned)
  built.owned.scenes.push(gltf.scene)

  const replaced = built.nodes[slot.replaces]
  if (replaced) replaced.visible = false

  if (mesh.isSkinnedMesh && built.skinned) {
    // Rebind onto the base skeleton so the part follows the same bones the
    // proportions drive.
    mesh.bind(built.skinned.skeleton, built.skinned.bindMatrix)
    built.root.add(mesh)
  } else {
    const bone = built.nodes[slot.bone]
    if (bone) bone.add(mesh)
    else built.root.add(mesh)
  }
  built.slotObjects.push(mesh)
}

async function applyItem(built, slot, id) {
  const urls = itemUrls(slot, id)
  let object
  try {
    object = await objLoader.loadAsync(urls.mesh)
  } catch {
    return
  }
  let texture = null
  try {
    texture = configureItemTexture(await textureLoader.loadAsync(urls.texture))
    built.owned.textures.push(texture)
  } catch {
    // An untextured item still beats no item.
  }
  convertMaterials(object, built.owned)
  if (texture) {
    object.traverse((o) => {
      if (o.isMesh) {
        o.material.map = texture
        o.material.needsUpdate = true
      }
    })
  }
  built.owned.scenes.push(object)
  const anchor = built.nodes[slot.attach]
  if (anchor) anchor.add(object)
  else built.root.add(object)
  built.slotObjects.push(object)
}

// Returns null when the base rig itself cannot be loaded — the caller then
// stays on the capsule.
export async function buildAvatar(equipped) {
  let gltf
  try {
    gltf = await gltfLoader.loadAsync(BASE_MODEL_URL)
  } catch {
    return null
  }

  const root = gltf.scene
  // `converted` maps a source material to the Lambert that replaced it, so
  // shared materials stay shared across the whole build.
  const owned = { materials: [], textures: [], scenes: [root], converted: new Map() }
  const nodes = {}
  root.traverse((o) => {
    if (o.name) nodes[o.name] = o
  })

  const baseMeshes = []
  root.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) baseMeshes.push(o)
  })

  convertMaterials(root, owned)

  const built = {
    root,
    nodes,
    owned,
    baseMeshes,
    slotObjects: [],
    skinned: firstSkinnedMesh(root),
  }

  const slots = equipped || {}
  await applySkin(built, slots.skinId)

  // Slots load in parallel; each one swallows its own failure.
  await Promise.all(
    AVATAR_SLOTS.map((slot) => {
      const id = slots[slot.key]
      if (!isEquipped(id)) return null
      return slot.kind === 'part' ? applyPart(built, slot, id) : applyItem(built, slot, id)
    }).filter(Boolean),
  )

  return built
}

// Drives the rig from the (already clamped) proportions and returns the collider
// dimensions the movement system should adopt, so the drawn body and the AABB
// sweep can never disagree.
export function applyProportions(built, p) {
  const n = built.nodes

  if (n.ArmL_Offset) n.ArmL_Offset.position.x = RIG.armOffsetX * p.shoulderWidth
  if (n.ArmR_Offset) n.ArmR_Offset.position.x = -RIG.armOffsetX * p.shoulderWidth
  if (n.ArmL1) n.ArmL1.scale.y = p.armLength
  if (n.ArmR1) n.ArmR1.scale.y = p.armLength
  if (n.LegL_Offset) n.LegL_Offset.position.x = RIG.legOffsetX * p.legOffsetX
  if (n.LegR_Offset) n.LegR_Offset.position.x = -RIG.legOffsetX * p.legOffsetX
  if (n.Spine1) n.Spine1.scale.x = p.torsoScaleX
  if (n.Neck_Offset) n.Neck_Offset.position.y = RIG.neckOffsetY * p.neckHeight
  if (n.Neck1) n.Neck1.scale.setScalar(p.headScale)

  // The rig is 6.4 units tall with its origin at the feet, matching Player.jsx's
  // group contract; one uniform scale puts it in metres.
  built.root.scale.setScalar((PLAYER_HEIGHT / RIG_HEIGHT) * p.height)

  return {
    height: PLAYER_HEIGHT * p.height,
    radius: PLAYER_RADIUS * p.shoulderWidth,
  }
}

// three.js does not GC GPU memory (Tech.md §7).
export function disposeAvatar(built) {
  if (!built) return
  for (const scene of built.owned.scenes) {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      // Textures embedded in a glTF are not in owned.textures, so catch them
      // here too; three's dispose() is safe to call twice.
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) if (m && m.map) m.map.dispose()
    })
    if (scene.parent) scene.parent.remove(scene)
  }
  for (const material of built.owned.materials) material.dispose()
  for (const texture of built.owned.textures) texture.dispose()
  built.owned.scenes.length = 0
  built.owned.materials.length = 0
  built.owned.textures.length = 0
  built.owned.converted.clear()
}
