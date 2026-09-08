import { useEffect, useRef } from 'react'
import { loadProp, disposeProp } from '../systems/propModel.js'

// The Blender-authored `power_podium` prop (collection `power_stand`),
// imported as glTF rather than hand-authored (Tech.md §6) — its 558 tris and
// four wood/neon/sign materials are past what's worth re-deriving as code.
// The exported node carries the object's exact Blender transform, so this
// component mounts it unmodified rather than re-specifying position here.
const MODEL_URL = '/models/power_podium.glb'

export default function PowerPodium() {
  const groupRef = useRef(null)

  useEffect(() => {
    let built = null
    let disposed = false

    loadProp(MODEL_URL).then((next) => {
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
      groupRef.current.updateMatrixWorld(true)
    })

    return () => {
      disposed = true
      if (built) disposeProp(built)
    }
  }, [])

  return <group ref={groupRef} matrixAutoUpdate={false} />
}
