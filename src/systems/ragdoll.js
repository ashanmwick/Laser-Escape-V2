// PVP death ragdoll (Tech.md §5.1 style: framework-free, mutable singleton
// pool, stepped once per frame from GameLoop). Pure cosmetics, same shape as
// systems/wallDebris.js: spawnRagdoll(x, y, z, yaw) sprays RAGDOLL_PARTS.length
// boxes from the player's death position and this module tumbles a fixed pool
// of them under gravity until each ages out. Nothing here touches collision,
// the store, or the network — systems/playerHealth.js (local death) and
// systems/net.js (remote death) call spawnRagdoll() the instant they observe
// `dead` flip true off the already-synced schema field; no new network
// message is needed. components/Ragdoll.jsx just draws whatever slots are
// alive.
import * as THREE from 'three'
import {
  RAGDOLL_PARTS,
  RAGDOLL_COLORS,
  RAGDOLL_POOL_SIZE,
  RAGDOLL_LIFETIME,
  RAGDOLL_SPEED_MIN,
  RAGDOLL_SPEED_MAX,
  RAGDOLL_UP_BIAS,
  RAGDOLL_GRAVITY,
  RAGDOLL_SPIN_MIN,
  RAGDOLL_SPIN_MAX,
  RAGDOLL_FLOOR_BOUNCE,
  RAGDOLL_FLOOR_DRAG,
  RAGDOLL_FLOOR_SPIN_DRAG,
} from '../data/ragdoll.js'

function makeSlot() {
  return {
    alive: false,
    age: 0,
    life: 0,
    floorY: 0,
    spin: 0,
    angle: 0,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    axis: new THREE.Vector3(0, 1, 0),
    size: new THREE.Vector3(1, 1, 1),
    color: new THREE.Color(RAGDOLL_COLORS.body),
  }
}

// Fixed-size pool, allocated once and reused for the life of the game — never
// grown/shrunk, never per-frame allocated (Tech.md §7). Ragdoll.jsx reads this
// each frame to draw the live slots.
export const ragdollPool = []
for (let i = 0; i < RAGDOLL_POOL_SIZE; i++) ragdollPool.push(makeSlot())

let nextSlot = 0 // round-robin write cursor — a burst just recycles the oldest slots

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const dir = new THREE.Vector3()
const offset = new THREE.Vector3()

// One player's worth of gib: RAGDOLL_PARTS.length boxes sprayed from around
// their death position, biased upward and outward. Called once from
// systems/playerHealth.js (our own death) or systems/net.js (a remote death)
// the frame `dead` is first observed true.
export function spawnRagdoll(x, y, z, yaw) {
  const cos = Math.cos(yaw)
  const sin = Math.sin(yaw)

  for (const part of RAGDOLL_PARTS) {
    const slot = ragdollPool[nextSlot]
    nextSlot = (nextSlot + 1) % RAGDOLL_POOL_SIZE

    // Rotate the part's body-local offset by the player's facing so the burst
    // matches how they were standing when they died.
    offset.set(part.offset[0], part.offset[1], part.offset[2])
    const rx = offset.x * cos + offset.z * sin
    const rz = -offset.x * sin + offset.z * cos
    slot.position.set(x + rx, y + offset.y, z + rz)

    dir
      .set(Math.random() * 2 - 1, Math.random() * 0.6, Math.random() * 2 - 1)
      .normalize()
    const speed = RAGDOLL_SPEED_MIN + Math.random() * (RAGDOLL_SPEED_MAX - RAGDOLL_SPEED_MIN)
    slot.velocity.copy(dir).multiplyScalar(speed)
    slot.velocity.y += RAGDOLL_UP_BIAS

    slot.axis
      .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      .normalize()
    slot.spin = RAGDOLL_SPIN_MIN + Math.random() * (RAGDOLL_SPIN_MAX - RAGDOLL_SPIN_MIN)
    slot.angle = Math.random() * Math.PI * 2
    slot.size.set(part.size[0], part.size[1], part.size[2])
    slot.color.set(RAGDOLL_COLORS[part.color] || RAGDOLL_COLORS.body)
    // Ground is flat at y=0 (data/hub.js SPAWN) — rest each box on its own
    // half-height rather than sinking through the floor.
    slot.floorY = part.size[1] * 0.5
    slot.life = RAGDOLL_LIFETIME
    slot.age = 0
    slot.alive = true
  }
}

export function step(dt) {
  for (let i = 0; i < RAGDOLL_POOL_SIZE; i++) {
    const slot = ragdollPool[i]
    if (!slot.alive) continue

    slot.age += dt
    if (slot.age >= slot.life) {
      slot.alive = false
      continue
    }

    slot.velocity.y -= RAGDOLL_GRAVITY * dt
    slot.position.addScaledVector(slot.velocity, dt)
    slot.angle += slot.spin * dt

    if (slot.position.y < slot.floorY) {
      slot.position.y = slot.floorY
      slot.velocity.y *= -RAGDOLL_FLOOR_BOUNCE
      slot.velocity.x *= RAGDOLL_FLOOR_DRAG
      slot.velocity.z *= RAGDOLL_FLOOR_DRAG
      slot.spin *= RAGDOLL_FLOOR_SPIN_DRAG
    }
  }
}

// Drop every live part. Called from systems/glowFloorPanel.js on a win-panel
// respawn, alongside the wall/collider resets — so a fresh run never starts
// with corpses from the previous one still lying around.
export function reset() {
  for (let i = 0; i < RAGDOLL_POOL_SIZE; i++) ragdollPool[i].alive = false
  nextSlot = 0
}
