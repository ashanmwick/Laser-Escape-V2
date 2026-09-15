// Builder for the `wood_crate` prop — three stacked wooden crates.
// Framework-free (Tech.md rule 2): pure three.js, no React import.
// components/WoodCrateStack.jsx calls buildWoodCrateStack() once, adds the
// returned root to a mount group, and calls dispose() on teardown (three.js
// does not GC GPU memory — Tech.md §7).
//
// The three crates share one texture (systems/woodCrateAtlas.js) and one
// MeshStandardMaterial, so their box geometries are merged into a single
// mesh — Tech.md §7's "static and unique is merged into one geometry per
// material" — landing the whole stack at one draw call.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CRATE_SIZE, CRATE_INSTANCES } from '../data/woodCrate.js'
import { getWoodCrateAtlas } from './woodCrateAtlas.js'
import { MATERIAL_PBR } from '../data/materials.js'

export function buildWoodCrateStack() {
  const geometries = CRATE_INSTANCES.map((c) => {
    const geo = new THREE.BoxGeometry(CRATE_SIZE, CRATE_SIZE, CRATE_SIZE)
    geo.rotateY(c.yaw)
    geo.translate(c.x, c.y, c.z)
    return geo
  })
  const merged = mergeGeometries(geometries)
  geometries.forEach((g) => g.dispose())

  const material = new THREE.MeshStandardMaterial({ map: getWoodCrateAtlas(), ...MATERIAL_PBR.WOOD })
  const mesh = new THREE.Mesh(merged, material)
  mesh.name = 'wood_crate_stack'
  // Gated at the Canvas/light level by graphics_quality — static and cheap
  // (merged, one draw call), so safe to set unconditionally.
  mesh.castShadow = true
  mesh.receiveShadow = true

  const root = new THREE.Group()
  root.name = 'WoodCrateStack'
  root.add(mesh)

  return {
    root,
    dispose() {
      merged.dispose()
      material.dispose()
    },
  }
}
