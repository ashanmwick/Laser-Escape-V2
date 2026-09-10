import { useEffect, useRef } from 'react'
import { buildMerchantShop } from '../systems/merchantShopModel.js'
import { SHOP_TRANSFORM } from '../data/merchantShop.js'

// Mounts the code-generated "AURA" crystal-merchant stall beside the target
// podium (data/podium.js). Same shape as PodiumProp.jsx: build the root once,
// add it under a mount group carrying this prop's world transform, freeze all
// matrices (Tech.md §7 — static once placed), and dispose the geometry /
// materials on unmount (three.js does not GC GPU memory).
//
// Every tunable number — placement, dimensions, palette, the wares and the
// merchant — lives in data/merchantShop.js; systems/merchantShopModel.js is
// the framework-free builder. The collider reads MERCHANT_SHOP_AABBS from the
// same data file (wired into data/hub.js).
export default function MerchantShop() {
  const groupRef = useRef(null)

  useEffect(() => {
    const mount = groupRef.current
    if (!mount) return

    const built = buildMerchantShop()
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
      position={[SHOP_TRANSFORM.x, SHOP_TRANSFORM.y, SHOP_TRANSFORM.z]}
      rotation={[0, SHOP_TRANSFORM.yaw, 0]}
      scale={SHOP_TRANSFORM.scale}
      matrixAutoUpdate={false}
    />
  )
}
