// The equipped cosmetics + body proportions the portal owns for this user.
// Mutated in place like playerState, so the loader and the frame loop can read
// it without a subscription (Tech.md §5.1, rule 2).
import { DEFAULT_EQUIPPED, PROPORTIONS, clamp } from '../data/bloxity.js'

function defaultProportions() {
  const p = {}
  for (const [k, spec] of Object.entries(PROPORTIONS)) p[k] = spec.def
  return p
}

export const avatarState = {
  // Signed out, SDK absent, or nothing loaded yet: the guest wears
  // DEFAULT_EQUIPPED (the bare base rig). null is reserved for an explicit
  // "hide the avatar" and still drops Player back to the capsule; the capsule
  // also shows whenever a build fails (base rig 404, blocked CDN).
  equipped: DEFAULT_EQUIPPED,
  proportions: defaultProportions(),
}

const listeners = new Set()

export function subscribe(fn) {
  listeners.add(fn)
  fn(avatarState)
  return () => listeners.delete(fn)
}

function emit(reason) {
  for (const fn of listeners) fn(avatarState, reason)
}

function writeProportions(next) {
  const p = avatarState.proportions
  for (const [k, spec] of Object.entries(PROPORTIONS)) {
    const raw = next && next[k] != null ? Number(next[k]) : spec.def
    p[k] = clamp(Number.isFinite(raw) ? raw : spec.def, spec.min, spec.max)
  }
}

export function setEquipped(equipped) {
  avatarState.equipped = equipped || null
  emit('equipped')
}

// Proportions arrive from a remote portal: clamp every field to its documented
// range before anything touches the scene graph. Used on its own by
// onProportionsChanged, where equipped cosmetics have not changed — a
// bones-only update, no rebuild.
export function setProportions(next) {
  writeProportions(next)
  emit('proportions')
}

// Equipped + proportions changing together (login, onAvatarChanged) must land
// as ONE notification. Two separate setEquipped()/setProportions() calls each
// emit synchronously, and a subscriber that is mid-rebuild from the first
// notification has no 'built' avatar yet to apply the second to — so it was
// starting a second, redundant rebuild and discarding the first one's result
// once it resolved. This makes the pairing atomic.
export function setAvatar(equipped, proportions) {
  avatarState.equipped = equipped || null
  writeProportions(proportions)
  emit('equipped')
}

export function resetAvatar() {
  avatarState.equipped = DEFAULT_EQUIPPED
  avatarState.proportions = defaultProportions()
  emit('reset')
}
