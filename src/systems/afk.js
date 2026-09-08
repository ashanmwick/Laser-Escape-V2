// AFK auto-fire (Tech.md §5.1 style: framework-free, mutable singleton,
// stepped once per frame from GameLoop, before actionTracker/laser so both
// see this frame's state). Near a target in data/afk.js's AFK_TARGET_CONFIG
// the HUD prompts "Press E to AFK Here" (components/hud/Hud.jsx polls
// afkState); pressing E there — only if the player's rebirth meets that
// target's rebirthRequired — locks the player onto it. systems/laser.js then
// aims the beam at its top area (data/targets.js TARGET_AIM_POINT, offset
// customizable per id) every frame with no mouse input, exactly as if firing
// were held, and while locked every Action's Power is scaled by the target's
// "xN" tier (afkState.multiplier, consumed in systems/actionTracker.js). Any
// movement key or Space breaks the lock — the player has to stand still to
// AFK — and E again toggles it off directly.
import { inputState, isHeld } from './input.js'
import { player } from './playerState.js'
import { useGameStore } from '../store/useGameStore.js'
import { TARGET_BY_ID } from '../data/targets.js'
import { AFK_RANGE, AFK_TARGET_CONFIG, afkPowerMultiplier } from '../data/afk.js'

export const afkState = {
  active: false, // true while locked onto targetId and auto-firing
  targetId: null, // AFK_TARGET_CONFIG id currently locked onto, valid only while active
  multiplier: 1, // power multiplier for the locked target, valid only while active
  nearTargetId: null, // nearest configured target within AFK_RANGE this frame, or null; drives the HUD prompt
  nearAllowed: false, // player's rebirth meets nearTargetId's rebirthRequired
  nearRebirthRequired: 0, // nearTargetId's rebirthRequired, for the HUD prompt
}

function findNearestTargetInRange() {
  const p = player.position
  let bestId = null
  let bestDistSq = AFK_RANGE * AFK_RANGE
  for (const id in AFK_TARGET_CONFIG) {
    const t = TARGET_BY_ID.get(id)
    if (!t) continue
    const dx = p.x - t.position[0]
    const dy = p.y - t.position[1]
    const dz = p.z - t.position[2]
    const distSq = dx * dx + dy * dy + dz * dz
    if (distSq <= bestDistSq) {
      bestDistSq = distSq
      bestId = id
    }
  }
  return bestId
}

export function stopAfk() {
  afkState.active = false
  afkState.targetId = null
  afkState.multiplier = 1
}

function startAfk(id) {
  afkState.active = true
  afkState.targetId = id
  afkState.multiplier = afkPowerMultiplier(AFK_TARGET_CONFIG[id].power)
}

export function step() {
  const nearId = findNearestTargetInRange()
  const rebirth = useGameStore.getState().rebirth
  afkState.nearTargetId = nearId
  afkState.nearRebirthRequired = nearId ? AFK_TARGET_CONFIG[nearId].rebirthRequired : 0
  afkState.nearAllowed = nearId !== null && rebirth >= afkState.nearRebirthRequired

  // Only claim the shared interact flag when it's actually this system's to
  // handle — hexPowerPad.js also listens on it now, and a press near neither
  // zone falls through to GameLoop.jsx's end-of-frame reset instead of
  // lingering into a frame where it would wrongly fire something later.
  // Consume on zone entry, not on effect: a press near a target the player's
  // rebirth is too low for still belongs to this system (it just does
  // nothing), same rule hexPowerPad.js uses for an unaffordable pad.
  if (inputState.interact && (afkState.active || nearId !== null)) {
    inputState.interact = false
    if (afkState.active) {
      stopAfk()
    } else if (afkState.nearAllowed) {
      startAfk(nearId)
    }
  }

  if (afkState.active) {
    const moving = inputState.move.x !== 0 || inputState.move.z !== 0
    const cfg = AFK_TARGET_CONFIG[afkState.targetId]
    if (moving || isHeld('Space') || !cfg || rebirth < cfg.rebirthRequired) {
      stopAfk()
    } else {
      // Face the locked target — same atan2(x, z) convention playerMovement
      // uses for travel-direction facing — so the avatar visibly looks at
      // what it's auto-firing at instead of whichever way it last walked.
      const t = TARGET_BY_ID.get(afkState.targetId)
      const dx = t.position[0] - player.position.x
      const dz = t.position[2] - player.position.z
      if (Math.hypot(dx, dz) > 0.01) player.facing = Math.atan2(dx, dz)
    }
  }
}
