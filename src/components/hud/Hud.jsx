import { useEffect, useRef } from 'react'
import { player } from '../../systems/playerState.js'
import { settings } from '../../systems/settingsState.js'
import Stats from '../Stats.jsx'
import AuthPanel from './AuthPanel.jsx'
import ChatLine from './ChatLine.jsx'
import { useSettings } from './hooks.js'

// DOM siblings of the canvas, never drei <Html> (Tech.md §5.4). Must not
// re-render per frame: the position readout is written to textContent on a
// ~10Hz interval that reads the singleton directly. React state here is only
// for panels and portal-driven settings, which change at human speed.
export default function Hud() {
  useSettings()
  const posRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => {
      const el = posRef.current
      if (!el) return
      const p = player.position
      el.textContent = `x ${p.x.toFixed(1)}   y ${p.y.toFixed(1)}   z ${p.z.toFixed(1)}`
    }, 100)
    return () => clearInterval(id)
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
        <div>hold left-click &mdash; fire (reserved)</div>
        <div>esc &mdash; menu</div>
        <div ref={posRef} className="mt-2 text-slate-400">x 0.0   y 0.0   z 0.0</div>
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
