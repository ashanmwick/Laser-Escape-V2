import { useEffect, useRef } from 'react'
import { loadProp, disposeProp } from '../systems/propModel.js'
import { TREE_MODEL_URL } from '../data/tree.js'

// Mounts one instance of the Blender-authored `tree_lowpoly_canopy_bright`
// prop (Tech.md §6) at `transform` — App.jsx maps this over every entry in
// data/tree.js TREE_TRANSFORMS (one per tree_lowpoly_canopy_bright object
// found in World.blend), same shape as WoodCrateStack.jsx. propModel.js's
// loader strips the glTF's baked position/rotation on load, so this group's
// own transform is what actually places and turns it; matrices are frozen
// once mounted since a tree never moves (Tech.md §7). The loader also caches
// by url, so every instance beyond the first clones the shared geometry
// rather than re-fetching/re-converting it.
export default function TreeProp({ transform }) {
  const groupRef = useRef(null)

  useEffect(() => {
    let built = null
    let disposed = false

    loadProp(TREE_MODEL_URL).then((next) => {
      if (disposed || !groupRef.current) {
        disposeProp(next)
        return
      }
      built = next
      groupRef.current.add(built.root)
      built.root.traverse((o) => {
        o.matrixAutoUpdate = false
        o.updateMatrix()
      })
      // matrixAutoUpdate is off, so the mount group's own transform needs one
      // explicit compose too, or it would render at the origin.
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
      position={[transform.x, transform.y, transform.z]}
      rotation={[0, transform.yaw, 0]}
      scale={transform.scale}
      matrixAutoUpdate={false}
    />
  )
}
