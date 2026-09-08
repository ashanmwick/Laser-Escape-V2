import { useEffect, useRef } from 'react'
import { player } from '../../systems/playerState.js'
import { settings } from '../../systems/settingsState.js'
import { useGameStore } from '../../store/useGameStore.js'
import { canAcceptRebirth } from '../../data/progression.js'
import Stats from '../Stats.jsx'
import AuthPanel from './AuthPanel.jsx'
import ChatLine from './ChatLine.jsx'
import { useSettings } from './hooks.js'

// Rebirth requires an explicit accept once eligible. The selector re-runs on
// every store change but only re-renders this component when the boolean
// itself flips, which is the correct cost for something that mounts/unmounts
// a DOM node (Tech.md §5.4: the HUD must not re-render per frame).
function RebirthButton() {
  const canRebirth = useGameStore((s) => canAcceptRebirth(s.level, s.rebirth))
  const acceptRebirth = useGameStore((s) => s.acceptRebirth)
  if (!canRebirth) return null
  return (
    <button
      type="button"
      onClick={acceptRebirth}
      className="pointer-events-auto mt-2 rounded bg-amber-600 px-2 py-1 text-slate-100 hover:bg-amber-500"
    >
      Rebirth available &mdash; accept
    </button>
  )
}

// DOM siblings of the canvas, never drei <Html> (Tech.md §5.4). Must not
// re-render per frame: the position readout is written to textContent on a
// ~10Hz interval that reads the singleton directly. React state here is only
// for panels and portal-driven settings, which change at human speed.
export default function Hud() {
  useSettings()
  const posRef = useRef(null)
  const powerRef = useRef(null)
  const levelRef = useRef(null)
  const rebirthRef = useRef(null)
  const winsRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => {
      const el = posRef.current
      if (!el) return
      const p = player.position
      el.textContent = `x ${p.x.toFixed(1)}   y ${p.y.toFixed(1)}   z ${p.z.toFixed(1)}`
    }, 100)
    return () => clearInterval(id)
  }, [])

  // Power can change many times a second while the player holds to fire — a
  // selector hook would re-render this component on every one. Subscribing
  // transiently and throttling the textContent write to ~10Hz keeps the HUD
  // out of React's render loop entirely (Tech.md §5.4).
  useEffect(() => {
    let lastWrite = 0
    const write = () => {
      const now = performance.now()
      if (now - lastWrite < 100) return
      lastWrite = now
      const s = useGameStore.getState()
      if (powerRef.current) powerRef.current.textContent = String(s.power)
      if (levelRef.current) levelRef.current.textContent = String(s.level)
      if (rebirthRef.current) rebirthRef.current.textContent = String(s.rebirth)
      if (winsRef.current) winsRef.current.textContent = String(s.wins)
    }
    write()
    return useGameStore.subscribe(write)
  }, [])

  // background_transparency (0.2–1.0, default 0.9) scales the panel backing
  // rather than replacing it, so the default lands on the 0.4 alpha the HUD was
  // designed with instead of a hard black slab.
  const panelStyle = {
    backgroundColor: `rgba(0, 0, 0, ${(settings.background_transparency * 0.4).toFixed(3)})`,
  }

  return (
    <div className="pointer-events-none absolute inset-0 p-4 font-mono text-xs leading-5 text-slate-200">
      <div className="inline-block rounded px-3 py-2" style={panelStyle}>
        <div className="mb-1 font-semibold text-slate-100">Laser Escape</div>
        <div>WASD / arrows &mdash; move</div>
        <div>right-drag &mdash; orbit camera</div>
        <div>wheel &mdash; zoom</div>
        <div>space &mdash; jump</div>
        <div>hold left-click &mdash; fire laser</div>
        <div>esc &mdash; menu</div>
        <div ref={posRef} className="mt-2 text-slate-400">x 0.0   y 0.0   z 0.0</div>
        <div className="mt-2 text-slate-100">
          Power <span ref={powerRef}>1</span> &middot; Level <span ref={levelRef}>1</span>
        </div>
        <div className="text-slate-400">
          Rebirth <span ref={rebirthRef}>0</span> &middot; Wins <span ref={winsRef}>0</span>
        </div>
        <RebirthButton />
        {settings.show_fps && (
          <div className="text-slate-400">
            <Stats />
          </div>
        )}
        {settings.enable_chat && <ChatLine />}
      </div>

      <AuthPanel panelStyle={panelStyle} />
    </div>
  )
}
