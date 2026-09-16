// Cross-cutting signals LoadingScreen.jsx waits on before it reveals the game
// underneath. Framework-free (Tech.md rule 2) — the loading screen is the
// only React surface that reads this.
//
// Two gates, both one-shot and idempotent:
//
// 1. Avatar settle: resolves once the FIRST Bloxity build attempt (a real
//    avatar, or a confirmed fallback to the capsule) has finished, so the
//    screen never drops the player onto a body that pops in a beat later.
//    Later cosmetic rebuilds (sign-in, a portal change) don't re-arm this —
//    by then the game is already playable.
// 2. Frame warm-up: once armed (by the caller, after every asset above has
//    settled), waits for a handful of real rendered frames — shaders
//    compiled, geometry uploaded to the GPU — so the first frame the player
//    actually sees on a bare canvas isn't the one paying for that cost.

let avatarSettled = false
let resolveAvatarSettled
const avatarSettledPromise_ = new Promise((res) => {
  resolveAvatarSettled = res
})

export function markAvatarSettled() {
  if (avatarSettled) return
  avatarSettled = true
  resolveAvatarSettled()
}

export function avatarSettledPromise() {
  return avatarSettledPromise_
}

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
