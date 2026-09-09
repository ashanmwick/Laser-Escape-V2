// Wall damage (Tech.md §5.1 style: framework-free, mutable module state, same
// pattern as actionTracker.js). Two entry points, both fed this frame's laser
// hit (systems/laser.js):
//   - step(dt), once per frame from GameLoop, only tracks which live wall the
//     beam is on right now for the in-world health bars (wallHealthView).
//   - strikeWall(), from systems/actionTracker.js on every discrete Action
//     event (a click, then one per ACTION_HOLD_INTERVAL while fire is held),
//     subtracts the player's current Power (store/useGameStore.js) from that
//     wall's health pool in one hit — so a wall on the beam loses `Power` per
//     Action, the same cadence gainPower() adds Power on.
// The health pool starts at the wall's own strength (data/wallHealth.js) and
// lives here as plain module state; only the discrete destroy transition
// reaches into the zustand store.
import { laser } from './laser.js'
import { useGameStore } from '../store/useGameStore.js'
import { removeAabb, resetAabbs } from './collision.js'
import { spawnBurst as spawnDebris, reset as resetDebris } from './wallDebris.js'
import { WALL_STRENGTH, DAMAGE_CONSTANT } from '../data/wallHealth.js'

const health = {}
for (const id in WALL_STRENGTH) health[id] = WALL_STRENGTH[id]

// --- Multiplayer wall-health sync (systems/net.js) -----------------------
// Wall health is shared across everyone in the arena room. This module stays
// the single owner of the local `health` pool; net.js is a thin transport:
//   - local damage / destroy / round-reset here EMIT on wallNetListeners, and
//     net.js relays them to the server;
//   - inbound server state is applied back through applyRemoteWallHealth() /
//     resetWallsFromNetwork(), with `applyingRemote` set so those do not echo
//     straight back out.
const wallNetListeners = new Set()

export function subscribeWallNet(fn) {
  wallNetListeners.add(fn)
  return () => wallNetListeners.delete(fn)
}

let applyingRemote = false

function emitWallNet(event) {
  if (applyingRemote) return
  for (const fn of wallNetListeners) {
    try {
      fn(event)
    } catch {
      // A broken subscriber must not wedge local wall damage.
    }
  }
}

// Read-only view state for the in-world health bars (components/WallHealthBars.jsx).
// Same "systems own the continuous number, components just draw it" split as the
// rest of this module: `activeId` is the live wall the beam is currently on (null
// when it's on nothing breakable), `lastHitAt` is the last time each wall took a
// tick of damage, in performance.now() ms — the bar uses it to linger after fire
// stops and to flash on impact.
export const wallHealthView = { activeId: null, lastHitAt: {} }

// health[id] as a 0..1 fraction of the wall's strength pool; 0 for an unknown
// or already-destroyed id.
export function healthFraction(id) {
  const remaining = health[id]
  if (remaining === undefined) return 0
  return remaining / WALL_STRENGTH[id]
}

// Raw remaining health for the in-world "remaining / strength" readout
// (components/WallHealthBars.jsx). 0 for an unknown or destroyed id.
export function wallHealthRemaining(id) {
  return health[id] > 0 ? health[id] : 0
}

// Restore every wall to full health and drop the transient bar state. Called
// from systems/glowFloorPanel.js on a win-panel respawn, alongside the store's
// resetWalls() (which clears destroyedWalls so the meshes remount) and
// collision.js's resetAabbs() (which brings the colliders back). WallProp's
// damage-look useFrame re-reads healthFraction() and snaps back on its own.
//
// A local reset (the player reached a win panel) broadcasts so the whole room
// resets too; a reset that arrived FROM the room (resetWallsFromNetwork) is
// applied with `applyingRemote` set, so emitWallNet() below no-ops.
export function resetWalls() {
  for (const id in WALL_STRENGTH) health[id] = WALL_STRENGTH[id]
  wallHealthView.activeId = null
  wallHealthView.lastHitAt = {}
  resetDebris()
  emitWallNet({ type: 'reset' })
}

// Apply a room-wide wall reset that originated on ANOTHER client (systems/net.js
// saw resetNonce change). Same bundle systems/glowFloorPanel.js runs locally —
// health pool + store.destroyedWalls (so meshes remount) + colliders — but
// without awarding Wins or moving our player, and without re-broadcasting.
export function resetWallsFromNetwork() {
  applyingRemote = true
  try {
    resetWalls()
    useGameStore.getState().resetWalls()
    resetAabbs()
  } finally {
    applyingRemote = false
  }
}

// Adopt a wall's health pool from the room (systems/net.js, once per frame per
// wall). Walls only ever lose health between resets, so a value >= what we
// already have is stale state lagging our own local strike, not a heal — it is
// ignored; full restores come through resetWallsFromNetwork(). Idempotent: an
// unchanged value (the echo of our own strike) is a no-op.
export function applyRemoteWallHealth(id, hp, destroyed) {
  const current = health[id]
  if (current === undefined) return

  const strength = WALL_STRENGTH[id]
  const value = Number(hp)
  const clamped = Math.max(0, Math.min(Number.isFinite(value) ? value : 0, strength))
  const wasAlive = current > 0
  const needDestroy = (destroyed || clamped === 0) && wasAlive

  if (!needDestroy && clamped >= current) return

  applyingRemote = true
  try {
    health[id] = needDestroy ? 0 : clamped
    wallHealthView.lastHitAt[id] = performance.now()
    if (needDestroy) {
      removeAabb(id)
      spawnDebris(id)
      useGameStore.getState().destroyWall(id)
    }
  } finally {
    applyingRemote = false
  }
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

// The live wall the beam is on this frame, or null. Only view bookkeeping for
// the health bars — the actual damage is dealt by strikeWall() on Action events.
function liveWallUnderBeam() {
  if (!laser.hit || !laser.hitObject) return null
  const id = resolveWallId(laser.hitObject)
  if (id === null) return null
  const remaining = health[id]
  if (remaining === undefined || remaining <= 0) return null
  return id
}

export function step() {
  wallHealthView.activeId = liveWallUnderBeam()
}

// One discrete Action's worth of wall damage: if the beam is on a live wall,
// subtract the player's current Power (times DAMAGE_CONSTANT) from its health
// pool in a single hit. Called from systems/actionTracker.js alongside
// gainPower(), so a held beam breaks a wall in Power-sized steps every
// ACTION_HOLD_INTERVAL, and a lone click lands exactly one step.
export function strikeWall() {
  const id = liveWallUnderBeam()
  if (id === null) return

  wallHealthView.activeId = id
  wallHealthView.lastHitAt[id] = performance.now()

  const power = useGameStore.getState().power
  const next = Math.max(0, health[id] - power * DAMAGE_CONSTANT)
  health[id] = next

  if (next === 0) {
    removeAabb(id)
    spawnDebris(id)
    useGameStore.getState().destroyWall(id)
    emitWallNet({ type: 'destroyed', id })
  } else {
    // Report the pool's new value so every other client's bar drains too.
    emitWallNet({ type: 'damage', id, hp: next })
  }
}
