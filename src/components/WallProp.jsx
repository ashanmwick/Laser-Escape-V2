import { useEffect, useRef } from 'react'
import { loadProp, disposeProp } from '../systems/propModel.js'

// Mounts one Blender-authored wall prop (Tech.md §6, collection `wall`) at
// `position`, turned `rotationY` radians around the up axis. Like
// TargetProp.jsx, `url` is a prop rather than a hardcoded import — the ten
// wall objects are each their own mesh/material (data/wallProps.js) — and
// like PodiumProp.jsx, rotation is applied to the mount group because
// propModel.js's loader strips the glTF's baked position/rotation on load
// (every one of these ten shares the same authored yaw).
export default function WallProp({ url, position, rotationY = 0 }) {
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
      // matrixAutoUpdate is off, so the mount group's own position/rotation
      // need one explicit compose too, or it would render at the origin.
      groupRef.current.updateMatrix()
      groupRef.current.updateMatrixWorld(true)
    })

    return () => {
      disposed = true
      if (built) disposeProp(built)
    }
  }, [url])

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      matrixAutoUpdate={false}
    />
  )
}
