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

  // One Action's worth of Power. Called only from systems/actionTracker.js,
  // never directly from a component.
  gainPower() {
    set((state) => {
      const gain = state.powerPerAction * (state.rebirth + 1)
      const power = clamp(state.power + gain, POWER_MIN, POWER_MAX)
      return derive({ ...state, power })
    })
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
}))
