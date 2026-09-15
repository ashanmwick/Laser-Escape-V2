import { inputState } from './input.js'
import { player } from './playerState.js'
import { getYaw } from './cameraOrbit.js'

// Kinematic capsule, stepped once per frame (Tech.md §5.2):
//   apply input -> gravity -> integrate -> resolve vs static AABBs, axis by axis.
// No broadphase: the AABB count is tens, so a linear scan wins.
export const SPEED = 6 // m/s target ground speed (the avatar gait reads this)
const ACCEL = 45 // m/s^2 approach toward target velocity
const GRAVITY = -22 // m/s^2
const JUMP_SPEED = 7.5 // m/s
const GROUND_Y = 0 // flat ground plane height

// Max ledge height a walking player steps onto smoothly instead of being
// blocked like a wall (the standard "step offset" a kinematic controller
// needs for any staircase built from stacked AABBs, e.g. data/podiumStage.js
// — its risers run up to ~0.367m once placed at the hub's 5.5x scale). Well
// clear of that with margin, but still far short of anything meant to block
// (walls, props), so it only ever smooths genuine steps.
const STEP_HEIGHT = 0.45

// The capsule is treated as an AABB for the static scan: a box of half-width
// the live player.dims radius on X/Z, spanning [y, y + height].
function overlaps(p, b) {
  return (
    p.x + player.dims.radius > b.min.x &&
    p.x - player.dims.radius < b.max.x &&
    p.y + player.dims.height > b.min.y &&
    p.y < b.max.y &&
    p.z + player.dims.radius > b.min.z &&
    p.z - player.dims.radius < b.max.z
  )
}

function approach(v, key, target, maxDelta) {
  const d = target - v[key]
  if (d > maxDelta) v[key] += maxDelta
  else if (d < -maxDelta) v[key] -= maxDelta
  else v[key] = target
}

// Instead of blocking horizontal movement into a low ledge, stand the player
// on top of it — true for any box (a stair tread, a curb), not just
// podium_stage's. Only the rise above the CURRENT feet position counts, so a
// tall box already climbed above (feet now higher than its top) never
// matches here; overlaps() already filtered those out.
function tryStepUp(p, b) {
  const rise = b.max.y - p.y
  if (rise <= 0 || rise > STEP_HEIGHT) return false
  p.y = b.max.y
  if (player.velocity.y < 0) player.velocity.y = 0
  return true
}

function resolveX(aabbs) {
  const p = player.position
  for (let i = 0; i < aabbs.length; i++) {
    const b = aabbs[i]
    if (!overlaps(p, b)) continue
    if (tryStepUp(p, b)) continue
    const c = (b.min.x + b.max.x) * 0.5
    p.x = p.x < c ? b.min.x - player.dims.radius : b.max.x + player.dims.radius
    player.velocity.x = 0
  }
}

function resolveZ(aabbs) {
  const p = player.position
  for (let i = 0; i < aabbs.length; i++) {
    const b = aabbs[i]
    if (!overlaps(p, b)) continue
    if (tryStepUp(p, b)) continue
    const c = (b.min.z + b.max.z) * 0.5
    p.z = p.z < c ? b.min.z - player.dims.radius : b.max.z + player.dims.radius
    player.velocity.z = 0
  }
}

function resolveY(aabbs) {
  const p = player.position
  for (let i = 0; i < aabbs.length; i++) {
    const b = aabbs[i]
    if (!overlaps(p, b)) continue
    // Push out along whichever face is shallower. Comparing the feet against
    // the box's centre instead would only be right for boxes shorter than the
    // capsule: land on a 1m block and the feet sit *above* its centre, so the
    // player would be shoved down through the floor rather than stood on top.
    const upOut = b.max.y - p.y // depth the feet are under the lid
    const downOut = p.y + player.dims.height - b.min.y // depth the head is past the floor
    if (upOut <= downOut) {
      // landed on top of the box
      p.y = b.max.y
      if (player.velocity.y < 0) player.velocity.y = 0
      player.grounded = true
    } else {
      // clipped the underside with the head
      p.y = b.min.y - player.dims.height
      if (player.velocity.y > 0) player.velocity.y = 0
    }
  }
}

