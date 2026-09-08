// Win-panel pickup (Tech.md §5.1 style: framework-free, mutable singleton,
// stepped once per frame from GameLoop after playerMovement so it reads this
// frame's final player position). Walking onto a `glow_floor_panel[.NNN]`
// object (collection `WinPanel`, data/glowFloorPanel.js) grants that panel's
// flat Wins value once — the award re-arms only after the player leaves the
// zone (or crosses straight into a different panel's zone). Unlike afk.js /
// hexPowerPad.js this needs no key press and never touches
// inputState.interact, so its order relative to GameLoop's interact reset
// does not matter.
import { player, resetPlayer } from './playerState.js'
import { useGameStore } from '../store/useGameStore.js'
import { resetWalls as resetWallHealth } from './wallHealth.js'
import { resetAabbs } from './collision.js'
import { SPAWN } from '../data/hub.js'
import {
  GLOW_FLOOR_PANEL_POSITIONS,
  GLOW_FLOOR_PANEL_WINS,
  GLOW_FLOOR_PANEL_RANGE,
} from '../data/glowFloorPanel.js'

export const glowFloorPanelState = {
  onIndex: null, // index of the panel the player is standing on this frame, or null
}

function findPanelUnderPlayer() {
  const p = player.position
  let bestIndex = null
  let bestDistSq = GLOW_FLOOR_PANEL_RANGE * GLOW_FLOOR_PANEL_RANGE
  for (let i = 0; i < GLOW_FLOOR_PANEL_POSITIONS.length; i++) {
    const pos = GLOW_FLOOR_PANEL_POSITIONS[i]
    // Horizontal only — the panels lie flat on the ground, so a jump over one
    // should still collect it.
    const dx = p.x - pos[0]
    const dz = p.z - pos[2]
    const distSq = dx * dx + dz * dz
    if (distSq <= bestDistSq) {
      bestDistSq = distSq
      bestIndex = i
    }
  }
  return bestIndex
}

export function step() {
  const index = findPanelUnderPlayer()

  // Fire once on entry: only when this frame's panel differs from the one we
  // were already on. Stepping off (index === null) re-arms it; walking from
  // one panel straight into another still counts as a fresh entry.
  if (index !== null && index !== glowFloorPanelState.onIndex) {
    const amount = GLOW_FLOOR_PANEL_WINS[index] ?? 0
    if (amount > 0) useGameStore.getState().awardWins(amount)

    // Reaching a win panel ends the run: bank the Wins, then reset the walls
    // (destroyed set + health snapshot + colliders) and drop the player back
    // at spawn. Everything else — Power, Rebirth, hex pads, total Wins — is
    // left untouched.
    useGameStore.getState().resetWalls()
    resetWallHealth()
    resetAabbs()
    resetPlayer(SPAWN)

    // The player is now at spawn, nowhere near this panel — clear the marker
    // so the next panel they reach counts as a fresh entry, and skip the
    // bottom-of-function assignment that would otherwise pin onIndex here.
    glowFloorPanelState.onIndex = null
    return
  }

  glowFloorPanelState.onIndex = index
}
