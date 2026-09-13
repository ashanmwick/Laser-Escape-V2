import { useEffect, useRef } from 'react'
import { buildWoodCrateStack } from '../systems/woodCrateModel.js'
import { WOOD_CRATE_TRANSFORM } from '../data/woodCrate.js'

// Mounts the code-generated wooden crate stack (the `wood_crate` prop). Same
// shape as PodiumStage.jsx: build the root once, add it under a mount group
// carrying this prop's world transform, freeze all matrices (Tech.md §7 —
// static once placed), and dispose geometry / materials on unmount (three.js
// does not GC GPU memory).
//
// Every tunable number — placement, crate layout, palette — lives in
// data/woodCrate.js; systems/woodCrateModel.js is the framework-free builder
// and systems/woodCrateAtlas.js paints its one texture. The collider comes
// from WOOD_CRATE_AABBS in the same data file — added to HUB_AABBS
// (data/hub.js) the way PODIUM_STAGE_HUB_AABBS is.
export default function WoodCrateStack({ transform = WOOD_CRATE_TRANSFORM }) {
  const groupRef = useRef(null)

  useEffect(() => {
    const mount = groupRef.current
    if (!mount) return

    const built = buildWoodCrateStack()
    mount.add(built.root)
    built.root.traverse((o) => {
      o.matrixAutoUpdate = false
      o.updateMatrix()
    })
    mount.updateMatrix()
    mount.updateMatrixWorld(true)

    return () => {
      mount.remove(built.root)
      built.dispose()
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
