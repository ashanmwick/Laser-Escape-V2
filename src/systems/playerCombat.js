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
import { useGameStore } from '../store/useGameStore.js'
import { isInPvpZone } from '../data/pvpZone.js'
import { REMOTE_BODY } from '../data/net.js'
import { PVP_DAMAGE_BASE, PVP_DAMAGE_POWER_SCALE, PVP_DAMAGE_MAX } from '../data/playerHealth.js'

const R = REMOTE_BODY.RADIUS
const H = REMOTE_BODY.HEIGHT

// The remote player id the beam is on this frame, or null.
let targetId = null

// Closest approach of the ray (origin o, unit direction d) to the vertical
// segment a->b — a remote's capsule core, feet+R to head-R — clamped to the
// segment and to [0, maxT] on the ray. Classic closest-point-between-two-
// lines algorithm (a=1 since d is already unit length).
function closestRayToSegment(ox, oy, oz, dx, dy, dz, ax, ay, az, bx, by, bz, maxT) {
  const ex = bx - ax, ey = by - ay, ez = bz - az
  const rx = ox - ax, ry = oy - ay, rz = oz - az
  const e = ex * ex + ey * ey + ez * ez
  const f = ex * rx + ey * ry + ez * rz
  const b = dx * ex + dy * ey + dz * ez
  const c = dx * rx + dy * ry + dz * rz
  const denom = e - b * b
  let tSeg = Math.abs(denom) < 1e-8 ? f / e : (b * f - c * e) / denom
  tSeg = tSeg < 0 ? 0 : tSeg > 1 ? 1 : tSeg
  let tRay = b * tSeg + c
  tRay = tRay < 0 ? 0 : tRay > maxT ? maxT : tRay
  const px = ox + dx * tRay, py = oy + dy * tRay, pz = oz + dz * tRay
  const qx = ax + ex * tSeg, qy = ay + ey * tSeg, qz = az + ez * tSeg
  const ddx = px - qx, ddy = py - qy, ddz = pz - qz
  return { tRay, distSq: ddx * ddx + ddy * ddy + ddz * ddz }
}

export function step() {
  targetId = null
  if (!laser.active) return
  if (!isInPvpZone(player.position.x, player.position.z)) return

  const ox = laser.start.x, oy = laser.start.y, oz = laser.start.z
  let dx = laser.end.x - ox, dy = laser.end.y - oy, dz = laser.end.z - oz
  const envDist = Math.hypot(dx, dy, dz)
  if (envDist < 1e-6) return
  dx /= envDist
  dy /= envDist
  dz /= envDist

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
    if (res.tRay > 0.01 && res.distSq <= R * R && res.tRay < bestT) {
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
export function strikeTarget() {
  if (!targetId) return strikeWall()
  const e = remotePlayers.get(targetId)
  if (!e || e.dead || e.hp <= 0) return
  const power = useGameStore.getState().power
  const damage = Math.min(PVP_DAMAGE_MAX, PVP_DAMAGE_BASE + power * PVP_DAMAGE_POWER_SCALE)
  const next = Math.max(0, e.hp - damage)
  sendPlayerDamage(targetId, next)
}
