import { create } from 'zustand'
import {
  POWER_INITIAL,
  POWER_MIN,
  POWER_MAX,
  LEVEL_INITIAL,
  REBIRTH_INITIAL,
  REBIRTH_MIN,
  REBIRTH_MAX,
  WINS_INITIAL,
  POWER_PER_ACTION_INITIAL,
  levelForPower,
  canAcceptRebirth,
  clamp,
} from '../data/progression.js'
import { HEX_POWER_PAD_TIERS } from '../data/hexPowerPad.js'

// Tech.md §2/§5: THE store — durable state + derive() + all actions. No
// middleware (no persist, no immer, no subscribeWithSelector).

// Recomputes every field that is a pure function of another durable field.
// Called at the end of any action that changes power, so level never has to
// be restated by hand at more than one call site.
function derive(state) {
  return { ...state, level: levelForPower(state.power) }
}

export const useGameStore = create((set, get) => ({
  power: POWER_INITIAL,
  level: LEVEL_INITIAL,
  rebirth: REBIRTH_INITIAL,
  wins: WINS_INITIAL,
  powerPerAction: POWER_PER_ACTION_INITIAL,
  destroyedWalls: new Set(),
  ownedHexPads: new Set(), // indices into data/hexPowerPad.js's HEX_POWER_PAD_TIERS
  equippedHexPad: null, // index of the currently equipped pad, or null

  // One Action's worth of Power. Called only from systems/actionTracker.js,
  // never directly from a component. `multiplier` is the AFK target's "xN"
  // tier (systems/afk.js afkState.multiplier) while AFK-locked, else 1 — the
  // spec's override: powerPerAction * (rebirth + 1) * multiplier. Returns the
  // Power actually added after the POWER_MAX clamp (0 once maxed), which
  // systems/actionTracker.js turns into a "+N" popup.
  gainPower(multiplier = 1) {
    let applied = 0
    set((state) => {
      const mult = multiplier > 0 ? multiplier : 1
      const gain = state.powerPerAction * (state.rebirth + 1) * mult
      const power = clamp(state.power + gain, POWER_MIN, POWER_MAX)
      applied = power - state.power
      return derive({ ...state, power })
    })
    return applied
  },

  // Manual, gated by canAcceptRebirth. Re-checks eligibility itself so a
  // duplicate/stale caller can never double-apply a rebirth.
  acceptRebirth() {
    const state = get()
    if (!canAcceptRebirth(state.level, state.rebirth)) return
    set((s) =>
      derive({
        ...s,
        rebirth: clamp(s.rebirth + 1, REBIRTH_MIN, REBIRTH_MAX),
        power: POWER_INITIAL,
      }),
    )
  },

  // Called once from systems/wallHealth.js the frame a wall's health first
  // reaches 0. Idempotent: adding an id already in the set is a no-op change.
  destroyWall(id) {
    set((s) => ({ destroyedWalls: new Set(s.destroyedWalls).add(id) }))
  },

  // Called only from systems/glowFloorPanel.js, the frame the player first
  // steps onto a given win panel (that system re-arms per panel on exit, so a
  // held stand never re-triggers). Wins are a threshold currency here, not
  // spent — same as buyHexPad's gate — so this just grows the running total.
  awardWins(amount) {
    if (!(amount > 0)) return
    set((s) => ({ wins: s.wins + amount }))
  },

  // Also called from systems/glowFloorPanel.js on a win-panel respawn: forget
  // every destroyed wall so WallProps.jsx remounts them all. The matching
  // health snapshot and colliders are restored by systems/wallHealth.js
  // resetWalls() and systems/collision.js resetAabbs() in the same step. A
  // no-op change when nothing is destroyed.
  resetWalls() {
    set((s) => (s.destroyedWalls.size === 0 ? s : { destroyedWalls: new Set() }))
  },

  // Called only from systems/hexPowerPad.js, which already checked
  // nearness/interact — re-checks ownership and the wins gate itself so a
  // duplicate/stale caller (or a wins value that has since dropped) can never
  // double-apply or bypass a buy. Wins are a threshold here, not spent.
  buyHexPad(index) {
    const state = get()
    if (state.ownedHexPads.has(index)) return
    const tier = HEX_POWER_PAD_TIERS[index]
    if (!tier || state.wins < tier.winsRequired) return
    set((s) => ({ ownedHexPads: new Set(s.ownedHexPads).add(index) }))
  },

  // Re-checks ownership itself, same reasoning as buyHexPad above.
  equipHexPad(index) {
    const state = get()
    if (!state.ownedHexPads.has(index)) return
    const tier = HEX_POWER_PAD_TIERS[index]
    if (!tier) return
    set({ equippedHexPad: index, powerPerAction: tier.powerPerAction })
  },
}))
