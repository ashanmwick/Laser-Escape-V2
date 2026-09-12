import { useEffect, useRef } from 'react'
import { buildPodiumStage } from '../systems/podiumStageModel.js'
import { PODIUM_STAGE_TRANSFORM } from '../data/podiumStage.js'

// Mounts the code-generated wooden tiered display stage (the `podium_stage`
// prop). Same shape as MerchantShop.jsx: build the root once, add it under a
// mount group carrying this prop's world transform, freeze all matrices
// (Tech.md §7 — static once placed), and dispose geometry / materials on
// unmount (three.js does not GC GPU memory).
//
// Every tunable number — placement, the step profile, trim, sign and palette —
// lives in data/podiumStage.js; systems/podiumStageModel.js is the
// framework-free builder and systems/podiumStageAtlas.js paints its one
// texture. The collider comes from PODIUM_STAGE_AABBS in the same data file:
// add it to HUB_AABBS (data/hub.js) when this prop is placed in the hub, the
// way MERCHANT_SHOP_AABBS is.
export default function PodiumStage({ transform = PODIUM_STAGE_TRANSFORM }) {
  const groupRef = useRef(null)

  useEffect(() => {
    const mount = groupRef.current
    if (!mount) return

    const built = buildPodiumStage()
    mount.add(built.root)
    built.root.traverse((o) => {
      o.matrixAutoUpdate = false
      o.updateMatrix()
    })
    // matrixAutoUpdate is off on the mount group too, so its own
    // position/rotation/scale need one explicit compose.
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
