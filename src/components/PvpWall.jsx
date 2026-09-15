import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import {
  PVP_WALL_POSITION,
  PVP_WALL_ROTATION_Y,
  PVP_WALL_SIZE,
  PVP_WALL_CENTER_Y,
  PVP_WALL_MATERIAL,
  PVP_WALL_SIGN,
  PVP_WALL_SIGN_GAP,
} from '../data/pvpWall.js'
import { MATERIAL_PBR } from '../data/materials.js'

// Mounts the code-generated `pvp_wall` prop: a single flat glass panel in the
// Pvp area (data/pvpBlocks.js). Same shape as PodiumStage.jsx/MerchantShop.jsx
// — build the mesh once under a mount group carrying this prop's world
// transform, freeze the matrix (Tech.md §7 — static once placed), and dispose
// on unmount (three.js does not GC GPU memory).
//
// Every tunable number — placement, size, colour, opacity — lives in
// data/pvpWall.js. The look is an alpha-blended, low-roughness dielectric
// MeshStandardMaterial (still no transmission/refraction, just transparency
// plus a specular response now), unlike wallProps.js's own "Glass" wall type,
// whose baked Alpha never actually reached the game (see that file's header)
// — this one really is see-through.
//
// Unlike wallProps.js's 63 panels, pvp_wall has no health and never breaks —
// no WallHealthBars entry, no wallHealth.js tracking. It carries a static
// sign instead (Tech.md §1: drei's SDF <Text>), on the hub/spawn-side face
// (see PVP_WALL_SIGN_TEXT's comment in data/pvpWall.js).
export default function PvpWall() {
  const groupRef = useRef(null)

  useEffect(() => {
    const mount = groupRef.current
    if (!mount) return

    const geometry = new THREE.BoxGeometry(
      PVP_WALL_SIZE.width,
      PVP_WALL_SIZE.height,
      PVP_WALL_SIZE.depth,
    )
    const material = new THREE.MeshStandardMaterial({
      color: PVP_WALL_MATERIAL.color,
      transparent: true,
      opacity: PVP_WALL_MATERIAL.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      ...MATERIAL_PBR.GLASS,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(0, PVP_WALL_CENTER_Y, 0)
    // No castShadow: a depthWrite:false transparent panel casting a hard
    // shadow would read as an opaque silhouette from something meant to be
    // see-through. receiveShadow stays on so the player's own shadow can
    // still fall across it.
    mesh.castShadow = false
    mesh.receiveShadow = true
    mount.add(mesh)

    mount.traverse((o) => {
      o.matrixAutoUpdate = false
      o.updateMatrix()
    })
    mount.updateMatrix()
    mount.updateMatrixWorld(true)

    return () => {
      mount.remove(mesh)
      geometry.dispose()
      material.dispose()
    }
  }, [])

  return (
    <group
      ref={groupRef}
      position={PVP_WALL_POSITION}
      rotation={[0, PVP_WALL_ROTATION_Y, 0]}
      matrixAutoUpdate={false}
    >
      {/* Local -Z, turned 180° about Y to read correctly — see
          data/pvpWall.js's comment on PVP_WALL_SIGN for why this is the
          panel's "other side" (the hub/spawn face). */}
      <group
        position={[0, PVP_WALL_CENTER_Y, -(PVP_WALL_SIZE.depth / 2 + PVP_WALL_SIGN_GAP)]}
        rotation={[0, Math.PI, 0]}
      >
        <Text
          fontSize={PVP_WALL_SIGN.titleSize}
          fontWeight="bold"
          color={PVP_WALL_SIGN.titleColor}
          outlineWidth={0.12}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
        >
          {PVP_WALL_SIGN.title}
        </Text>
        <Text
          position={[0, -PVP_WALL_SIGN.subtitleGap, 0]}
          fontSize={PVP_WALL_SIGN.subtitleSize}
          color={PVP_WALL_SIGN.subtitleColor}
          outlineWidth={0.06}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
        >
          {PVP_WALL_SIGN.subtitle}
        </Text>
      </group>
    </group>
  )
}
