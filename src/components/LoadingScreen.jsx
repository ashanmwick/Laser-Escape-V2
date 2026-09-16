import { useEffect, useRef, useState } from 'react'
import { preloadAll } from '../systems/preload.js'
import { PRELOAD_TOTAL } from '../data/assetManifest.js'
import {
  avatarSettledPromise,
  armFrameWarmup,
  frameWarmupPromise,
} from '../systems/gameReadiness.js'

// Full-screen DOM overlay (never drei <Html> — Tech.md §5.4), a sibling of the
// <Canvas> in App.jsx. It sits over the canvas while systems/preload.js pulls
// every hub model into memory. The canvas mounts underneath at the same time,
// so each prop component loads from propModel.js's now-warm cache and the
// frame behind this screen is already complete by the time the bar fills.
//
// Three gates, all real readiness signals rather than a fixed timer:
//   1. every hub prop/wall model (systems/preload.js)
//   2. the Bloxity avatar's first build attempt settling, real or capsule
//      fallback (systems/gameReadiness.js, fed by PlayerAvatar.jsx)
//   3. a few real rendered frames of that fully-populated scene, so shader
//      compilation/GPU upload happens behind the overlay instead of as the
//      first jank the player sees once it's gone
// Self-dismissing: once all three settle it waits two more animation frames
// (so the final GPU upload lands) then fades out and unmounts. A hard safety
// timeout hides it even if a request never settles, so a dead CDN can never
// trap the player on the loading screen.
const FADE_MS = 450
const SAFETY_MS = 15000
// +1 for the avatar settling, +1 for the post-load frame warm-up.
const TOTAL_STEPS = PRELOAD_TOTAL + 2

export default function LoadingScreen() {
  const [loaded, setLoaded] = useState(0)
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)
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
    safetyRef.current = setTimeout(() => setDone(true), SAFETY_MS)

    Promise.all([
      preloadAll((n) => setLoaded(n)),
      avatarSettledPromise().then(() => setLoaded((n) => n + 1)),
    ])
      .then(() => {
        armFrameWarmup()
        return frameWarmupPromise()
      })
      .then(() => setLoaded((n) => n + 1))
      .finally(() => {
        clearTimeout(safetyRef.current)
        requestAnimationFrame(() => requestAnimationFrame(() => setDone(true)))
      })
  }, [])

  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => setGone(true), FADE_MS)
    return () => clearTimeout(id)
  }, [done])

  if (gone) return null

  const pct = done ? 100 : Math.round((Math.min(loaded, TOTAL_STEPS) / TOTAL_STEPS) * 100)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0d12] transition-opacity ease-out"
      style={{
        opacity: done ? 0 : 1,
        transitionDuration: `${FADE_MS}ms`,
        pointerEvents: done ? 'none' : 'auto',
      }}
      aria-hidden={done}
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

        <div className="select-none font-mono text-xs tracking-widest text-slate-400">
          {done ? 'READY' : `LOADING… ${pct}%`}
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
