import { useEffect, useRef } from 'react'
import { player } from '../../systems/playerState.js'

// DOM sibling of the canvas, never drei <Html> (Tech.md §5.4). Must not
// re-render per frame: the position readout is written to textContent on a
// ~10Hz interval that reads the singleton directly.
export default function Hud() {
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

  return (
    <div className="pointer-events-none absolute inset-0 p-4 font-mono text-xs leading-5 text-slate-200">
      <div className="inline-block rounded bg-black/40 px-3 py-2">
        <div className="mb-1 font-semibold text-slate-100">Laser Escape</div>
        <div>WASD / arrows &mdash; move</div>
        <div>right-drag &mdash; orbit camera</div>
        <div>wheel &mdash; zoom</div>
        <div>space &mdash; jump</div>
        <div>hold left-click &mdash; fire (reserved)</div>
        <div ref={posRef} className="mt-2 text-slate-400">x 0.0   y 0.0   z 0.0</div>
      </div>
    </div>
  )
}
