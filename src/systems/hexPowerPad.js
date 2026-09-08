// Hex power pad buy/equip (Tech.md §5.1 style: framework-free, mutable
// singleton, stepped once per frame from GameLoop). Near a pad, the HUD
// prompts "Press E to Buy Laser" or "Press E to Equip Laser"
// (components/hud/Hud.jsx polls hexPowerPadState.nearIndex against the
// store); pressing E there buys or equips it. Mirrors systems/afk.js's
// proximity-scan-then-interact shape, sharing the same inputState.interact
// edge flag — see GameLoop.jsx for how the two systems and the flag's final
// per-frame reset avoid stepping on each other.
import { inputState } from './input.js'
import { player } from './playerState.js'
import { useGameStore } from '../store/useGameStore.js'
import { HEX_POWER_PAD_POSITIONS, HEX_POWER_PAD_TIERS, HEX_POWER_PAD_RANGE } from '../data/hexPowerPad.js'

export const hexPowerPadState = {
  nearIndex: null, // index of the nearest pad within HEX_POWER_PAD_RANGE this frame, or null
}

function findNearestPadInRange() {
  const p = player.position
  let bestIndex = null
  let bestDistSq = HEX_POWER_PAD_RANGE * HEX_POWER_PAD_RANGE
  for (let i = 0; i < HEX_POWER_PAD_POSITIONS.length; i++) {
    const pos = HEX_POWER_PAD_POSITIONS[i]
    const dx = p.x - pos[0]
    const dy = p.y - pos[1]
    const dz = p.z - pos[2]
    const distSq = dx * dx + dy * dy + dz * dz
    if (distSq <= bestDistSq) {
      bestDistSq = distSq
      bestIndex = i
    }
  }
  return bestIndex
}

export function step() {
  hexPowerPadState.nearIndex = findNearestPadInRange()

  if (!inputState.interact) return
  const index = hexPowerPadState.nearIndex
  if (index === null) return

  // Claim the press: it happened inside this pad's zone, whether or not it
  // ends up doing anything (already equipped, wins short of the gate). Same
  // "consume on zone entry, not on effect" rule GameLoop.jsx's final reset
  // relies on for afk.js's target zone.
  inputState.interact = false

  const state = useGameStore.getState()
  if (state.ownedHexPads.has(index)) {
    if (state.equippedHexPad !== index) state.equipHexPad(index)
  } else {
    const tier = HEX_POWER_PAD_TIERS[index]
    if (tier && state.wins >= tier.winsRequired) state.buyHexPad(index)
  }
}
