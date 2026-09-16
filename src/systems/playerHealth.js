// Local player's own PVP health (Tech.md §5.1 style: framework-free, mutable
// module state, stepped once per frame from GameLoop). Damage always comes
// from another client's laser (systems/playerCombat.js strikeTarget() on
// THEIR machine) relayed through the server — this module is never the one
// subtracting its own hp, only the one adopting what the server echoes back
// (applyRemoteHealth, called from systems/net.js) and running the respawn
// timer once dead. Same trust model as systems/wallHealth.js.
import { PLAYER_MAX_HP, PVP_RESPAWN_DELAY_MS } from '../data/playerHealth.js'
import { PVP_RESPAWN_POINT } from '../data/pvpZone.js'
import { resetPlayer } from './playerState.js'

export const health = { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, dead: false, respawnAt: 0 }

export function healthFraction() {
  return Math.max(0, health.hp) / health.maxHp
}

const healthNetListeners = new Set()

export function subscribeHealthNet(fn) {
  healthNetListeners.add(fn)
  return () => healthNetListeners.delete(fn)
}

function emitHealthNet(event) {
  for (const fn of healthNetListeners) {
    try {
      fn(event)
    } catch {
      // A broken subscriber must not wedge the respawn flow.
    }
  }
}

// Suppresses adopting a "dead" report for a short window after OUR OWN
// respawn() — otherwise the server's still-stale echo of our last death (it
// hasn't processed our `playerRespawn` yet) would re-kill us the instant we
// come back, the same race systems/net.js guards against for wall resets
// (pendingLocalReset / RESET_ACK_TIMEOUT_MS).
let respawnGuardUntil = 0
const RESPAWN_GUARD_MS = 2000

// Adopt our own hp/dead from the room (systems/net.js, once per frame) — the
// server value some OTHER client's strikeTarget() last wrote. Only ever moves
// hp down or flips dead true; coming back alive is always our own decision
// (respawn() below), never something adopted off the wire.
export function applyRemoteHealth(hp, dead) {
  if (dead && performance.now() < respawnGuardUntil) return
  if (dead && !health.dead) {
    health.hp = 0
    health.dead = true
    health.respawnAt = performance.now() + PVP_RESPAWN_DELAY_MS
    return
  }
  if (!health.dead) {
    const clamped = Math.max(0, Math.min(Number(hp) || 0, health.maxHp))
    if (clamped < health.hp) health.hp = clamped
  }
}

function respawn() {
  health.hp = health.maxHp
  health.dead = false
  health.respawnAt = 0
  respawnGuardUntil = performance.now() + RESPAWN_GUARD_MS
  resetPlayer(PVP_RESPAWN_POINT)
  emitHealthNet({ type: 'respawn' })
}

export function step() {
  if (health.dead && health.respawnAt && performance.now() >= health.respawnAt) {
    respawn()
  }
}
