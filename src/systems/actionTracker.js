// Turns inputState.firing into "Action" events (Tech.md §5.1 style: a
// framework-free module, mutable module-level state, stepped once per frame
// from GameLoop). An Action is either a click (press-release under
// ACTION_HOLD_INTERVAL) or a continuous hold, which re-fires every
// ACTION_HOLD_INTERVAL seconds. The two are mutually exclusive per press: a
// hold that crosses the interval always fires before release can be
// observed, which suppresses the click grant on the release frame.
//
// Every Action also lands one discrete wall strike (systems/wallHealth.js
// strikeWall()): the click hit on the press edge, then one more per hold
// interval — so a wall on the beam loses the player's current Power per
// Action, the same cadence gainPower() adds Power on.
import { inputState } from './input.js'
import { afkState } from './afk.js'
import { spawnActionPopup } from './actionPopups.js'
import { strikeWall } from './wallHealth.js'
import { useGameStore } from '../store/useGameStore.js'
import { ACTION_HOLD_INTERVAL } from '../data/progression.js'

let firingPrev = false
let pressElapsed = 0 // seconds since the current press started
let sinceLastAction = 0 // seconds since the last action fired in this press
let holdFiredDuringPress = false
let lastProcessedPressSeq = 0

export function step(dt) {
  // inputState.firePressSeq is bumped synchronously in the real pointerdown
  // handler, so a press-and-release that both happen between two polls of
  // this function (a fast click, easily faster than one animation frame) is
  // never silently lost the way a plain level-read of `firing` would lose it.
  if (inputState.firePressSeq !== lastProcessedPressSeq) {
    lastProcessedPressSeq = inputState.firePressSeq
    pressElapsed = 0
    sinceLastAction = 0
    holdFiredDuringPress = false

    if (!inputState.firing && inputState.fireReleaseAt >= inputState.firePressAt) {
      // The whole press already resolved before we ever observed `firing`
      // live — grant exactly the one action it's worth, same as a click. No
      // wall strike: the beam never rendered this press, so there is no aim to
      // resolve a wall from.
      spawnActionPopup(useGameStore.getState().gainPower())
      firingPrev = false
      return
    }
  }

  // AFK lock (systems/afk.js) counts as a continuous hold, same as a real
  // mouse press — it drives systems/laser.js the same way (see laser.js).
  const firing = inputState.firing || afkState.active

  if (firing) {
    // The "click" wall hit, landed the frame the button goes down while the
    // beam is still guaranteed on the wall (the Power grant for a click comes
    // later, on the release frame, by when systems/laser.js has cleared the
    // aim). A press that turns into a hold keeps taking one strike per
    // ACTION_HOLD_INTERVAL below, so a held wall drains at t=0, 2, 4, ...
    if (!firingPrev) strikeWall()
    pressElapsed += dt
    sinceLastAction += dt
    // While AFK-locked, each Action's Power is scaled by the target's "xN"
    // tier (systems/afk.js); a real held mouse press is always 1x.
    const mult = afkState.active ? afkState.multiplier : 1
    while (sinceLastAction >= ACTION_HOLD_INTERVAL) {
      strikeWall()
      spawnActionPopup(useGameStore.getState().gainPower(mult))
      sinceLastAction -= ACTION_HOLD_INTERVAL
      holdFiredDuringPress = true
    }
  } else if (firingPrev) {
    if (!holdFiredDuringPress && pressElapsed < ACTION_HOLD_INTERVAL) {
      spawnActionPopup(useGameStore.getState().gainPower())
    }
    pressElapsed = 0
    sinceLastAction = 0
    holdFiredDuringPress = false
  }

  firingPrev = firing
}
