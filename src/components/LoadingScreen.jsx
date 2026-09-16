import { useEffect, useRef, useState } from 'react'
import { preloadAll } from '../systems/preload.js'
import { PRELOAD_TOTAL } from '../data/assetManifest.js'
import {
  armFrameWarmup,
  frameWarmupPromise,
  subscribeAvatar,
  retryAvatarNow,
} from '../systems/gameReadiness.js'

// Full-screen DOM overlay (never drei <Html> — Tech.md §5.4), a sibling of the
// <Canvas> in App.jsx. It sits over the canvas while systems/preload.js pulls
// every hub model into memory. The canvas mounts underneath at the same time,
// so each prop component loads from propModel.js's now-warm cache and the
// frame behind this screen is already complete by the time the bar fills.
//
// One screen, two things it waits on, shown as separate status lines so it's
// always clear which one is still pending:
//   1. Assets — every hub prop/wall model (systems/preload.js), then a few
//      real rendered frames of that fully-populated scene so shader
//      compilation/GPU upload happens behind the overlay instead of as the
//      first jank the player sees once it's gone. Bounded by SAFETY_MS: a
//      dead prop CDN can never trap the player on this part.
//   2. Character — the Bloxity avatar (systems/avatarModel.js /
//      PlayerAvatar.jsx via systems/gameReadiness.js's live avatarReady
//      flag). NOT bounded by a timeout: unlike a missing wall prop, there is
//      no acceptable "play without it" state, so this screen stays up for as
//      long as it takes, with a manual "Retry Now" once an attempt fails.
//
// Assets only ever need to settle once; the character line can reopen this
// screen any time later too — a sign-in swapping cosmetics, a CDN blip
// mid-game — since avatarReady is live, not one-shot.
const FADE_MS = 450
const SAFETY_MS = 12000
const TOTAL_STEPS = PRELOAD_TOTAL + 1 // +1 for the post-load frame warm-up

export default function LoadingScreen() {
  const [loaded, setLoaded] = useState(0)
  const [assetsSettled, setAssetsSettled] = useState(false)
  const [avatarStatus, setAvatarStatus] = useState({ ready: false, attempt: 0 })
  const [hidden, setHidden] = useState(false)
  const startedRef = useRef(false)
  const safetyRef = useRef(null)

  useEffect(() => {
    // React 18 StrictMode invokes effects twice in dev; the preload must run
    // once, so guard it rather than relying on cleanup.
    if (startedRef.current) return
    startedRef.current = true

    // Kept in a ref, not a local var a cleanup closes over: StrictMode's
    // dev-only mount -> cleanup -> remount would otherwise clear this on the
    // phantom cleanup (the guard above then skips creating a replacement,
    // since startedRef is already true), silently disarming the one timer
    // that guarantees a dead CDN can't trap the player. A genuine unmount
    // before this fires just lets it tick down harmlessly against an
    // unmounted component.
    safetyRef.current = setTimeout(() => setAssetsSettled(true), SAFETY_MS)

    preloadAll((n) => setLoaded(n))
      .then(() => {
        armFrameWarmup()
        return frameWarmupPromise()
      })
      .then(() => setLoaded((n) => n + 1))
      .finally(() => {
        clearTimeout(safetyRef.current)
        requestAnimationFrame(() => requestAnimationFrame(() => setAssetsSettled(true)))
      })
  }, [])

  useEffect(() => subscribeAvatar(setAvatarStatus), [])

  const ready = assetsSettled && avatarStatus.ready

  // Fades out FADE_MS after both gates are satisfied; reopens immediately
  // (no fade) the moment either one isn't — assetsSettled only ever goes
  // true -> stays true, but avatarStatus.ready can drop again later.
  useEffect(() => {
    if (!ready) {
      setHidden(false)
      return
    }
    const id = setTimeout(() => setHidden(true), FADE_MS)
    return () => clearTimeout(id)
  }, [ready])

  const pct = assetsSettled ? 100 : Math.round((Math.min(loaded, TOTAL_STEPS) / TOTAL_STEPS) * 100)

  let statusText
  if (!assetsSettled) statusText = `LOADING WORLD… ${pct}%`
  else if (!avatarStatus.ready) {
    statusText =
      avatarStatus.attempt === 0
        ? 'LOADING CHARACTER…'
        : `RECONNECTING CHARACTER… (attempt ${avatarStatus.attempt + 1})`
  } else statusText = 'READY'

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0d12] transition-opacity ease-out"
      style={{
        opacity: hidden ? 0 : 1,
        transitionDuration: `${FADE_MS}ms`,
        pointerEvents: hidden ? 'none' : 'auto',
      }}
      aria-hidden={hidden}
    >
      <div className="flex flex-col items-center gap-7 px-8">
        <div className="relative">
          <h1 className="select-none text-2xl font-semibold tracking-[0.35em] text-slate-100 sm:text-3xl">
            LASER&nbsp;ESCAPE
          </h1>
          {/* laser sweep under the wordmark */}
          <span className="pointer-events-none absolute -bottom-2 left-0 block h-px w-full overflow-hidden">
            <span className="block h-full w-1/3 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent shadow-[0_0_8px_#22c55e] animate-[laserSweep_1.4s_linear_infinite]" />
          </span>
        </div>

        <div className="h-1.5 w-64 overflow-hidden rounded-full bg-white/10 sm:w-80">
          <div
            className="h-full rounded-full bg-[#22c55e] shadow-[0_0_10px_#22c55e] transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="select-none font-mono text-xs tracking-widest text-slate-400">{statusText}</div>
          {assetsSettled && !avatarStatus.ready && avatarStatus.attempt > 0 && (
            <button
              type="button"
              onClick={retryAvatarNow}
              className="rounded-full border border-[#22c55e]/60 bg-[#22c55e]/10 px-5 py-2 font-mono text-xs tracking-widest text-[#22c55e] transition hover:bg-[#22c55e]/20"
            >
              RETRY NOW
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes laserSweep {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(420%); }
        }
      `}</style>
    </div>
  )
}
