// Wall damage, stepped once per frame from GameLoop (Tech.md §5.1 style:
// framework-free, mutable module state, same pattern as actionTracker.js).
// Reads this frame's laser hit (systems/laser.js) and, while it lands on a
// live wall, drains that wall's health scaled by the player's Power
// (store/useGameStore.js) and the wall's own strength (data/wallHealth.js).
// Health itself stays here — a continuous per-frame number, like laser aim
// or player position — and only the discrete destroy transition reaches into
// the zustand store, the same way actionTracker.js only calls gainPower() on
// discrete Action events rather than every frame.
import { laser } from './laser.js'
import { useGameStore } from '../store/useGameStore.js'
import { removeAabb } from './collision.js'
import { WALL_STRENGTH, HEALTH_MAX, DAMAGE_CONSTANT } from '../data/wallHealth.js'

const health = {}
for (const id in WALL_STRENGTH) health[id] = HEALTH_MAX

// Mirrors laser.js's isIgnored(): walks up from the raycast-hit mesh to find
// the WallProp mount group that tagged itself with userData.wallId.
function resolveWallId(object) {
  let o = object
  while (o) {
    if (o.userData.wallId) return o.userData.wallId
    o = o.parent
  }
  return null
}

export function step(dt) {
  if (!laser.hit || !laser.hitObject) return

  const id = resolveWallId(laser.hitObject)
  if (id === null) return

  const remaining = health[id]
  if (remaining === undefined || remaining <= 0) return

  const power = useGameStore.getState().power
  const damage = (power / WALL_STRENGTH[id]) * DAMAGE_CONSTANT * dt
  const next = Math.max(0, remaining - damage)
  health[id] = next

  if (next === 0) {
    removeAabb(id)
    useGameStore.getState().destroyWall(id)
  }
}
