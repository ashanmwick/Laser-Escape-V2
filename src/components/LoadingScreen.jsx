import { useEffect, useRef, useState } from 'react'
import { preloadAll } from '../systems/preload.js'
import { PRELOAD_TOTAL } from '../data/assetManifest.js'

// Full-screen DOM overlay (never drei <Html> — Tech.md §5.4), a sibling of the
// <Canvas> in App.jsx. It sits over the canvas while systems/preload.js pulls
// every hub model into memory. The canvas mounts underneath at the same time,
// so each prop component loads from propModel.js's now-warm cache and the
// frame behind this screen is already complete by the time the bar fills.
//
// Self-dismissing: once every asset has settled it waits two animation frames
// (so the final GPU upload lands) then fades out and unmounts. A hard safety
// timeout hides it even if a request never settles, so a dead CDN can never
// trap the player on the loading screen.
const FADE_MS = 450
const SAFETY_MS = 12000

export default function LoadingScreen() {
  const [loaded, setLoaded] = useState(0)
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    // React 18 StrictMode invokes effects twice in dev; the preload must run
    // once, so guard it rather than relying on cleanup.
    if (startedRef.current) return
    startedRef.current = true

    const safety = setTimeout(() => setDone(true), SAFETY_MS)
    preloadAll((n) => setLoaded(n)).finally(() => {
      clearTimeout(safety)
      requestAnimationFrame(() => requestAnimationFrame(() => setDone(true)))
    })
    return () => clearTimeout(safety)
  }, [])

  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => setGone(true), FADE_MS)
    return () => clearTimeout(id)
  }, [done])

  if (gone) return null

  const pct = done ? 100 : Math.round((loaded / PRELOAD_TOTAL) * 100)

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
