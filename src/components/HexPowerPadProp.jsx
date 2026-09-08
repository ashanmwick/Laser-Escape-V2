import { useEffect, useRef } from 'react'
import { loadProp, disposeProp } from '../systems/propModel.js'
import { HEX_POWER_PAD_MODEL_URL } from '../data/hexPowerPad.js'

// Mounts one instance of the Blender-authored `hex_power_pad` prop (Tech.md
// §6, collection `PowerPad`) at `position`. None of the 15 placed objects
// carry rotation (data/hexPowerPad.js), so there's no rotationY prop here —
// unlike PodiumProp.jsx's power_podium/target_podium pair. propModel.js's
// loader caches by url and strips each load's baked position/rotation, so
// every instance beyond the first clones the base geometry/materials rather
// than re-fetching/re-converting the glTF.
export default function HexPowerPadProp({ position }) {
  const groupRef = useRef(null)

  useEffect(() => {
    let built = null
    let disposed = false

    loadProp(HEX_POWER_PAD_MODEL_URL).then((next) => {
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
