import { inputState } from './input.js'
import { player, PLAYER_RADIUS, PLAYER_HEIGHT } from './playerState.js'
import { getYaw } from './cameraOrbit.js'

// Kinematic capsule, stepped once per frame (Tech.md §5.2):
//   apply input -> gravity -> integrate -> resolve vs static AABBs, axis by axis.
// No broadphase: the AABB count is tens, so a linear scan wins.
const SPEED = 6 // m/s target ground speed
const ACCEL = 45 // m/s^2 approach toward target velocity
const GRAVITY = -22 // m/s^2
const JUMP_SPEED = 7.5 // m/s
const GROUND_Y = 0 // flat ground plane height

// The capsule is treated as an AABB for the static scan: a box of half-width
// PLAYER_RADIUS on X/Z, spanning [y, y + PLAYER_HEIGHT].
function overlaps(p, b) {
  return (
    p.x + PLAYER_RADIUS > b.min.x &&
    p.x - PLAYER_RADIUS < b.max.x &&
    p.y + PLAYER_HEIGHT > b.min.y &&
    p.y < b.max.y &&
    p.z + PLAYER_RADIUS > b.min.z &&
    p.z - PLAYER_RADIUS < b.max.z
  )
}

function approach(v, key, target, maxDelta) {
  const d = target - v[key]
  if (d > maxDelta) v[key] += maxDelta
  else if (d < -maxDelta) v[key] -= maxDelta
  else v[key] = target
}

function resolveX(aabbs) {
  const p = player.position
  for (let i = 0; i < aabbs.length; i++) {
    const b = aabbs[i]
    if (!overlaps(p, b)) continue
    const c = (b.min.x + b.max.x) * 0.5
    p.x = p.x < c ? b.min.x - PLAYER_RADIUS : b.max.x + PLAYER_RADIUS
    player.velocity.x = 0
  }
}

function resolveZ(aabbs) {
  const p = player.position
  for (let i = 0; i < aabbs.length; i++) {
    const b = aabbs[i]
    if (!overlaps(p, b)) continue
    const c = (b.min.z + b.max.z) * 0.5
    p.z = p.z < c ? b.min.z - PLAYER_RADIUS : b.max.z + PLAYER_RADIUS
    player.velocity.z = 0
  }
}

function resolveY(aabbs) {
  const p = player.position
  for (let i = 0; i < aabbs.length; i++) {
    const b = aabbs[i]
    if (!overlaps(p, b)) continue
    const c = (b.min.y + b.max.y) * 0.5
    if (p.y < c) {
      // landed on top of the box
      p.y = b.max.y
      if (player.velocity.y < 0) player.velocity.y = 0
      player.grounded = true
    } else {
      // clipped the underside with the head
      p.y = b.min.y - PLAYER_HEIGHT
      if (player.velocity.y > 0) player.velocity.y = 0
    }
  }
}

export function step(dt, aabbs = []) {
  if (dt <= 0) return

  // Camera-relative ground basis (Tech.md §5.2: input is camera-relative).
  const yaw = getYaw()
  const fwdX = -Math.sin(yaw)
  const fwdZ = -Math.cos(yaw)
  const rightX = Math.cos(yaw)
  const rightZ = -Math.sin(yaw)

  const mv = inputState.move
  const wishX = fwdX * mv.z + rightX * mv.x
  const wishZ = fwdZ * mv.z + rightZ * mv.x

  approach(player.velocity, 'x', wishX * SPEED, ACCEL * dt)
  approach(player.velocity, 'z', wishZ * SPEED, ACCEL * dt)

  // Jump reads last frame's grounded flag, then we clear it for this frame.
  if (inputState.jump) {
    if (player.grounded) player.velocity.y = JUMP_SPEED
    inputState.jump = false
  }
  player.grounded = false

  player.velocity.y += GRAVITY * dt

  // Integrate + resolve, one axis at a time.
  const p = player.position
  p.x += player.velocity.x * dt
  resolveX(aabbs)
  p.z += player.velocity.z * dt
  resolveZ(aabbs)
  p.y += player.velocity.y * dt
  resolveY(aabbs)

  // Flat ground plane.
  if (p.y <= GROUND_Y) {
    p.y = GROUND_Y
    if (player.velocity.y < 0) player.velocity.y = 0
    player.grounded = true
  }

  // Face the direction of travel.
  if (Math.hypot(wishX, wishZ) > 0.01) {
    player.facing = Math.atan2(wishX, wishZ)
  }
}
