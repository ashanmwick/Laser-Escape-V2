import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sparkPool } from '../systems/laserParticles.js'
import { SPARK_POOL_SIZE, SPARK_COLOR } from '../data/laserParticles.js'

// Stretch factor along the direction of travel — reads as a short streak
// rather than a round dot, echoing the laser beam's own cylinder-as-line look.
const STREAK_LENGTH = 3

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const UP = new THREE.Vector3(0, 1, 0)
const dir = new THREE.Vector3()
const quat = new THREE.Quaternion()
const scale = new THREE.Vector3()
const zeroScale = new THREE.Vector3(0, 0, 0)
const matrix = new THREE.Matrix4()

// Presentation only: draws whatever systems/laserParticles.js simulated this
// frame. One InstancedMesh at fixed SPARK_POOL_SIZE capacity — dead slots are
// scaled to zero rather than added/removed, so the draw call count and pool
// never change (Tech.md §7: no per-frame allocation, no growing buffers).
export default function LaserParticles() {
  const meshRef = useRef(null)

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: SPARK_COLOR,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    [],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < SPARK_POOL_SIZE; i++) {
      matrix.compose(sparkPool[i].position, quat, zeroScale)
      mesh.setMatrixAt(i, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
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

    for (let i = 0; i < SPARK_POOL_SIZE; i++) {
      const slot = sparkPool[i]
      if (!slot.alive) {
        matrix.compose(slot.position, quat, zeroScale)
        mesh.setMatrixAt(i, matrix)
        continue
      }

      // Fades by shrinking toward the end of its life instead of an abrupt
      // pop, and orients along its current velocity so it reads as a streak
      // flying outward from the impact.
      const fade = 1 - slot.age / slot.life
      dir.copy(slot.velocity)
      if (dir.lengthSq() > 1e-6) {
        dir.normalize()
        quat.setFromUnitVectors(UP, dir)
      }
      const s = slot.size * fade
      scale.set(s, s * STREAK_LENGTH, s)
      matrix.compose(slot.position, quat, scale)
      mesh.setMatrixAt(i, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, SPARK_POOL_SIZE]}
      matrixAutoUpdate={false}
      frustumCulled={false}
    />
  )
}
