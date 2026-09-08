// Turns inputState.firing into "Action" events (Tech.md §5.1 style: a
// framework-free module, mutable module-level state, stepped once per frame
// from GameLoop). An Action is either a click (press-release under
// ACTION_HOLD_INTERVAL) or a continuous hold, which re-fires every
// ACTION_HOLD_INTERVAL seconds. The two are mutually exclusive per press: a
// hold that crosses the interval always fires before release can be
// observed, which suppresses the click grant on the release frame.
import { inputState } from './input.js'
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
      // live — grant exactly the one action it's worth, same as a click.
      useGameStore.getState().gainPower()
      firingPrev = false
      return
    }
  }

  const firing = inputState.firing

  if (firing) {
    pressElapsed += dt
    sinceLastAction += dt
    while (sinceLastAction >= ACTION_HOLD_INTERVAL) {
      useGameStore.getState().gainPower()
      sinceLastAction -= ACTION_HOLD_INTERVAL
      holdFiredDuringPress = true
    }
  } else if (firingPrev) {
    if (!holdFiredDuringPress && pressElapsed < ACTION_HOLD_INTERVAL) {
      useGameStore.getState().gainPower()
    }
    pressElapsed = 0
    sinceLastAction = 0
    holdFiredDuringPress = false
  }

  firingPrev = firing
}
