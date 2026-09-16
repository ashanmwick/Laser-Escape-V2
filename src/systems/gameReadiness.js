// Cross-cutting signals components/LoadingScreen.jsx reads, gathered from
// systems that otherwise have no reason to import a DOM overlay component.
// Framework-free (Tech.md rule 2).

// --- Frame warm-up: once armed (by LoadingScreen.jsx, after every hub
// prop/wall has settled), waits for a handful of real rendered frames —
// shaders compiled, geometry uploaded to the GPU — so the first frame the
// player actually sees on a bare canvas isn't the one paying for that cost.
const WARMUP_FRAMES = 3
let armed = false
let warmFrameCount = 0
let resolveWarmup
const warmupPromise_ = new Promise((res) => {
  resolveWarmup = res
})

export function armFrameWarmup() {
  armed = true
}

// Called every frame from GameLoop.jsx; a no-op until armed and again once
// satisfied, so the steady-state cost is a single boolean check.
export function tickFrame() {
  if (!armed || warmFrameCount >= WARMUP_FRAMES) return
  warmFrameCount += 1
  if (warmFrameCount >= WARMUP_FRAMES) resolveWarmup()
}

export function frameWarmupPromise() {
  return warmupPromise_
}

// --- Avatar: a LIVE ready flag, not one-shot. systems/avatarModel.js's base
// rig retry loop never gives up on its own, so `ready` stays false for as
// long as the real Bloxity rig isn't mounted — at boot, or any later moment
// a rebuild is in flight/retrying (a sign-in swapping cosmetics, a CDN blip
// mid-game). LoadingScreen.jsx blocks play the entire time `ready` is
// false — including reopening itself if this flips false again well after
// its own props/walls gate has settled — with deliberately no timeout that
// lets the player through on the capsule alone.
let avatarReady = false
let avatarAttempt = 0
const avatarListeners = new Set()

function emitAvatar() {
  const snapshot = { ready: avatarReady, attempt: avatarAttempt }
  for (const fn of avatarListeners) fn(snapshot)
}

export function setAvatarReady(ready) {
  if (avatarReady === ready) return
  avatarReady = ready
  if (ready) avatarAttempt = 0
  emitAvatar()
}

// Bumped by avatarModel.js's retry loop on every failed attempt, so the gate
// screen can tell "still trying the first time" (attempt 0) apart from
// "actually failing and retrying" (attempt > 0) and show the retry button
// only once there's something to retry.
export function setAvatarAttempt(n) {
  avatarAttempt = n
  emitAvatar()
}

export function subscribeAvatar(fn) {
  avatarListeners.add(fn)
  fn({ ready: avatarReady, attempt: avatarAttempt })
  return () => avatarListeners.delete(fn)
}

// Lets a manual "Retry Now" click interrupt the base rig's current backoff
// wait instead of sitting out the remaining delay. avatarModel.js registers
// the active wait's resolver while it's pending; this just resolves it
// early, same as net.js's retryNow() collapsing its own backoff.
const pendingRetryResolvers = new Set()

export function registerRetryWait(resolve) {
  pendingRetryResolvers.add(resolve)
  return () => pendingRetryResolvers.delete(resolve)
}

export function retryAvatarNow() {
  for (const resolve of [...pendingRetryResolvers]) resolve()
}
