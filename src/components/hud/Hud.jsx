import { useEffect, useRef } from 'react'
import { afkState } from '../../systems/afk.js'
import { hexPowerPadState } from '../../systems/hexPowerPad.js'
import { podiumHintState } from '../../systems/podiumHint.js'
import { settings } from '../../systems/settingsState.js'
import { useGameStore } from '../../store/useGameStore.js'
import { canAcceptRebirth } from '../../data/progression.js'
import { HEX_POWER_PAD_TIERS } from '../../data/hexPowerPad.js'
import ActionPopups from './ActionPopups.jsx'
import LevelBar from './LevelBar.jsx'
import LevelUpPopup from './LevelUpPopup.jsx'
import NetStatus from './NetStatus.jsx'
import AuthPanel from './AuthPanel.jsx'
import { useSettings } from './hooks.js'

// 1000 -> "1K", 1500 -> "1.5K", 2_000_000 -> "2M". Trims a trailing ".0".
function formatCompact(n) {
  const abs = Math.abs(n)
  if (abs < 1000) return String(n)
  const units = [
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' },
  ]
  const { value, suffix } = units.find((u) => abs >= u.value)
  const scaled = n / value
  const text = scaled.toFixed(1).replace(/\.0$/, '')
  return `${text}${suffix}`
}

// Left-edge, vertically centred stack: win count above, rebirth action below.
// Both are selector-driven and re-render only when their value changes, never
// per frame (Tech.md §5.4). Wins change at human speed; rebirth eligibility is
// a boolean flip. The rebirth button stays mounted but disabled until eligible.
function LeftCenterControls() {
  const wins = useGameStore((s) => s.wins)
  const canRebirth = useGameStore((s) => canAcceptRebirth(s.level, s.rebirth))
  const acceptRebirth = useGameStore((s) => s.acceptRebirth)
  return (
    <div className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-slate-400/30 bg-black/50 px-3 py-2 text-slate-100 shadow-lg">
        <img src="/ui/xp_cup.png" alt="" className="h-8 w-8" draggable={false} />
        <span
          className="font-bold tabular-nums"
          style={{
            // Matches GlowFloorPanelLabel's Wins <Text>: #ffd21e fill, bold,
            // letterSpacing -0.02, black outline at ~10% of font size, drawn
            // behind the fill (SDF outlineWidth 0.09 / fontSize 0.9).
            fontSize: '1.125rem',
            lineHeight: 1,
            color: '#ffd21e',
            letterSpacing: '-0.02em',
            WebkitTextStroke: '2px #000000',
            paintOrder: 'stroke fill',
          }}
        >
          {formatCompact(wins)}
        </span>
      </div>
      <button
        type="button"
        onClick={acceptRebirth}
        disabled={!canRebirth}
        title={canRebirth ? 'Accept rebirth' : 'Rebirth not available yet'}
        className="pointer-events-auto flex flex-col items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-600/80 px-3 py-2 text-slate-100 shadow-lg transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-600/80"
      >
        <img src="/ui/rebirth.png" alt="" className="h-10 w-10" draggable={false} />
        <span className="text-xs font-semibold tracking-wide">Rebirth</span>
      </button>
    </div>
  )
}

// DOM siblings of the canvas, never drei <Html> (Tech.md §5.4). Must not
// re-render per frame: the proximity prompts are written to textContent on a
// ~10Hz interval that reads the singletons directly. React state here is only
// for panels and portal-driven settings, which change at human speed.
export default function Hud() {
  useSettings()
  const afkPromptRef = useRef(null)
  const hexPadPromptRef = useRef(null)
  const podiumHintRef = useRef(null)

  // afkState (systems/afk.js) changes at human speed — near a target, locked
  // on, or neither — so a throttled textContent poll keeps this out of
  // React's render loop.
  useEffect(() => {
    const id = setInterval(() => {
      const el = afkPromptRef.current
      if (!el) return
      if (afkState.active) {
        el.textContent = 'AFK firing — move or press Space to stop (E to stop)'
        el.style.display = ''
      } else if (afkState.nearTargetId) {
        el.textContent = afkState.nearAllowed
          ? 'Press E to AFK Here'
          : `Rebirth ${afkState.nearRebirthRequired} required to AFK here`
        el.style.display = ''
      } else {
        el.style.display = 'none'
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  // Same throttled-poll pattern as the afk prompt above. Hidden whenever the
  // afk prompt would show (target zones and pad zones can't both be relevant
  // at once — see systems/hexPowerPad.js and systems/afk.js's shared
  // interact-flag handling), so the two never overlap on screen.
  useEffect(() => {
    const id = setInterval(() => {
      const el = hexPadPromptRef.current
      if (!el) return
      const index = hexPowerPadState.nearIndex
      if (index === null || afkState.active || afkState.nearTargetId) {
        el.style.display = 'none'
        return
      }
      const { ownedHexPads, equippedHexPad, wins } = useGameStore.getState()
      const tier = HEX_POWER_PAD_TIERS[index]
      if (ownedHexPads.has(index)) {
        if (equippedHexPad === index) {
          el.style.display = 'none'
        } else {
          el.textContent = 'Press E to Equip Laser'
          el.style.display = ''
        }
      } else if (wins >= tier.winsRequired) {
        el.textContent = 'Press E to Buy Laser'
        el.style.display = ''
      } else {
        el.textContent = `Need ${tier.winsRequired} Wins to Buy`
        el.style.display = ''
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  // Same throttled-poll pattern. Coaching hint shown while the player is near
  // a podium and still on the ground (systems/podiumHint.js picks the message
  // per prop). Sits higher than the afk / hex-pad prompts so it never
  // overlaps one if both are relevant at once.
  useEffect(() => {
    const id = setInterval(() => {
      const el = podiumHintRef.current
      if (!el) return
      const text = podiumHintState.text
      if (text) {
        if (el.textContent !== text) el.textContent = text
        el.style.display = ''
      } else {
        el.style.display = 'none'
      }
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
      <div
        ref={afkPromptRef}
        className="pointer-events-none absolute left-1/2 top-[70%] -translate-x-1/2 -translate-y-1/2 rounded bg-black/60 px-3 py-1.5 text-sm text-slate-100"
        style={{ display: 'none' }}
      />

      <div
        ref={hexPadPromptRef}
        className="pointer-events-none absolute left-1/2 top-[70%] -translate-x-1/2 -translate-y-1/2 rounded bg-black/60 px-3 py-1.5 text-sm text-slate-100"
        style={{ display: 'none' }}
      />

      <div
        ref={podiumHintRef}
        className="pointer-events-none absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 rounded bg-black/60 px-3 py-1.5 text-sm text-slate-100"
        style={{ display: 'none' }}
      />

      <LeftCenterControls />

      <AuthPanel panelStyle={panelStyle} />

      {/* Bottom-centre level progress bar. DOM sibling of the canvas, written
         from a throttled store subscription — never re-renders per frame
         (Tech.md §5.4). */}
      <LevelBar />

      {/* Top-centre "LEVEL UP!" banner. DOM sibling of the canvas, driven by a
         transient store subscription that runs one Web-Animations pass per
         level rise — never re-renders per frame (Tech.md §5.4). */}
      <LevelUpPopup />

      {/* Top-centre multiplayer status pill. Event-driven — re-renders only on
         connect / disconnect / player-count changes (Tech.md §5.4). */}
      <NetStatus />

      {/* Per-Action "+N" power badges around the player. Owns its own rAF loop
         and never re-renders (Tech.md §5.4). */}
      <ActionPopups />
    </div>
  )
}
