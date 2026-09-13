import { useEffect, useRef } from 'react'
import { loadProp, disposeProp } from '../systems/propModel.js'
import { PODIUM_MODEL_URL } from '../data/podium.js'

// Mounts one instance of the Blender-authored `power_podium` prop (Tech.md
// §6) at `position`, turned `rotationY` radians around the up axis. Used by
// target_podium (see data/podium.js); the standalone power_podium instance
// has since been retired in favour of the code-generated PodiumStage prop.
// propModel.js's loader caches by url and strips each load's baked
// position/rotation, so an instance can be placed and turned independently
// of the mesh's own authored transform.
export default function PodiumProp({ position, rotationY = 0 }) {
  const groupRef = useRef(null)

  useEffect(() => {
    let built = null
    let disposed = false

    loadProp(PODIUM_MODEL_URL).then((next) => {
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
      // matrixAutoUpdate is off, so the mount group's own position/rotation
      // need one explicit compose too, or it would render at the origin.
      groupRef.current.updateMatrix()
      groupRef.current.updateMatrixWorld(true)
    })

    return () => {
      disposed = true
      if (built) disposeProp(built)
    }
  }, [])

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      matrixAutoUpdate={false}
    />
  )
}
