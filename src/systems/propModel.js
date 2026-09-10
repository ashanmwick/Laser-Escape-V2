// Loads a Blender-authored prop glTF (Tech.md §6) and converts its materials
// at the load boundary. Framework-free (Tech.md rule 2).
//
// glTF materials arrive as MeshStandardMaterial; Tech.md §7 permits only
// MeshLambertMaterial / MeshBasicMaterial — PBR costs fragment time a phone
// does not have. Three cases, by what the source actually carries:
//  - emissive with no base map (a neon sign, a glow strip) becomes unlit
//    MeshBasicMaterial, the same "glow without bloom" trick the laser beam
//    uses.
//  - emissive *with* a base map (hex_power_pad's albedo pattern plus a
//    separate glow texture) becomes Lambert carrying both channels —
//    collapsing this to Basic-on-emissive-only, as the case above does,
//    would flatten the pad's surface pattern to a solid glow.
//  - everything else becomes Lambert, keeping its baseColor map if it has
//    one.
// This rule is enforced here, not assumed, exactly as avatarModel.js
// enforces it for remote avatar glTFs.
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

// preloadProp() / preloadPropParts() (systems/preload.js, behind the loading
// screen) warm this before the scene mounts; three's file cache is what keeps
// the later real load from going back to the network for the same glTF.
THREE.Cache.enabled = true

// Keyed by url: the same source glTF reused by more than one placed instance
// (e.g. target_podium duplicating power_podium) is fetched and converted once
// — refCount frees the shared geometry/materials only once every instance
// mounted from that url has been disposed.
const cache = new Map()

function convertMaterial(source) {
  const isEmissive = source.emissive && source.emissive.getHex() !== 0x000000
  if (isEmissive && source.map) {
    return new THREE.MeshLambertMaterial({
      map: source.map,
      color: source.color ? source.color.clone() : new THREE.Color(0xffffff),
      emissive: source.emissive.clone(),
      emissiveMap: source.emissiveMap || null,
      emissiveIntensity: source.emissiveIntensity ?? 1,
      side: source.side,
    })
  }
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
//
// refCount is reserved SYNCHRONOUSLY, before the await: an in-flight
// acquisition must hold a reference so a concurrent disposeProp (React
// StrictMode mounts every effect twice, so a resolve can land after this
// consumer's own cleanup) cannot tear the shared entry down and leave the
// remount holding disposed geometry. On a load failure the reservation is
// released so a 404 can't pin a dead entry.
export async function loadProp(url) {
  let entry = cache.get(url)
  if (!entry) {
    entry = { promise: loadBase(url), refCount: 0 }
    cache.set(url, entry)
  }
  entry.refCount += 1
  let base
  try {
    base = await entry.promise
  } catch (err) {
    entry.refCount -= 1
    if (entry.refCount <= 0 && cache.get(url) === entry) cache.delete(url)
    throw err
  }
  const root = entry.refCount === 1 ? base.root : base.root.clone()
  return { root, materials: base.materials, url }
}

// Warms the cache for `url` without taking a reference: no refCount bump and
// no clone. The first real loadProp(url) caller still sees entry.refCount === 1
// and gets the original root; every caller after that gets a clone — exactly
// the behaviour as if the preload had never run. systems/preload.js calls this
// for every hub prop so the loading screen shows real progress and the frame
// behind it is already populated. Rejects the same way loadProp would on a 404.
export function preloadProp(url) {
  let entry = cache.get(url)
  if (!entry) {
    entry = { promise: loadBase(url), refCount: 0 }
    cache.set(url, entry)
  }
  return entry.promise
}

// Loads `url` and returns its converted mesh parts directly — `{ geometry,
// material }` per primitive — rather than a mountable scene root. Meant for
// callers building their own InstancedMesh (e.g. GrassBlocks.jsx) where
// every instance shares one geometry/material pair and there is no per-call
// clone/refCount bookkeeping to do: the caller loads once, owns the parts
// for its own lifetime, and disposes them itself. Not routed through the
// `cache`/loadBase pair above — that cache exists to let loadProp() hand out
// `root.clone()`s to multiple scene-mounted instances, which an
// InstancedMesh consumer has no use for.
export async function loadPropParts(url) {
  const gltf = await gltfLoader.loadAsync(url)
  const converted = new Map()
  const parts = []
  const materials = []
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return
    const previous = o.material
    let next = converted.get(previous.uuid)
    if (!next) {
      next = convertMaterial(previous)
      converted.set(previous.uuid, next)
      materials.push(next)
    }
    previous.dispose()
    parts.push({ geometry: o.geometry, material: next })
  })
  return { parts, materials }
}

// The loadPropParts() counterpart of preloadProp(): loadPropParts consumers
// own and dispose their own parts, so there is no module cache to fill here —
// this just runs the fetch + parse through three's file cache. GrassBlocks'
// own loadPropParts() call then resolves from that cache instead of the
// network; the scene parsed here is never rendered, so it holds no GPU memory
// and is left for GC.
export function preloadPropParts(url) {
  return gltfLoader.loadAsync(url)
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
    if (m.emissiveMap) m.emissiveMap.dispose()
    m.dispose()
  }
  cache.delete(built.url)
}
