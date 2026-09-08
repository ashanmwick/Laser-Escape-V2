import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { loadProp, disposeProp } from '../systems/propModel.js'
import {
  HEX_POWER_PAD_MODEL_URL,
  HEX_POWER_PAD_OWNED_COLOR,
  HEX_POWER_PAD_EQUIPPED_COLOR,
} from '../data/hexPowerPad.js'
import { useGameStore } from '../store/useGameStore.js'

const ownedColor = new THREE.Color(HEX_POWER_PAD_OWNED_COLOR)
const equippedColor = new THREE.Color(HEX_POWER_PAD_EQUIPPED_COLOR)

// Mounts one instance of the Blender-authored `hex_power_pad` prop (Tech.md
// §6, collection `PowerPad`) at `position`. None of the 15 placed objects
// carry rotation (data/hexPowerPad.js), so there's no rotationY prop here —
// unlike PodiumProp.jsx's power_podium/target_podium pair. propModel.js's
// loader caches by url and strips each load's baked position/rotation, so
// every instance beyond the first clones the base geometry/materials rather
// than re-fetching/re-converting the glTF — but that shared-material clone
// (THREE.Object3D.clone() copies material *references*) is exactly what this
// prop can't use as-is: each of the 15 pads needs its own buy/equip color
// independent of the other 14. So on top of propModel's cache, every mesh's
// material here gets its own clone() the moment it mounts, and that clone
// (never the shared cache entry) is what gets recolored on
// ownedHexPads/equippedHexPad changes below.
export default function HexPowerPadProp({ index, position }) {
  const groupRef = useRef(null)

  useEffect(() => {
    let built = null
    let disposed = false
    let ownMaterials = [] // this instance's own clones — never the shared cache ones
    let originals = [] // each clone's authored color/emissive, captured pre-recolor
    let unsub = null
    let prevOwned
    let prevEquipped

    function applyColor(owned, equipped) {
      const recolor = owned || equipped
      const target = equipped ? equippedColor : ownedColor
      for (let i = 0; i < ownMaterials.length; i++) {
        const m = ownMaterials[i]
        const orig = originals[i]
        // The pad's red comes from its albedo/glow *textures* (propModel.js's
        // comment on hex_power_pad's map+emissiveMap pair), not a uniform
        // tint — color/emissive both convert in at white (a no-op multiplier
        // over the map), so tinting alone can never turn the rendered pixel
        // white. Drop the maps on the owned/equipped clone instead, which
        // exposes the material's flat color/emissive as a solid fill; restore
        // them for the not-owned (still-red, still-textured) state.
        m.map = recolor ? null : orig.map
        m.emissiveMap = recolor ? null : orig.emissiveMap
        m.color.copy(recolor ? target : orig.color)
        if (m.emissive) m.emissive.copy(recolor ? target : orig.emissive)
        // Adding/removing a map changes which shader variant Lambert compiles
        // to (USE_MAP), so the material needs to know to recompile.
        m.needsUpdate = true
      }
    }

    loadProp(HEX_POWER_PAD_MODEL_URL).then((next) => {
      if (disposed || !groupRef.current) {
        disposeProp(next)
        return
      }
      built = next
      built.root.traverse((o) => {
        if (!o.isMesh) return
        const clone = o.material.clone()
        originals.push({
          color: clone.color.clone(),
          emissive: clone.emissive ? clone.emissive.clone() : null,
          map: clone.map || null,
          emissiveMap: clone.emissiveMap || null,
        })
        o.material = clone
        ownMaterials.push(clone)
      })
      groupRef.current.add(built.root)
      // Static once placed (Tech.md §7).
      built.root.traverse((o) => {
        o.matrixAutoUpdate = false
        o.updateMatrix()
      })
      // matrixAutoUpdate is off, so the mount group's own position needs one
      // explicit compose too, or it would render at the origin.
      groupRef.current.updateMatrix()
      groupRef.current.updateMatrixWorld(true)

      const state = useGameStore.getState()
      prevOwned = state.ownedHexPads.has(index)
      prevEquipped = state.equippedHexPad === index
      applyColor(prevOwned, prevEquipped)

      // Plain store subscription, not a React re-render (Tech.md §5.4 style)
      // — this pod only cares about its own owned/equipped bit, so it bails
      // out immediately on any store change that doesn't touch it.
      unsub = useGameStore.subscribe((s) => {
        const owned = s.ownedHexPads.has(index)
        const equipped = s.equippedHexPad === index
        if (owned === prevOwned && equipped === prevEquipped) return
        prevOwned = owned
        prevEquipped = equipped
        applyColor(owned, equipped)
      })
    })

    return () => {
      disposed = true
      if (unsub) unsub()
      for (const m of ownMaterials) m.dispose()
      if (built) disposeProp(built)
    }
  }, [index])

  return <group ref={groupRef} position={position} matrixAutoUpdate={false} />
}
