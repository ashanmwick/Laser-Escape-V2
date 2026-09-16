import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { afkState } from '../../systems/afk.js'
import { hexPowerPadState } from '../../systems/hexPowerPad.js'
import { merchantState } from '../../systems/merchant.js'
import { settings } from '../../systems/settingsState.js'
import { health as playerHealth } from '../../systems/playerHealth.js'
import { useGameStore } from '../../store/useGameStore.js'
import { canAcceptRebirth, rebirthRequirement } from '../../data/progression.js'
import { HEX_POWER_PAD_TIERS } from '../../data/hexPowerPad.js'
import { AURA_TIERS } from '../../data/aura.js'
import ActionPopups from './ActionPopups.jsx'
import TouchControls from './TouchControls.jsx'
import RotatePrompt from './RotatePrompt.jsx'
import LevelBar from './LevelBar.jsx'
import RebirthLevelBar from './RebirthLevelBar.jsx'
import LevelUpPopup from './LevelUpPopup.jsx'
import NetStatus from './NetStatus.jsx'
import AuthPanel from './AuthPanel.jsx'
import IdentityChip from './IdentityChip.jsx'
import { useSettings, useTouchMode } from './hooks.js'

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

// Shared chrome for every left-center HUD popup (Rebirth, Aura, ...): a
// transparent panel with the title floating (no fill/border box) above its
// top-left corner and the close button overhanging its top-right corner, so
// every popup reads as one consistent "poking out of the panel" style.
//
// `isTouch` shrinks the body's padding — RotatePrompt.jsx forces landscape on
// touch, and phones in landscape there can be as short as ~320px, too little
// for the desktop sizing to fit alongside a bottom-anchored TouchControls
// layer. The panel also caps itself to the viewport height and scrolls
// internally (`max-h-[92vh] overflow-y-auto`) as a hard backstop so a
// shorter device than anticipated still reaches the bottom of the content
// instead of clipping it.
function HudModal({ title, onClose, isTouch, children }) {
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2"
      // systems/input.js listens for wheel on window to drive camera zoom
      // (cameraOrbit.js) regardless of what's under the cursor. Stop it here
      // so scrolling a popup's content (e.g. AuraWindow's tier list) doesn't
      // also zoom the camera behind it.
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="relative w-[min(800px,78vw)]">
        <span
          className="pointer-events-none absolute -top-5 left-6 z-10 text-4xl font-black text-white"
          style={{ WebkitTextStroke: '1.5px black', paintOrder: 'stroke fill' }}
        >
          {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-4 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-md border-2 border-black bg-red-600 font-black text-white shadow-[0_3px_0_rgba(0,0,0,0.4)] transition hover:bg-red-500"
        >
          X
        </button>
        <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-lg border-2 border-black bg-slate-900/60 shadow-2xl">
          <div className="h-6 shrink-0 border-b-2 border-black bg-slate-900/60" />
          <div
            className={`flex flex-col items-center overflow-y-auto text-slate-100 ${isTouch ? 'gap-2 p-2' : 'gap-3 p-4'}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// Opened by Button 4, titled "Rebirth". Confirms the trade of current Power
// for a rebirth point rather than firing it on a single click.
function RebirthWindow({ rebirth, canRebirth, onConfirm, onClose, isTouch }) {
  const requirement = rebirthRequirement(rebirth)
  return (
    <HudModal title="Rebirth" onClose={onClose} isTouch={isTouch}>
      <div
            className={`flex items-center justify-center ${isTouch ? 'gap-2 text-2xl' : 'gap-6 text-[3.625rem]'}`}
          >
            <img
              src="/ui/action_popup.png"
              alt=""
              className={isTouch ? 'h-9 w-9' : 'h-[5.5rem] w-[5.5rem]'}
              draggable={false}
            />
            <span className="font-bold text-amber-300">X{rebirth}</span>
            <span
              className={`inline-block font-black leading-none text-white ${isTouch ? 'text-2xl' : 'text-[4.5rem]'}`}
              style={{ WebkitTextStroke: isTouch ? '2px #7dd3fc' : '3px #7dd3fc', paintOrder: 'stroke fill' }}
            >
              ▶
            </span>
            <img
              src="/ui/action_popup.png"
              alt=""
              className={isTouch ? 'h-9 w-9' : 'h-[5.5rem] w-[5.5rem]'}
              draggable={false}
            />
            <span className="font-bold text-amber-300">X{rebirth + 1}</span>
          </div>

          <div
            className={`text-center font-bold text-red-500 ${isTouch ? 'text-sm' : 'text-[1.625rem]'}`}
            style={{ WebkitTextStroke: isTouch ? '1.5px black' : '3px black', paintOrder: 'stroke fill' }}
          >
            Rebirth resets your Strength and Level!
          </div>

          {/* Visual twin of the bottom-of-screen LevelBar, but plotting level
             progress toward this rebirth's requirement instead of Power
             toward the next character level — see RebirthLevelBar.jsx.
             LevelBar itself stays untouched. */}
          <div className="w-full">
            <RebirthLevelBar compact={isTouch} />
          </div>

          <div
            className={`flex w-full items-stretch justify-center ${isTouch ? 'mb-3 gap-2' : 'mb-5 mt-2 gap-3'}`}
          >
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canRebirth}
              className={`flex-1 self-center rounded-lg border-2 border-black bg-gradient-to-b from-lime-400 to-green-600 font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 ${isTouch ? 'px-2 py-2 text-sm' : 'px-4 py-3 text-lg'}`}
              style={{ WebkitTextStroke: isTouch ? '1px black' : '1.5px black', paintOrder: 'stroke fill' }}
            >
              {canRebirth ? 'Rebirth' : `Level ${requirement} needed`}
            </button>

            <span className={`self-center font-black text-slate-100 ${isTouch ? 'text-sm' : 'text-xl'}`}>
              or
            </span>

            {/* relative wrapper keeps the caption out of flow so it can't
               stretch this column taller than the Rebirth button and knock
               the two buttons' top edges out of alignment. */}
            <div className="relative flex-1 self-center">
              <button
                type="button"
                onClick={onClose}
                className={`w-full rounded-lg border-2 border-black font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.4)] transition hover:brightness-110 ${isTouch ? 'px-2 py-2 text-sm' : 'px-4 py-3 text-lg'}`}
                style={{
                  background:
                    'linear-gradient(90deg, #ff3b3b, #ff9d00, #ffee00, #4dff4d, #33d1ff, #6f6fff, #c96fff)',
                  WebkitTextStroke: isTouch ? '1px black' : '1.5px black',
                  paintOrder: 'stroke fill',
                }}
              >
                Skip Rebirth
              </button>
              <span
                className={`absolute inset-x-0 top-full mt-1 text-center font-bold text-fuchsia-400 ${isTouch ? 'text-[10px]' : 'text-sm'}`}
              >
                Keep all Levels
              </span>
            </div>
          </div>
    </HudModal>
  )
}

// One row of the Aura popup's tier list: icon on the left, name + strength
// multiplier in the middle, one action button on the right that walks
// through three states — mirrors the reference mock the list was built from.
//   1. Not owned: the wins button (buyAuraTier), disabled until affordable.
//   2. Owned, not equipped: an "Equip" button (equipAuraTier).
//   3. Owned and equipped: a non-interactive "Equipped" pill.
// equippedAura is a single store field, so equipping tier N is itself what
// flips every other tier's button back to "Equip" — each row just compares
// its own index against the shared equippedAura.
function AuraEntry({ tier, index, isTouch }) {
  const wins = useGameStore((s) => s.wins)
  const owned = useGameStore((s) => s.ownedAuras.has(index))
  const equipped = useGameStore((s) => s.equippedAura === index)
  const buyAuraTier = useGameStore((s) => s.buyAuraTier)
  const equipAuraTier = useGameStore((s) => s.equipAuraTier)
  const canAfford = wins >= tier.winsRequired
  const textOutline = { WebkitTextStroke: isTouch ? '1px black' : '1.5px black', paintOrder: 'stroke fill' }
  return (
    <div
      className={`flex w-full shrink-0 items-center rounded-lg border-2 border-black bg-slate-800/80 ${isTouch ? 'gap-2 p-2' : 'gap-3 p-3'}`}
    >
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-slate-500 bg-slate-950 ${isTouch ? 'h-11 w-11' : 'h-16 w-16'}`}
      >
        <img src={tier.iconUrl} alt="" className="h-full w-full object-cover" draggable={false} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span className={`font-black text-white ${isTouch ? 'text-sm' : 'text-xl'}`} style={textOutline}>
          {tier.name}
        </span>
        <span className={`font-black text-amber-400 ${isTouch ? 'text-xs' : 'text-lg'}`} style={textOutline}>
          x{tier.strengthMult} Strength
        </span>
      </div>

      <div className={`flex shrink-0 flex-col ${isTouch ? 'gap-0.5' : 'gap-1'}`}>
        {!owned && (
          <button
            type="button"
            onClick={() => buyAuraTier(index)}
            disabled={!canAfford}
            className={`flex items-center justify-center gap-1 rounded-md border-2 border-black bg-gradient-to-b from-amber-300 to-amber-500 font-black text-white transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 ${isTouch ? 'px-1.5 py-0.5 text-xs' : 'px-3 py-1 text-base'}`}
            style={textOutline}
          >
            <span>🏆</span>
            <span>{formatCompact(tier.winsRequired)}</span>
          </button>
        )}
        {owned && !equipped && (
          <button
            type="button"
            onClick={() => equipAuraTier(index)}
            className={`flex items-center justify-center rounded-md border-2 border-black bg-gradient-to-b from-lime-400 to-green-600 font-black text-white transition hover:brightness-110 active:brightness-95 ${isTouch ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-base'}`}
            style={textOutline}
          >
            Equip
          </button>
        )}
        {owned && equipped && (
          <button
            type="button"
            disabled
            className={`flex cursor-default items-center gap-1 rounded-md border-2 border-black bg-gradient-to-b from-sky-400 to-blue-600 font-black text-white ${isTouch ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-base'}`}
            style={textOutline}
          >
            <span>✓</span>
            <span>Equipped</span>
          </button>
        )}
        {/* Gem-cost purchase path isn't live yet — hidden until it is
           (data/aura.js still carries gemCost per tier for when it lands). */}
      </div>
    </div>
  )
}

