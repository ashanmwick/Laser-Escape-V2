import { useGameStore } from '../../store/useGameStore.js'
import { rebirthRequirement, clamp } from '../../data/progression.js'
import {
  LEVEL_BAR_WIDTH,
  LEVEL_BAR_HEIGHT,
  LEVEL_BAR_MAX_VW,
  LEVEL_BAR_BORDER,
  LEVEL_BAR_TEXT_STROKE,
  LEVEL_BAR_CAPTION_FONT_PX,
  LEVEL_BAR_LABEL_FONT_PX,
  LEVEL_BAR_ICON_SIZE,
  LEVEL_BAR_ICON_OVERHANG,
  LEVEL_BAR_FILL_GRADIENT,
  LEVEL_BAR_CAPTION_BAND,
  LEVEL_BAR_CAPTION_BAND_PAD_X,
  LEVEL_BAR_CAPTION_BAND_PAD_Y,
  LEVEL_BAR_ICON_URL,
} from '../../data/levelBar.js'

const S = LEVEL_BAR_TEXT_STROKE
const TEXT_OUTLINE =
  `-${S}px -${S}px 0 #000, ${S}px -${S}px 0 #000, -${S}px ${S}px 0 #000, ${S}px ${S}px 0 #000,` +
  `0 -${S}px 0 #000, 0 ${S}px 0 #000, -${S}px 0 0 #000, ${S}px 0 0 #000,` +
  `0 4px 8px rgba(0,0,0,0.45)`

const LABEL_FONT = `800 ${LEVEL_BAR_LABEL_FONT_PX}px/1 ui-rounded, 'Nunito', system-ui, -apple-system, sans-serif`

// Visual twin of components/hud/LevelBar.jsx's track (same data/levelBar.js
// constants), but plots progress toward the *next rebirth* — level against
// rebirthRequirement(rebirth) — instead of Power toward the next character
// level. Used only inside the Rebirth modal (Hud.jsx), so it renders straight
// off a selector rather than LevelBar's per-frame ref-write pattern; that bar
// stays untouched since it's still the bottom-of-screen singleton shared by
// every other screen.
export default function RebirthLevelBar() {
  const level = useGameStore((s) => s.level)
  const rebirth = useGameStore((s) => s.rebirth)
  const requirement = rebirthRequirement(rebirth)
  const frac = clamp(level / requirement, 0, 1)

  return (
    <div
      className="pointer-events-none"
      style={{
        width: LEVEL_BAR_WIDTH * 0.5,
        maxWidth: `${LEVEL_BAR_MAX_VW * 0.5}vw`,
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <span
          style={{
            display: 'inline-block',
            padding: `${LEVEL_BAR_CAPTION_BAND_PAD_Y}px ${LEVEL_BAR_CAPTION_BAND_PAD_X}px`,
            font: `800 ${LEVEL_BAR_CAPTION_FONT_PX}px/1 ui-rounded, 'Nunito', system-ui, sans-serif`,
            letterSpacing: 0.5,
            color: '#fff',
            textShadow: TEXT_OUTLINE,
            background: LEVEL_BAR_CAPTION_BAND,
          }}
        >
          Rebirth Progress
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
            boxShadow: '0 5px 0 rgba(0,0,0,0.28), inset 0 3px 5px rgba(0,0,0,0.12)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${(frac * 100).toFixed(2)}%`,
              background: LEVEL_BAR_FILL_GRADIENT,
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
            <span style={{ font: LABEL_FONT, color: '#fff', textShadow: TEXT_OUTLINE }}>
              Level {level}
            </span>
            <span style={{ font: LABEL_FONT, color: '#fff', textShadow: TEXT_OUTLINE }}>
              {level} / {requirement}
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
