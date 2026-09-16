// PVP hit-testing (Tech.md §5.1 style: framework-free, mutable module state,
// stepped once per frame from GameLoop right after systems/laser.js). Mirrors
// systems/wallHealth.js's split: step() tracks which remote player (if any)
// the beam is on this frame, strikeTarget() lands one discrete Action's worth
// of damage on it — falling back to strikeWall() when the beam is on a wall
// instead. Scoped entirely to the PVP zone (data/pvpZone.js): outside it
// neither side of a fight can hit or be hit, same as the real world can't
// reach in through data/pvpWall.js's glass.
import { laser } from './laser.js'
import { player } from './playerState.js'
import { remotePlayers, sendPlayerDamage } from './net.js'
import { strikeWall } from './wallHealth.js'
import { isInPvpZone } from '../data/pvpZone.js'
import { REMOTE_BODY } from '../data/net.js'
import { PVP_DAMAGE_PER_HIT, PVP_HIT_RADIUS, PVP_AIM_ASSIST_TAN } from '../data/playerHealth.js'

const R = REMOTE_BODY.RADIUS
const H = REMOTE_BODY.HEIGHT

// The remote player id the beam is on this frame, or null.
let targetId = null

// Closest approach of the ray (origin o, unit direction d, param s clamped to
// [0, maxT]) to the segment a->b — a remote's capsule core, feet+R to
// head-R — parametrized by t clamped to [0, 1]. Minimizing |O+sD - A-tE|^2
// over s,t gives the 2x2 linear system
//   s - b*t = -c
//   b*s - e*t = -f
// (with D unit length so D.D=1); solved directly, then re-clamped/resolved
// per axis if the unclamped solution falls outside either range (the
// standard segment-vs-segment closest-point approach — Ericson, "Real-Time
// Collision Detection" §5.1.9 — adapted here for one side being ray-bounded
// instead of segment-bounded).
function closestRayToSegment(ox, oy, oz, dx, dy, dz, ax, ay, az, bx, by, bz, maxT) {
  const ex = bx - ax, ey = by - ay, ez = bz - az
  const rx = ox - ax, ry = oy - ay, rz = oz - az
  const e = ex * ex + ey * ey + ez * ez
  const f = ex * rx + ey * ry + ez * rz
  const b = dx * ex + dy * ey + dz * ez
  const c = dx * rx + dy * ry + dz * rz
  const denom = e - b * b // a*e - b*b, a=1

  let s = denom > 1e-10 ? (b * f - c * e) / denom : 0
  s = s < 0 ? 0 : s > maxT ? maxT : s

  let t = e > 1e-10 ? (b * s + f) / e : 0
  if (t < 0) {
    t = 0
    s = -c
    s = s < 0 ? 0 : s > maxT ? maxT : s
  } else if (t > 1) {
    t = 1
    s = b - c
    s = s < 0 ? 0 : s > maxT ? maxT : s
  }

  const px = ox + dx * s, py = oy + dy * s, pz = oz + dz * s
  const qx = ax + ex * t, qy = ay + ey * t, qz = az + ez * t
  const ddx = px - qx, ddy = py - qy, ddz = pz - qz
  return { tRay: s, distSq: ddx * ddx + ddy * ddy + ddz * ddz }
}

export function step() {
  targetId = null
  if (!laser.active) return
  if (!isInPvpZone(player.position.x, player.position.z)) return

  // Hit-test against the SAME ray systems/laser.js actually fired (camera
  // origin/direction in the mouse-aim case, not a line reconstructed from
  // `start`/`end` — those two differ in third person, and testing the wrong
  // one is exactly what let clearly-aimed shots miss). `laser.end` always
  // lies on this ray, so its distance along it is the true environment range.
  const ox = laser.rayOrigin.x, oy = laser.rayOrigin.y, oz = laser.rayOrigin.z
  const dx = laser.rayDir.x, dy = laser.rayDir.y, dz = laser.rayDir.z
  const envDist = Math.hypot(laser.end.x - ox, laser.end.y - oy, laser.end.z - oz)
  if (envDist < 1e-6) return

  let bestT = envDist
  let bestId = null
  for (const [id, e] of remotePlayers) {
    if (!e.present || e.alpha < 0.5 || e.dead || e.hp <= 0) continue
    if (!isInPvpZone(e.rx, e.rz)) continue
    const res = closestRayToSegment(
      ox, oy, oz, dx, dy, dz,
      e.rx, e.ry + R, e.rz,
      e.rx, e.ry + H - R, e.rz,
      envDist,
    )
    // Effective hit radius widens with range (data/playerHealth.js
    // PVP_AIM_ASSIST_TAN) rather than staying fixed: the same small aim
    // slip is centimetres up close and metres at range, so a flat radius
    // either feels too tight far away or too generous close up.
    const effRadius = Math.max(PVP_HIT_RADIUS, res.tRay * PVP_AIM_ASSIST_TAN)
    if (res.tRay > 0.01 && res.distSq <= effRadius * effRadius && res.tRay < bestT) {
      bestT = res.tRay
      bestId = id
    }
  }

  if (bestId) {
    targetId = bestId
    // Clip the beam to the player's surface so it visibly lands on them
    // instead of passing through to whatever's behind (laser.js's own hit
    // convention: laser.hit true + laser.end at the strike point).
    laser.end.x = ox + dx * bestT
    laser.end.y = oy + dy * bestT
    laser.end.z = oz + dz * bestT
    laser.hit = true
  }
}

// One discrete Action's worth of damage (systems/actionTracker.js, same
// cadence as a wall strike). If the beam is on a live PVP target, report
// their next hp to the server (systems/net.js) — same client-authoritative
// trust model as wallHealth.js's strikeWall(): we never write the target's
// hp locally, systems/net.js adopts the server's echo into remotePlayers on
// a later frame, same as every other tracked remote stat. Falls back to
// strikeWall() when the beam isn't on a player, so systems/actionTracker.js
// only ever needs to call this one function.
//
// Fixed damage per hit (PVP_DAMAGE_PER_HIT = PLAYER_MAX_HP / 10): Power never
// enters into it — every player kills another in exactly 10 hits, regardless
// of either side's Power.
export function strikeTarget() {
  if (!targetId) return strikeWall()
  const e = remotePlayers.get(targetId)
  if (!e || e.dead || e.hp <= 0) return
  const next = Math.max(0, e.hp - PVP_DAMAGE_PER_HIT)
  sendPlayerDamage(targetId, next)
}
