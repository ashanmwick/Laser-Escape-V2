import { useEffect, useRef } from 'react'
import { loadProp, disposeProp } from '../systems/propModel.js'

// Mounts one Blender-authored target prop (Tech.md §6, collection `Targets`)
// at `position`. Unlike HexPowerPadProp.jsx, `url` is a prop rather than a
// hardcoded import — the nine target objects are each their own
// mesh/material (data/targets.js), not duplicates of one shared source —
// but the mount/dispose flow is identical: propModel.js's loader strips the
// glTF's baked position/rotation on load, so this group's own transform is
// what actually places it. `scale` multiplies the glTF's own baked scale
// (propModel.js leaves that alone) — data/targets.js TARGET_SCALE is what
// actually sets it, uniformly, for all nine.
export default function TargetProp({ url, position, scale = 1 }) {
  const groupRef = useRef(null)

  useEffect(() => {
    let built = null
    let disposed = false

    loadProp(url).then((next) => {
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
  }, [url])

  return <group ref={groupRef} position={position} scale={scale} matrixAutoUpdate={false} />
}