// Opened by the Shop button. Shares RebirthWindow's chrome via HudModal —
// content is intentionally empty for now.
function ShopWindow({ onClose, isTouch }) {
  return <HudModal title="Shop" onClose={onClose} isTouch={isTouch} />
}

// Popup for the HUD's Aura button — shares RebirthWindow's chrome via
// HudModal. Body is AURA_TIERS' 10 entries in a fixed-height list so it's
// always mouse-wheel scrollable regardless of viewport height, rather than
// growing the whole modal to fit every row.
function AuraWindow({ onClose, isTouch }) {
  return (
    <HudModal title="Aura" onClose={onClose} isTouch={isTouch}>
      <div
        className={`w-full overflow-y-auto ${isTouch ? 'max-h-[38vh] pr-1' : 'max-h-[26rem] pr-2'}`}
      >
        <div className={`flex flex-col ${isTouch ? 'gap-1.5' : 'gap-2.5'}`}>
          {AURA_TIERS.map((tier, index) => (
            <AuraEntry key={tier.name} tier={tier} index={index} isTouch={isTouch} />
          ))}
        </div>
      </div>
    </HudModal>
  )
}

// Left-edge, vertically centred stack: win count above, rebirth action below.
// Both are selector-driven and re-render only when their value changes, never
// per frame (Tech.md §5.4). Wins change at human speed; rebirth eligibility is
// a boolean flip. The rebirth button stays mounted but disabled until eligible.
function LeftCenterControls() {
  const wins = useGameStore((s) => s.wins)
  const level = useGameStore((s) => s.level)
  const rebirth = useGameStore((s) => s.rebirth)
  const canRebirth = useGameStore((s) => canAcceptRebirth(s.level, s.rebirth))
  const acceptRebirth = useGameStore((s) => s.acceptRebirth)
  const [showRebirthWindow, setShowRebirthWindow] = useState(false)
  const [showAuraWindow, setShowAuraWindow] = useState(false)
  const [showShopWindow, setShowShopWindow] = useState(false)
  const isTouch = useTouchMode()

  // systems/merchant.js can't open a React panel itself (framework-free,
  // Tech.md §5.1), so E near the shop just raises an edge flag there; this
  // throttled poll is the one place that consumes it, same 100ms cadence
  // Hud()'s own prompt polls below use for the same singleton's `near`.
  useEffect(() => {
    const id = setInterval(() => {
      if (merchantState.openAuraRequested) {
        merchantState.openAuraRequested = false
        setShowAuraWindow(true)
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  const rebirthWindow =
    showRebirthWindow &&
    createPortal(
      <RebirthWindow
        rebirth={rebirth}
        canRebirth={canRebirth}
        isTouch={isTouch}
        onConfirm={() => {
          acceptRebirth()
          setShowRebirthWindow(false)
        }}
        onClose={() => setShowRebirthWindow(false)}
      />,
      document.body,
    )

  const auraWindow =
    showAuraWindow &&
    createPortal(
      <AuraWindow isTouch={isTouch} onClose={() => setShowAuraWindow(false)} />,
      document.body,
    )

  const shopWindow =
    showShopWindow &&
    createPortal(
      <ShopWindow isTouch={isTouch} onClose={() => setShowShopWindow(false)} />,
      document.body,
    )

  // Touch/mobile only: a compact single row anchored top-left, below
  // IdentityChip (top-4). The desktop layout below (vertically centred at
  // the left edge) sits inside the touch layout's movement-stick capture
  // zone (TouchControls.jsx's MoveStick, the bottom ~58% of the screen) —
  // the game forces landscape on touch (RotatePrompt.jsx), so screen height
  // there is short enough that the two regions collide. This row fits in the
  // strip above that zone on every supported landscape height instead.
  if (isTouch) {
    return (
      <div
        data-hud="left-center"
        className="pointer-events-none absolute left-4 top-24 flex items-center gap-2"
      >
        <div className="flex items-center gap-1 rounded-lg border border-slate-400/30 bg-black/50 px-2 py-1.5 text-slate-100 shadow-lg">
          <img src="/ui/xp_cup.png" alt="" className="h-5 w-5" draggable={false} />
          <span
            className="font-bold tabular-nums"
            style={{
              // Matches GlowFloorPanelLabel's Wins <Text>: #ffd21e fill, bold,
              // letterSpacing -0.02, black outline at ~10% of font size, drawn
              // behind the fill (SDF outlineWidth 0.09 / fontSize 0.9).
              fontSize: '0.85rem',
              lineHeight: 1,
              color: '#ffd21e',
              letterSpacing: '-0.02em',
              WebkitTextStroke: '1.5px #000000',
              paintOrder: 'stroke fill',
            }}
          >
            {formatCompact(wins)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAuraWindow(true)}
          title="Open Aura"
          className="pointer-events-auto flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-lg border border-amber-400/40 bg-amber-600/80 text-slate-100 shadow-lg transition hover:bg-amber-500"
        >
          <img src="/ui/aura.png" alt="" className="h-5 w-5" draggable={false} />
          <span className="text-[7px] font-semibold leading-none tracking-wide">Aura</span>
        </button>
        <button
          type="button"
          onClick={() => setShowShopWindow(true)}
          title="Open Shop"
          className="pointer-events-auto flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-lg border border-amber-400/40 bg-amber-600/80 text-slate-100 shadow-lg transition hover:bg-amber-500"
        >
          <img src="/ui/shop.png" alt="" className="h-5 w-5" draggable={false} />
          <span className="text-[7px] font-semibold leading-none tracking-wide">Shop</span>
        </button>
        <button
          type="button"
          onClick={acceptRebirth}
          disabled
          title="Coming soon"
          className="pointer-events-auto flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-lg border border-amber-400/40 bg-amber-600/80 text-slate-100 shadow-lg transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-600/80"
        >
          <img src="/ui/invite_friends.png" alt="" className="h-5 w-5" draggable={false} />
          <span className="text-center text-[6px] font-semibold leading-[1.1] tracking-wide">
            Invite
            <br />
            Friends
          </span>
        </button>
        <button
          type="button"
          onClick={() => setShowRebirthWindow(true)}
          title="Open Rebirth"
          className="pointer-events-auto flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-lg border border-amber-400/40 bg-amber-600/80 text-slate-100 shadow-lg transition hover:bg-amber-500"
        >
          <img src="/ui/rebirth.png" alt="" className="h-5 w-5" draggable={false} />
          <span className="text-[7px] font-semibold leading-none tracking-wide">Rebirth</span>
        </button>
        {rebirthWindow}
        {auraWindow}
        {shopWindow}
      </div>
    )
  }

  // Desktop: original vertically-centred 2x2 grid at the left edge — no
  // movement stick to collide with here, so it keeps its larger, more
  // readable footprint.
  return (
    <div
      data-hud="left-center"
      className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2"
    >
      <div className="flex items-center gap-2 rounded-lg border border-slate-400/30 bg-black/50 px-3 py-2 text-slate-100 shadow-lg">
        <img src="/ui/xp_cup.png" alt="" className="h-8 w-8" draggable={false} />
        <span
          className="font-bold tabular-nums"
          style={{
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
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAuraWindow(true)}
            title="Open Aura"
            className="pointer-events-auto flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-amber-400/40 bg-amber-600/80 px-3 py-2 text-slate-100 shadow-lg transition hover:bg-amber-500"
          >
            <img src="/ui/aura.png" alt="" className="h-10 w-10" draggable={false} />
            <span className="text-xs font-semibold tracking-wide">Aura</span>
          </button>
          <button
            type="button"
            onClick={() => setShowShopWindow(true)}
            title="Open Shop"
            className="pointer-events-auto flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-amber-400/40 bg-amber-600/80 px-3 py-2 text-slate-100 shadow-lg transition hover:bg-amber-500"
          >
            <img src="/ui/shop.png" alt="" className="h-10 w-10" draggable={false} />
            <span className="text-xs font-semibold tracking-wide">Shop</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={acceptRebirth}
            disabled
            title="Coming soon"
            className="pointer-events-auto flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-amber-400/40 bg-amber-600/80 px-3 py-2 text-slate-100 shadow-lg transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-600/80"
          >
            <img src="/ui/invite_friends.png" alt="" className="h-10 w-10" draggable={false} />
            <span className="text-xs font-semibold leading-tight tracking-wide text-center">
              Invite
              <br />
              Friends
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowRebirthWindow(true)}
            title="Open Rebirth"
            className="pointer-events-auto flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-amber-400/40 bg-amber-600/80 px-3 py-2 text-slate-100 shadow-lg transition hover:bg-amber-500"
          >
            <img src="/ui/rebirth.png" alt="" className="h-10 w-10" draggable={false} />
            <span className="text-xs font-semibold tracking-wide">Rebirth</span>
          </button>
        </div>
      </div>
      {rebirthWindow}
      {auraWindow}
      {shopWindow}
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
  const merchantPromptRef = useRef(null)
  const deathPromptRef = useRef(null)

  // Dead in the PVP zone (systems/playerHealth.js) — a countdown to the
  // respawn that system's own step() runs, same throttled-poll pattern as
  // the prompts below (this value changes at human speed, not per frame).
  useEffect(() => {
    const id = setInterval(() => {
      const el = deathPromptRef.current
      if (!el) return
      if (playerHealth.dead) {
        const secs = Math.max(0, Math.ceil((playerHealth.respawnAt - performance.now()) / 1000))
        el.textContent = `You Died — Respawning in ${secs}s`
        el.style.display = ''
      } else {
        el.style.display = 'none'
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

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

  // Same throttled-poll pattern as the prompts above. Hidden whenever the afk
  // or hex-pad prompt would show — all three render at the same screen
  // position, and while the shop sits in its own zone this keeps that
  // shared-position assumption (see the hex-pad effect above) true for a
  // third system too.
  useEffect(() => {
    const id = setInterval(() => {
      const el = merchantPromptRef.current
      if (!el) return
      if (
        merchantState.near &&
        !afkState.active &&
        !afkState.nearTargetId &&
        hexPowerPadState.nearIndex === null
      ) {
        el.textContent = 'Press E to Aura'
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
      {/* First child: the touch look-zone paints beneath the interactive HUD
         panels (auth, wins/rebirth, retry) so their taps still land, while its
         own Fire/Jump/E buttons sit at z-40 above everything. */}
      <TouchControls />

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
        ref={merchantPromptRef}
        className="pointer-events-none absolute left-1/2 top-[70%] -translate-x-1/2 -translate-y-1/2 rounded bg-black/60 px-3 py-1.5 text-sm text-slate-100"
        style={{ display: 'none' }}
      />

      <div
        ref={deathPromptRef}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/70 px-6 py-3 text-2xl font-bold text-red-500"
        style={{ display: 'none', WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}
      />

      <LeftCenterControls />

      {/* Top-left identity chip: "Guest" + Bloxity default picture until login,
         the real avatar + name after. Always visible, even with the SDK
         blocked. Event-driven, never per frame (Tech.md §5.4). */}
      <IdentityChip panelStyle={panelStyle} />

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

      {/* Full-screen "rotate to landscape" gate for touch sessions. Last child
         + z-100 so it covers the touch controls while it is up. */}
      <RotatePrompt />
    </div>
  )
}
