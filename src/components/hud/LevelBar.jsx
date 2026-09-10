import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/useGameStore.js'
import { levelProgress, canAcceptRebirth } from '../../data/progression.js'
import { formatShort } from '../../data/format.js'
import {
  LEVEL_BAR_POLL_MS,
  LEVEL_BAR_WIDTH,
  LEVEL_BAR_HEIGHT,
  LEVEL_BAR_MAX_VW,
  LEVEL_BAR_BORDER,
  LEVEL_BAR_TEXT_STROKE,
  LEVEL_BAR_CAPTION_FONT_PX,
  LEVEL_BAR_LABEL_FONT_PX,
  LEVEL_BAR_ICON_SIZE,
  LEVEL_BAR_ICON_OVERHANG,
  LEVEL_BAR_BOTTOM,
  LEVEL_BAR_TRANSITION_MS,
  LEVEL_BAR_FILL_GRADIENT,
  LEVEL_BAR_CAPTION_BAND,
  LEVEL_BAR_CAPTION_BAND_PAD_X,
  LEVEL_BAR_CAPTION_BAND_PAD_Y,
  LEVEL_BAR_ICON_URL,
} from '../../data/levelBar.js'

// Solid cartoon outline for the overlaid text — an 8-direction black shadow at
// LEVEL_BAR_TEXT_STROKE plus a soft drop, matching the chunky HUD art. Scales
// with the stroke constant so it stays proportional at the 2x bar size.
const S = LEVEL_BAR_TEXT_STROKE
const TEXT_OUTLINE =
  `-${S}px -${S}px 0 #000, ${S}px -${S}px 0 #000, -${S}px ${S}px 0 #000, ${S}px ${S}px 0 #000,` +
  `0 -${S}px 0 #000, 0 ${S}px 0 #000, -${S}px 0 0 #000, ${S}px 0 0 #000,` +
  `0 4px 8px rgba(0,0,0,0.45)`

const LABEL_FONT = `800 ${LEVEL_BAR_LABEL_FONT_PX}px/1 ui-rounded, 'Nunito', system-ui, -apple-system, sans-serif`

// Bottom-centre level bar. A DOM sibling of the canvas (Tech.md §5.4), never
// drei <Html>. It must not re-render per frame: the structure below is built
// once, and every readout — caption, level, count, fill width — is written to
// the DOM from a throttled useGameStore.subscribe outside React. Power can
// change several times a second while the player holds to fire; a selector hook
// would re-render this node on each one.
export default function LevelBar() {
  const rebirthRef = useRef(null)
  const captionRef = useRef(null)
  const levelRef = useRef(null)
  const countRef = useRef(null)
  const fillRef = useRef(null)

  useEffect(() => {
    let last = 0
    let trailing = 0

    const paint = () => {
      last = performance.now()
      const { power, rebirth } = useGameStore.getState()
      const { level, frac, total, needed } = levelProgress(power)
      if (rebirthRef.current)
        rebirthRef.current.style.display = canAcceptRebirth(level, rebirth)
          ? 'inline-block'
          : 'none'
      if (captionRef.current)
        captionRef.current.textContent = `${formatShort(power)} Power`
      if (levelRef.current) levelRef.current.textContent = `Level ${level}`
      if (countRef.current)
        countRef.current.textContent = `${formatShort(total)} / ${formatShort(needed)}`
      if (fillRef.current)
        fillRef.current.style.width = `${(frac * 100).toFixed(2)}%`
    }

    // Leading + trailing throttle at ~10Hz: the first change paints at once, a
    // burst coalesces, and the final value always lands (a plain leading-only
    // throttle would leave the bar one step stale until the next store change).
    const schedule = () => {
      const wait = LEVEL_BAR_POLL_MS - (performance.now() - last)
      if (wait <= 0) {
        if (trailing) {
          clearTimeout(trailing)
          trailing = 0
        }
        paint()
      } else if (!trailing) {
        trailing = setTimeout(() => {
          trailing = 0
          paint()
        }, wait)
      }
    }

    paint()
    const unsub = useGameStore.subscribe(schedule)
    return () => {
      if (trailing) clearTimeout(trailing)
      unsub()
    }
  }, [])

  return (
    <div
      data-hud="level-bar"
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{
        bottom: LEVEL_BAR_BOTTOM,
        width: LEVEL_BAR_WIDTH,
        maxWidth: `${LEVEL_BAR_MAX_VW}vw`,
      }}
    >
      {/* Sits just above the "N Power" caption. Shown only while a rebirth can
         be accepted — same canAcceptRebirth gate as the HUD rebirth button —
         and toggled from the throttled paint() below, never a React render. */}
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <span
          ref={rebirthRef}
          style={{
            display: 'none',
            padding: `${LEVEL_BAR_CAPTION_BAND_PAD_Y}px ${LEVEL_BAR_CAPTION_BAND_PAD_X}px`,
            font: `800 ${LEVEL_BAR_CAPTION_FONT_PX}px/1 ui-rounded, 'Nunito', system-ui, sans-serif`,
            letterSpacing: 0.5,
            color: '#ffd21e',
            textShadow: TEXT_OUTLINE,
            background: LEVEL_BAR_CAPTION_BAND,
          }}
        >
          Rebirth Available
        </span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <span
          ref={captionRef}
          style={{
            display: 'inline-block',
            padding: `${LEVEL_BAR_CAPTION_BAND_PAD_Y}px ${LEVEL_BAR_CAPTION_BAND_PAD_X}px`,
            font: `800 ${LEVEL_BAR_CAPTION_FONT_PX}px/1 ui-rounded, 'Nunito', system-ui, sans-serif`,
            letterSpacing: 0.5,
            color: '#fff',
            textShadow: TEXT_OUTLINE,
            // Semi-transparent black band that fades to nothing on both sides.
            background: LEVEL_BAR_CAPTION_BAND,
          }}
        >
          1 Power
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'relative',
            height: LEVEL_BAR_HEIGHT,
            background: '#f4f4f4',
            border: `${LEVEL_BAR_BORDER}px solid #000`,
            borderRadius: 9999,
            overflow: 'hidden',
            boxShadow:
              '0 5px 0 rgba(0,0,0,0.28), inset 0 3px 5px rgba(0,0,0,0.12)',
          }}
        >
          <div
            ref={fillRef}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '0%',
              background: LEVEL_BAR_FILL_GRADIENT,
              transition: `width ${LEVEL_BAR_TRANSITION_MS}ms ease-out`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `0 28px 0 ${Math.round(LEVEL_BAR_ICON_SIZE * 0.5)}px`,
            }}
          >
            <span
              ref={levelRef}
              style={{ font: LABEL_FONT, color: '#fff', textShadow: TEXT_OUTLINE }}
            >
              Level 1
            </span>
            <span
              ref={countRef}
              style={{
                font: LABEL_FONT,
                color: '#fff',
                textShadow: TEXT_OUTLINE,
              }}
            >
              1 / 50
            </span>
          </div>
        </div>

        <img
          src={LEVEL_BAR_ICON_URL}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: -LEVEL_BAR_ICON_SIZE * LEVEL_BAR_ICON_OVERHANG,
            top: '50%',
            width: LEVEL_BAR_ICON_SIZE,
            height: LEVEL_BAR_ICON_SIZE,
            transform: 'translateY(-50%)',
            filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.4))',
          }}
        />
      </div>
    </div>
  )
}
