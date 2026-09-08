// Laser impact sparks (Tech.md §5.1 style: framework-free, mutable singleton
// pool, stepped once per frame from GameLoop). Reads systems/laser.js's hit
// point + normal and simulates a fixed-size pool of spark particles that
// react to whatever surface the beam lands on — no per-object tagging needed,
// since it rides the same raycast laser.js already performs against the
// whole scene.
import * as THREE from 'three'
import { laser } from './laser.js'
import {
  SPARK_POOL_SIZE,
  SPARK_SPAWN_RATE,
  SPARK_BURST_COUNT,
  SPARK_LIFETIME_MIN,
  SPARK_LIFETIME_MAX,
  SPARK_SPEED_MIN,
  SPARK_SPEED_MAX,
  SPARK_LATERAL_SPREAD,
  SPARK_GRAVITY,
  SPARK_SIZE_MIN,
  SPARK_SIZE_MAX,
  IMPACT_POSITION_TOLERANCE,
} from '../data/laserParticles.js'

function makeSlot() {
  return {
    alive: false,
    age: 0,
    life: 0,
    size: 0,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
  }
}

// Fixed-size pool, allocated once and reused for the life of the game — never
// grown/shrunk, never per-frame allocated (Tech.md §7). LaserParticles.jsx
// reads this each frame to draw the live slots.
export const sparkPool = []
for (let i = 0; i < SPARK_POOL_SIZE; i++) sparkPool.push(makeSlot())

let nextSlot = 0 // round-robin write cursor — spawning just recycles the oldest slot
let spawnAccumulator = 0
let hasLastPoint = false
let lastObject = null
let lastInstanceId = -1

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const lastPoint = new THREE.Vector3()
const normal = new THREE.Vector3()
const tangent1 = new THREE.Vector3()
const tangent2 = new THREE.Vector3()
const velocity = new THREE.Vector3()
const ARBITRARY_UP = new THREE.Vector3(0, 1, 0)
const ARBITRARY_RIGHT = new THREE.Vector3(1, 0, 0)

function spawnSpark(point, n) {
  const slot = sparkPool[nextSlot]
  nextSlot = (nextSlot + 1) % SPARK_POOL_SIZE

  // Outward-facing basis around the surface normal, so sparks spray away
  // from whatever they hit — a wall throws sparks sideways, a floor throws
  // them up, purely from the normal captured by systems/laser.js.
  const upRef = Math.abs(n.y) > 0.95 ? ARBITRARY_RIGHT : ARBITRARY_UP
  tangent1.crossVectors(upRef, n).normalize()
  tangent2.crossVectors(n, tangent1)

  const speed = SPARK_SPEED_MIN + Math.random() * (SPARK_SPEED_MAX - SPARK_SPEED_MIN)
  const lateralA = (Math.random() * 2 - 1) * SPARK_LATERAL_SPREAD
  const lateralB = (Math.random() * 2 - 1) * SPARK_LATERAL_SPREAD

  velocity.copy(n).multiplyScalar(speed)
  velocity.addScaledVector(tangent1, lateralA)
  velocity.addScaledVector(tangent2, lateralB)

  slot.alive = true
  slot.age = 0
  slot.life = SPARK_LIFETIME_MIN + Math.random() * (SPARK_LIFETIME_MAX - SPARK_LIFETIME_MIN)
  slot.size = SPARK_SIZE_MIN + Math.random() * (SPARK_SIZE_MAX - SPARK_SIZE_MIN)
  slot.position.copy(point)
  slot.velocity.copy(velocity)
}

export function step(dt) {
  const contact = laser.active && laser.hit

  if (contact) {
    const hx = laser.end.x
    const hy = laser.end.y
    const hz = laser.end.z

    // "Same point" tracking: same object (and instance, for InstancedMesh
    // props) as last frame counts as continuous contact outright; a small
    // position tolerance additionally smooths the instant an InstancedMesh
    // hit crosses from one instance to its neighbor mid-surface. Continuous
    // contact means no restart — just the steady trickle below.
    let sameSpot = false
    if (hasLastPoint && lastObject === laser.hitObject) {
      const dx = hx - lastPoint.x
      const dy = hy - lastPoint.y
      const dz = hz - lastPoint.z
      const distSq = dx * dx + dy * dy + dz * dz
      sameSpot =
        lastInstanceId === laser.hitInstanceId ||
        distSq <= IMPACT_POSITION_TOLERANCE * IMPACT_POSITION_TOLERANCE
    }

    normal.set(laser.normal.x, laser.normal.y, laser.normal.z)
    lastPoint.set(hx, hy, hz)
    lastObject = laser.hitObject
    lastInstanceId = laser.hitInstanceId
    hasLastPoint = true

    if (!sameSpot) {
      // Fresh contact on a new surface/point — an immediate burst reads as
      // an impact, distinct from the steady trickle while holding position.
      for (let i = 0; i < SPARK_BURST_COUNT; i++) spawnSpark(lastPoint, normal)
      spawnAccumulator = 0
    }

    spawnAccumulator += SPARK_SPAWN_RATE * dt
    if (spawnAccumulator > SPARK_POOL_SIZE) spawnAccumulator = SPARK_POOL_SIZE
    while (spawnAccumulator >= 1) {
      spawnSpark(lastPoint, normal)
      spawnAccumulator -= 1
    }
  } else {
    // Laser off target: stop spawning. Already-alive sparks are left to run
    // out their own (0.15-0.35s) lifetime below instead of being cut off,
    // which reads as a fade rather than an abrupt stop.
    hasLastPoint = false
    lastObject = null
    lastInstanceId = -1
    spawnAccumulator = 0
  }

  for (let i = 0; i < SPARK_POOL_SIZE; i++) {
    const slot = sparkPool[i]
    if (!slot.alive) continue
    slot.age += dt
    if (slot.age >= slot.life) {
      slot.alive = false
      continue
    }
    slot.velocity.y -= SPARK_GRAVITY * dt
    slot.position.addScaledVector(slot.velocity, dt)
  }
}
