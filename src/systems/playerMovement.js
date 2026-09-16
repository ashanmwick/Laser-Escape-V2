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

// Ring colliders (data/hub.js's HUB_RINGS, currently just data/
// pvpCenterPentagon.js's cylinder shell) — a shape none of the above fit:
// solid in an annulus (between an outer and an inner apothem sharing one
// set of face normals), open in the middle. `nearestFace` above already
// takes any {center, apothem, normals}, so it's reused twice per ring — once
// against the outer boundary, once against the inner — rather than writing
// a second geometry test from scratch.
function zoneOf(p, ring) {
  const outer = nearestFace(p, { center: ring.center, apothem: ring.outerApothem, normals: ring.normals })
  const inner = nearestFace(p, { center: ring.center, apothem: ring.innerApothem, normals: ring.normals })
  return { outer, inner }
}

// Gate for whether this ring is even worth resolving this frame: the
// player's circle must reach the wall band from one side or the other.
// Anything fully outside the outer wall, or fully inside the hollow middle
// with room to spare, skips the ring entirely — the hollow middle already
// has its own floor (the tier below, in HUB_POLYGONS), so falling through
// there is exactly the intended behaviour, not a gap in this collider.
function overlapsRingBand(p, ring) {
  if (p.y + player.dims.height <= ring.minY || p.y >= ring.maxY) return false
  const { outer, inner } = zoneOf(p, ring)
  return outer.d < player.dims.radius && inner.d > -player.dims.radius
}

// Push the player back out of the wall, from whichever side they entered
// it. Approaching from outside (outer.d >= 0, same test resolvePolys uses)
// pushes outward exactly like a solid disc, including the same step-up
// assist. Approaching from inside the hollow middle (inner.d < 0, i.e. still
// short of the inner wall) pushes back toward the centre instead, along the
// same inner face's normal, reversed — the two pushes can never both apply
// (a 1m-thick wall is far wider than the player's radius), so this is an
// if/else, not two independent resolutions.
function resolveRingXZ(ring) {
  const p = player.position
  if (!overlapsRingBand(p, ring)) return
  const { outer, inner } = zoneOf(p, ring)
  if (outer.d >= 0 || inner.d >= 0) {
    // Outside the wall pushing in, or (rare) already embedded in it —
    // either way, treat the outer face like any other solid boundary.
    if (tryStepUpPoly(p, ring)) return
    const push = player.dims.radius - outer.d
    p.x += outer.normal.x * push
    p.z += outer.normal.z * push
    const vDotN = player.velocity.x * outer.normal.x + player.velocity.z * outer.normal.z
    if (vDotN < 0) {
      player.velocity.x -= vDotN * outer.normal.x
      player.velocity.z -= vDotN * outer.normal.z
    }
    return
  }
  // Inside the hollow middle, nudging into the inner wall — push back
  // toward the centre along -inner.normal instead of out through the wall.
  const push = inner.d + player.dims.radius
  if (push <= 0) return
  p.x -= inner.normal.x * push
  p.z -= inner.normal.z * push
  const vDotN = player.velocity.x * inner.normal.x + player.velocity.z * inner.normal.z
  if (vDotN > 0) {
    player.velocity.x -= vDotN * inner.normal.x
    player.velocity.z -= vDotN * inner.normal.z
  }
}

// Ring equivalent of resolvePolysY: only reachable once resolveRingXZ above
// has already kept the player's XZ position within the wall band (or just
// outside it, approaching), so — unlike the tiers' own resolvePolysY — this
// never needs to distinguish "on the wall" from "over the hollow middle";
// overlapsRingBand's gate already excludes the latter.
function resolveRingY(ring) {
  const p = player.position
  if (!overlapsRingBand(p, ring)) return
  const upOut = ring.maxY - p.y
  const downOut = p.y + player.dims.height - ring.minY
  if (upOut <= downOut) {
    p.y = ring.maxY
    if (player.velocity.y < 0) player.velocity.y = 0
    player.grounded = true
  } else {
    p.y = ring.minY - player.dims.height
    if (player.velocity.y > 0) player.velocity.y = 0
  }
}

export function step(dt, aabbs = [], polys = [], rings = []) {
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
  for (let i = 0; i < rings.length; i++) resolveRingXZ(rings[i])
  p.y += player.velocity.y * dt
  resolveY(aabbs)
  resolvePolysY(polys)
  for (let i = 0; i < rings.length; i++) resolveRingY(rings[i])

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
