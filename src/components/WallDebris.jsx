import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { debrisPool } from '../systems/wallDebris.js'
import { DEBRIS_POOL_SIZE, DEBRIS_COLOR, DEBRIS_FADE_PORTION } from '../data/wallDebris.js'

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const quat = new THREE.Quaternion()
const axis = new THREE.Vector3()
const scale = new THREE.Vector3()
const zeroScale = new THREE.Vector3(0, 0, 0)
const matrix = new THREE.Matrix4()

// Presentation only: draws whatever systems/wallDebris.js simulated this frame.
// One InstancedMesh at fixed DEBRIS_POOL_SIZE capacity — dead slots are scaled
// to zero rather than added/removed, so the draw call count and pool never
// change (Tech.md §7). Same shape as LaserParticles.jsx; a Lambert material so
// the chunks pick up the scene's hemisphere + directional light like the walls
// they came from, and fade by shrinking (no per-instance opacity needed).
export default function WallDebris() {
  const meshRef = useRef(null)

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const material = useMemo(
    () => new THREE.MeshLambertMaterial({ color: DEBRIS_COLOR }),
    [],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < DEBRIS_POOL_SIZE; i++) {
      matrix.compose(debrisPool[i].position, quat, zeroScale)
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

    for (let i = 0; i < DEBRIS_POOL_SIZE; i++) {
      const slot = debrisPool[i]
      if (!slot.alive) {
        matrix.compose(slot.position, quat, zeroScale)
        mesh.setMatrixAt(i, matrix)
        continue
      }

      // Tumble about the chunk's fixed spin axis, and over the last
      // DEBRIS_FADE_PORTION of its life shrink toward nothing instead of a pop.
      quat.setFromAxisAngle(axis.copy(slot.axis), slot.angle)
      const t = slot.age / slot.life
      const fade = t > 1 - DEBRIS_FADE_PORTION ? (1 - t) / DEBRIS_FADE_PORTION : 1
      const s = slot.size * fade
      scale.set(s, s, s)
      matrix.compose(slot.position, quat, scale)
      mesh.setMatrixAt(i, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, DEBRIS_POOL_SIZE]}
      matrixAutoUpdate={false}
      frustumCulled={false}
    />
  )
}
