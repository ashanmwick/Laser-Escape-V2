import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ragdollPool } from '../systems/ragdoll.js'
import { RAGDOLL_POOL_SIZE, RAGDOLL_FADE_PORTION } from '../data/ragdoll.js'
import { MATERIAL_PBR } from '../data/materials.js'

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const quat = new THREE.Quaternion()
const axis = new THREE.Vector3()
const scale = new THREE.Vector3()
const zeroScale = new THREE.Vector3(0, 0, 0)
const matrix = new THREE.Matrix4()

// Presentation only: draws whatever systems/ragdoll.js simulated this frame.
// One InstancedMesh at fixed RAGDOLL_POOL_SIZE capacity — dead slots are
// scaled to zero rather than added/removed, so the draw call count and pool
// never change (Tech.md §7). Same shape as WallDebris.jsx, plus a per-instance
// color (head vs. body tone) since every death sprays two different tints
// from one shared geometry/material.
export default function Ragdoll() {
  const meshRef = useRef(null)

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ ...MATERIAL_PBR.FLAT_PLACEHOLDER }),
    [],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < RAGDOLL_POOL_SIZE; i++) {
      matrix.compose(ragdollPool[i].position, quat, zeroScale)
      mesh.setMatrixAt(i, matrix)
      mesh.setColorAt(i, ragdollPool[i].color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    let colorDirty = false
    for (let i = 0; i < RAGDOLL_POOL_SIZE; i++) {
      const slot = ragdollPool[i]
      if (!slot.alive) {
        matrix.compose(slot.position, quat, zeroScale)
        mesh.setMatrixAt(i, matrix)
        continue
      }

      // Tumble about the part's fixed spin axis, and over the last
      // RAGDOLL_FADE_PORTION of its life shrink toward nothing instead of a pop.
      quat.setFromAxisAngle(axis.copy(slot.axis), slot.angle)
      const t = slot.age / slot.life
      const fade = t > 1 - RAGDOLL_FADE_PORTION ? (1 - t) / RAGDOLL_FADE_PORTION : 1
      scale.copy(slot.size).multiplyScalar(fade)
      matrix.compose(slot.position, quat, scale)
      mesh.setMatrixAt(i, matrix)
      mesh.setColorAt(i, slot.color)
      colorDirty = true
    }
    mesh.instanceMatrix.needsUpdate = true
    if (colorDirty && mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, RAGDOLL_POOL_SIZE]}
      matrixAutoUpdate={false}
      frustumCulled={false}
      castShadow
    />
  )
}
