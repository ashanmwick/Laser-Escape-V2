import { useEffect, useRef } from 'react'
import { loadProp, disposeProp } from '../systems/propModel.js'
import { GLOW_FLOOR_PANEL_MODEL_URL } from '../data/glowFloorPanel.js'

// Mounts one instance of the Blender-authored `glow_floor_panel` prop
// (Tech.md §6, collection `WinPanel`) at `position`. None of the 8 placed
// objects carry rotation (data/glowFloorPanel.js), so there's no rotationY
// prop here — same shape as HexPowerPadProp.jsx.
export default function GlowFloorPanelProp({ position }) {
  const groupRef = useRef(null)

  useEffect(() => {
    let built = null
    let disposed = false

    loadProp(GLOW_FLOOR_PANEL_MODEL_URL).then((next) => {
      if (disposed || !groupRef.current) {
        disposeProp(next)
        return
      }
      built = next
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
    })

    return () => {
      disposed = true
      if (built) disposeProp(built)
    }
  }, [])

  return <group ref={groupRef} position={position} matrixAutoUpdate={false} />
}