// Convex-polygon colliders (data/hub.js's HUB_POLYGONS, currently just
// data/pvpCenterPentagon.js's pentagon stack — Tech.md §5.2's box scan above
// only fits rectangular/0-90°-rotated footprints). Each poly is
// { center:{x,z}, minY, maxY, apothem, normals:[{x,z}, ...] } — a regular
// N-gon, so every face sits the same `apothem` distance from centre, just
// along a different outward unit normal. The player is still treated as a
// circle of radius player.dims.radius on X/Z, same as the box code above;
// `nearestFace` finds which of the polygon's faces that circle is closest
// to (or furthest past, if outside), by the same "signed distance beyond
// this face's line" used for every face — the largest one is both the
// overlap test and, if there IS overlap, the shallowest (and therefore
// correct) push-out direction, the polygon generalization of the box
// resolvers' "push out along whichever axis is shallower".
function nearestFace(p, poly) {
  let d = -Infinity
  let normal = poly.normals[0]
  for (const n of poly.normals) {
    const nd = (p.x - poly.center.x) * n.x + (p.z - poly.center.z) * n.z - poly.apothem
    if (nd > d) {
      d = nd
      normal = n
    }
  }
  return { d, normal }
}

function overlapsPoly(p, poly) {
  if (p.y + player.dims.height <= poly.minY || p.y >= poly.maxY) return false
  return nearestFace(p, poly).d < player.dims.radius
}

// Same idea as tryStepUp above, just keyed off a polygon instead of a box.
function tryStepUpPoly(p, poly) {
  const rise = poly.maxY - p.y
  if (rise <= 0 || rise > STEP_HEIGHT) return false
  p.y = poly.maxY
  if (player.velocity.y < 0) player.velocity.y = 0
  return true
}

// One unified push per polygon (not axis-split like resolveX/resolveZ,
// since a face normal is rarely purely-X or purely-Z) — zeroing only the
// velocity component along the push direction lets the player keep sliding
// along the face instead of stopping dead, the same "slide along a wall"
// feel the box resolvers get for free from resolving X and Z separately.
function resolvePolys(polys) {
  const p = player.position
  for (let i = 0; i < polys.length; i++) {
    const poly = polys[i]
    if (!overlapsPoly(p, poly)) continue
    if (tryStepUpPoly(p, poly)) continue
    const { d, normal } = nearestFace(p, poly)
    const push = player.dims.radius - d
    p.x += normal.x * push
    p.z += normal.z * push
    const vDotN = player.velocity.x * normal.x + player.velocity.z * normal.z
    if (vDotN < 0) {
      player.velocity.x -= vDotN * normal.x
      player.velocity.z -= vDotN * normal.z
    }
  }
}

// Polygon equivalent of resolveY: land on top or clip the underside,
// whichever face (lid or floor) is shallower.
function resolvePolysY(polys) {
  const p = player.position
  for (let i = 0; i < polys.length; i++) {
    const poly = polys[i]
    if (!overlapsPoly(p, poly)) continue
    const upOut = poly.maxY - p.y
    const downOut = p.y + player.dims.height - poly.minY
    if (upOut <= downOut) {
      p.y = poly.maxY
      if (player.velocity.y < 0) player.velocity.y = 0
      player.grounded = true
    } else {
      p.y = poly.minY - player.dims.height
      if (player.velocity.y > 0) player.velocity.y = 0
    }
  }
}

export function step(dt, aabbs = [], polys = []) {
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
  resolvePolys(polys)
  p.y += player.velocity.y * dt
  resolveY(aabbs)
  resolvePolysY(polys)

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
