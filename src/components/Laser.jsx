import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { laser } from '../systems/laser.js'
import {
  LASER_CORE_COLOR,
  LASER_CORE_RADIUS,
  LASER_FLASH_COLOR,
  LASER_FLASH_OPACITY,
  LASER_FLASH_PULSE_AMOUNT,
  LASER_FLASH_PULSE_SPEED,
  LASER_FLASH_SIZE,
  LASER_GLOW_COLOR,
  LASER_GLOW_OPACITY,
  LASER_GLOW_RADIUS,
} from '../data/laser.js'

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const UP = new THREE.Vector3(0, 1, 0)
const dir = new THREE.Vector3()
const mid = new THREE.Vector3()
const quat = new THREE.Quaternion()

// Presentation only: draws whatever systems/laser.js computed this frame.
// Own root group is tagged laserIgnore so the beam never raycasts against
// itself on the next frame.
export default function Laser() {
  const coreRef = useRef()
  const glowRef = useRef()
  const flashRef = useRef()

  useFrame(({ clock }) => {
    const core = coreRef.current
    const glow = glowRef.current
    const flash = flashRef.current
    if (!core || !glow || !flash) return

    if (!laser.active) {
      core.visible = false
      glow.visible = false
      flash.visible = false
      return
    }

    const { start, end } = laser
    dir.set(end.x - start.x, end.y - start.y, end.z - start.z)
    const length = dir.length()
    if (length < 1e-4) {
      core.visible = false
      glow.visible = false
      flash.visible = false
      return
    }
    dir.normalize()
    quat.setFromUnitVectors(UP, dir)
    mid.set((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2)

    core.visible = true
    glow.visible = true
    core.position.copy(mid)
    glow.position.copy(mid)
    core.quaternion.copy(quat)
    glow.quaternion.copy(quat)
    core.scale.set(1, length, 1)
    glow.scale.set(1, length, 1)

    if (laser.hit) {
      flash.visible = true
      flash.position.set(end.x, end.y, end.z)
      const pulse = 1 + Math.sin(clock.elapsedTime * LASER_FLASH_PULSE_SPEED) * LASER_FLASH_PULSE_AMOUNT
      flash.scale.setScalar(pulse)
    } else {
      flash.visible = false
    }
  })

  return (
    <group userData={{ laserIgnore: true }}>
      <mesh ref={coreRef} visible={false}>
        <cylinderGeometry args={[LASER_CORE_RADIUS, LASER_CORE_RADIUS, 1, 8]} />
        <meshBasicMaterial color={LASER_CORE_COLOR} />
      </mesh>
      <mesh ref={glowRef} visible={false}>
        <cylinderGeometry args={[LASER_GLOW_RADIUS, LASER_GLOW_RADIUS, 1, 8]} />
        <meshBasicMaterial
          color={LASER_GLOW_COLOR}
          transparent
          opacity={LASER_GLOW_OPACITY}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[LASER_FLASH_SIZE, 8, 8]} />
        <meshBasicMaterial
          color={LASER_FLASH_COLOR}
          transparent
          opacity={LASER_FLASH_OPACITY}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
