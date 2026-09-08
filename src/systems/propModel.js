// Loads a Blender-authored prop glTF (Tech.md §6) and converts its materials
// at the load boundary. Framework-free (Tech.md rule 2).
//
// glTF materials arrive as MeshStandardMaterial; Tech.md §7 permits only
// MeshLambertMaterial / MeshBasicMaterial — PBR costs fragment time a phone
// does not have. An emissive source material (a neon sign, a glow strip)
// becomes unlit MeshBasicMaterial, the same "glow without bloom" trick the
// laser beam uses; everything else becomes Lambert, keeping its baseColor
// map if it has one. This rule is enforced here, not assumed, exactly as
// avatarModel.js enforces it for remote avatar glTFs.
//
// The exporter bakes whichever Blender object was exported (position and
// rotation — power_podium's own, here) into the glTF node, but that's only
// one instance's placement. Every mounted instance needs its own position
// *and* rotation (target_podium turns independently to face power_podium),
// so the node's baked position/rotation are reset to identity on load —
// scale is left alone, it's shared — and callers supply position/rotation
// themselves (data/podium.js) — see loadProp below.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltfLoader = new GLTFLoader()

// Keyed by url: the same source glTF reused by more than one placed instance
// (e.g. target_podium duplicating power_podium) is fetched and converted once
// — refCount frees the shared geometry/materials only once every instance
// mounted from that url has been disposed.
const cache = new Map()

function convertMaterial(source) {
  const isEmissive = source.emissive && source.emissive.getHex() !== 0x000000
  if (isEmissive) {
    return new THREE.MeshBasicMaterial({
      color: source.emissive.clone(),
      map: source.emissiveMap || null,
      side: source.side,
    })
  }
  return new THREE.MeshLambertMaterial({
    map: source.map || null,
    color: source.color ? source.color.clone() : new THREE.Color(0xffffff),
    side: source.side,
  })
}

async function loadBase(url) {
  const gltf = await gltfLoader.loadAsync(url)
  const root = gltf.scene
  const materials = []
  const converted = new Map()

  // Strip the exported node's own baked position/rotation (see the note
  // above) — every mounted instance supplies its own instead. Scale stays:
  // it's the same ~1.104 for every instance of this prop.
  for (const child of root.children) {
    child.position.set(0, 0, 0)
    child.quaternion.identity()
  }

  root.traverse((o) => {
    if (!o.isMesh) return
    const previous = o.material
    // Meshes that shared a source material keep sharing one after the swap.
    let next = converted.get(previous.uuid)
    if (!next) {
      next = convertMaterial(previous)
      converted.set(previous.uuid, next)
      materials.push(next)
    }
    o.material = next
    o.castShadow = false
    o.receiveShadow = false
    // The map (if any) is now ours to keep; dispose only the PBR material.
    previous.dispose()
  })

  return { root, materials }
}

// Loads `url` and returns { root, materials, url }. `root` is ready to add to
// the scene as-is (position it yourself — see the transform note above);
// `materials` is the owned list dispose() needs to walk. A second (or third)
// caller for the same url gets a `root.clone()` instead of a re-fetch/re-parse
// — clones share the original's geometry and material references, so two
// placed copies of one prop cost one draw-call set's worth of GPU memory, not
// two.
export async function loadProp(url) {
  let entry = cache.get(url)
  if (!entry) {
    entry = { promise: loadBase(url), refCount: 0 }
    cache.set(url, entry)
  }
  const base = await entry.promise
  entry.refCount += 1
  const root = entry.refCount === 1 ? base.root : base.root.clone()
  return { root, materials: base.materials, url }
}

// three.js does not GC GPU memory (Tech.md §7). Only the last instance
// mounted from a given url actually frees its geometry/materials.
export function disposeProp(built) {
  if (!built) return
  if (built.root.parent) built.root.parent.remove(built.root)

  const entry = cache.get(built.url)
  if (!entry) return
  entry.refCount -= 1
  if (entry.refCount > 0) return

  built.root.traverse((o) => {
    if (o.geometry) o.geometry.dispose()
  })
  for (const m of built.materials) {
    if (m.map) m.map.dispose()
    m.dispose()
  }
  cache.delete(built.url)
}
