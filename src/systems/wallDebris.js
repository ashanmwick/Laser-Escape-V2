// Wall-break debris (Tech.md §5.1 style: framework-free, mutable singleton pool,
// stepped once per frame from GameLoop). Pure cosmetics — a wall that drains to
// 0 health calls spawnBurst() from systems/wallHealth.js right next to
// removeAabb()/destroyWall(), and this module tumbles a fixed pool of chunks
// under gravity until each ages out. Nothing here touches collision or the
// store; WallDebris.jsx just draws whatever slots are alive.
import * as THREE from 'three'
import { WALL_AABBS } from '../data/wallProps.js'
import {
  DEBRIS_POOL_SIZE,
  DEBRIS_BURST_COUNT,
  DEBRIS_LIFETIME_MIN,
  DEBRIS_LIFETIME_MAX,
  DEBRIS_SPEED_MIN,
  DEBRIS_SPEED_MAX,
  DEBRIS_UP_BIAS,
  DEBRIS_GRAVITY,
  DEBRIS_SPIN_MIN,
  DEBRIS_SPIN_MAX,
  DEBRIS_SIZE_MIN,
  DEBRIS_SIZE_MAX,
  DEBRIS_FLOOR_BOUNCE,
  DEBRIS_FLOOR_DRAG,
  DEBRIS_FLOOR_SPIN_DRAG,
} from '../data/wallDebris.js'

// Per-wall spawn volume, derived once from the same collider boxes the walls
// use (data/wallProps.js WALL_AABBS). A break scatters chunks from random
// points inside the wall's box and lets them fall no lower than its base.
const WALL_BOUNDS = {}
for (const a of WALL_AABBS) {
  WALL_BOUNDS[a.id] = {
    cx: (a.min.x + a.max.x) / 2,
    cy: (a.min.y + a.max.y) / 2,
    cz: (a.min.z + a.max.z) / 2,
    hx: (a.max.x - a.min.x) / 2,
    hy: (a.max.y - a.min.y) / 2,
    hz: (a.max.z - a.min.z) / 2,
    floorY: a.min.y,
  }
}

function makeSlot() {
  return {
    alive: false,
    age: 0,
    life: 0,
    size: 0,
    floorY: 0,
    spin: 0,
    angle: 0,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    axis: new THREE.Vector3(0, 1, 0),
  }
}

// Fixed-size pool, allocated once and reused for the life of the game — never
// grown/shrunk, never per-frame allocated (Tech.md §7). WallDebris.jsx reads
// this each frame to draw the live slots.
export const debrisPool = []
for (let i = 0; i < DEBRIS_POOL_SIZE; i++) debrisPool.push(makeSlot())

let nextSlot = 0 // round-robin write cursor — a burst just recycles the oldest slots

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const dir = new THREE.Vector3()

// One wall's worth of rubble: DEBRIS_BURST_COUNT chunks sprayed from inside the
// wall's box, biased back toward the approach face and lofted upward. Called
// once from systems/wallHealth.js the frame the wall's health hits 0.
export function spawnBurst(id) {
  const b = WALL_BOUNDS[id]
  if (!b) return

  for (let i = 0; i < DEBRIS_BURST_COUNT; i++) {
    const slot = debrisPool[nextSlot]
    nextSlot = (nextSlot + 1) % DEBRIS_POOL_SIZE

    slot.position.set(
      b.cx + (Math.random() * 2 - 1) * b.hx,
      b.cy + (Math.random() * 2 - 1) * b.hy,
      b.cz + (Math.random() * 2 - 1) * b.hz,
    )

    // Mostly toward -X (where the player and beam are), some upward, a little
    // side-to-side; normalise then scale so direction and speed are independent.
    dir
      .set(
        -(0.4 + Math.random() * 1.0),
        Math.random() * 0.85,
        (Math.random() * 2 - 1) * 0.85,
      )
      .normalize()
    const speed = DEBRIS_SPEED_MIN + Math.random() * (DEBRIS_SPEED_MAX - DEBRIS_SPEED_MIN)
    slot.velocity.copy(dir).multiplyScalar(speed)
    slot.velocity.y += DEBRIS_UP_BIAS

    slot.axis
      .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      .normalize()
    slot.spin = DEBRIS_SPIN_MIN + Math.random() * (DEBRIS_SPIN_MAX - DEBRIS_SPIN_MIN)
    slot.angle = Math.random() * Math.PI * 2
    slot.size = DEBRIS_SIZE_MIN + Math.random() * (DEBRIS_SIZE_MAX - DEBRIS_SIZE_MIN)
    slot.floorY = b.floorY + slot.size * 0.5
    slot.life = DEBRIS_LIFETIME_MIN + Math.random() * (DEBRIS_LIFETIME_MAX - DEBRIS_LIFETIME_MIN)
    slot.age = 0
    slot.alive = true
  }
}

export function step(dt) {
  for (let i = 0; i < DEBRIS_POOL_SIZE; i++) {
    const slot = debrisPool[i]
    if (!slot.alive) continue

    slot.age += dt
    if (slot.age >= slot.life) {
      slot.alive = false
      continue
    }

    slot.velocity.y -= DEBRIS_GRAVITY * dt
    slot.position.addScaledVector(slot.velocity, dt)
    slot.angle += slot.spin * dt

    // Land on the wall's base rather than sink through the ground: clamp, bleed
    // off most of the momentum, and let the short remaining life fade it out.
    if (slot.position.y < slot.floorY) {
      slot.position.y = slot.floorY
      slot.velocity.y *= -DEBRIS_FLOOR_BOUNCE
      slot.velocity.x *= DEBRIS_FLOOR_DRAG
      slot.velocity.z *= DEBRIS_FLOOR_DRAG
      slot.spin *= DEBRIS_FLOOR_SPIN_DRAG
    }
  }
}

// Drop every live chunk. Called from systems/wallHealth.js resetWalls() on a
// win-panel respawn, alongside the health/collider/store resets — so a fresh
// run never starts with rubble from the previous one still tumbling.
export function reset() {
  for (let i = 0; i < DEBRIS_POOL_SIZE; i++) debrisPool[i].alive = false
  nextSlot = 0
}
