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
// The prop's transform is never touched: the exporter bakes the Blender
// object's exact position/rotation/scale into the glTF node, so the loaded
// scene lands in the same spot the .blend file placed it.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltfLoader = new GLTFLoader()

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

// Loads `url` and returns { root, materials }. `root` is ready to add to the
// scene as-is; `materials` is the owned list dispose() needs to walk.
export async function loadProp(url) {
  const gltf = await gltfLoader.loadAsync(url)
  const root = gltf.scene
  const materials = []
  const converted = new Map()

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

// three.js does not GC GPU memory (Tech.md §7).
export function disposeProp(built) {
  if (!built) return
  built.root.traverse((o) => {
    if (o.geometry) o.geometry.dispose()
  })
  for (const m of built.materials) {
    if (m.map) m.map.dispose()
    m.dispose()
  }
  if (built.root.parent) built.root.parent.remove(built.root)
}
