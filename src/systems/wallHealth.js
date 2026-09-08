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

// Read-only view state for the in-world health bars (components/WallHealthBars.jsx).
// Same "systems own the continuous number, components just draw it" split as the
// rest of this module: `activeId` is the live wall the beam is currently on (null
// when it's on nothing breakable), `lastHitAt` is the last time each wall took a
// tick of damage, in performance.now() ms — the bar uses it to linger after fire
// stops and to flash on impact.
export const wallHealthView = { activeId: null, lastHitAt: {} }

// health[id] as a 0..1 fraction; 0 for an unknown or already-destroyed id.
export function healthFraction(id) {
  const remaining = health[id]
  if (remaining === undefined) return 0
  return remaining / HEALTH_MAX
}

// Restore every wall to full health and drop the transient bar state. Called
// from systems/glowFloorPanel.js on a win-panel respawn, alongside the store's
// resetWalls() (which clears destroyedWalls so the meshes remount) and
// collision.js's resetAabbs() (which brings the colliders back). WallProp's
// damage-look useFrame re-reads healthFraction() and snaps back on its own.
export function resetWalls() {
  for (const id in WALL_STRENGTH) health[id] = HEALTH_MAX
  wallHealthView.activeId = null
  wallHealthView.lastHitAt = {}
}

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
  if (!laser.hit || !laser.hitObject) {
    wallHealthView.activeId = null
    return
  }

  const id = resolveWallId(laser.hitObject)
  if (id === null) {
    wallHealthView.activeId = null
    return
  }

  const remaining = health[id]
  if (remaining === undefined || remaining <= 0) {
    wallHealthView.activeId = null
    return
  }

  // Beam is on a live wall — its bar is the active one, whether or not this
  // frame's Power is enough to visibly move the number.
  wallHealthView.activeId = id
  wallHealthView.lastHitAt[id] = performance.now()

  const power = useGameStore.getState().power
  const damage = (power / WALL_STRENGTH[id]) * DAMAGE_CONSTANT * dt
  const next = Math.max(0, remaining - damage)
  health[id] = next

  if (next === 0) {
    removeAabb(id)
    useGameStore.getState().destroyWall(id)
  }
}
