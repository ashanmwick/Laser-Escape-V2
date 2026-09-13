import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { loadProp, disposeProp } from '../systems/propModel.js'
import { createHexPowerPadMaterial } from '../systems/hexPowerPadPattern.js'
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
// carry rotation (data/hexPowerPad.js), so there's no rotationY prop here.
// propModel.js's loader still fetches/converts the glTF (geometry, and a
// texture-backed material this component never uses) and caches it by url,
// so every instance beyond the first clones the base geometry rather than
// re-fetching/re-converting — but each mesh here gets its own
// createHexPowerPadMaterial() the moment it mounts (systems/
// hexPowerPadPattern.js — a from-scratch procedural recreation of the
// loaded material's ring/glow pattern, not a clone of it), since each of the
// 15 pads needs its own buy/equip color independent of the other 14.
export default function HexPowerPadProp({ index, position }) {
  const groupRef = useRef(null)

  useEffect(() => {
    let built = null
    let disposed = false
    let ownMaterials = [] // this instance's own procedural materials
    let unsub = null
    let prevOwned
    let prevEquipped

    function applyColor(owned, equipped) {
      const recolor = owned || equipped
      const target = equipped ? equippedColor : ownedColor
      for (const m of ownMaterials) {
        const u = m.userData.hexPadUniforms
        u.uRecolor.value = recolor ? 1 : 0
        u.uTargetColor.value.copy(target)
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
        const material = createHexPowerPadMaterial()
        o.material = material
        ownMaterials.push(material)
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
