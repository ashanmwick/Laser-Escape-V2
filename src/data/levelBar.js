// HUD level-bar tunables (Tech.md §4: src/data/ owns every tunable number).
// The bar sits bottom-centre of the screen: a "<Power> Power" caption, a rounded
// track that fills yellow -> orange -> red as Power climbs toward the next
// level, "Level N" and "<into> / <span>" overlaid on it, and the
// public/ui/action_popup.png starburst pinned to its left edge. Drawn by
// components/hud/LevelBar.jsx as a DOM sibling of the canvas (Tech.md §5.4),
// never drei <Html>; it must not re-render per frame, so its readouts are
// written to the DOM from a throttled store subscription.

// Milliseconds between textContent / fill-width writes — the ~10Hz throttle
// Tech.md §5.4 mandates for numeric HUD readouts.
export const LEVEL_BAR_POLL_MS = 100

// Track size in CSS pixels. Width is capped to the viewport by LEVEL_BAR_MAX_VW.
// Doubled from the original 440x40 — the bar and every glyph on it read at 2x.
export const LEVEL_BAR_WIDTH = 880
export const LEVEL_BAR_HEIGHT = 80
export const LEVEL_BAR_MAX_VW = 88

// Track border and the black text outlines, thickened to match the 2x scale.
// The caption stroke is kept a touch thinner than the on-bar labels so the
// gradient fill still reads as white rather than being swallowed by the edge.
export const LEVEL_BAR_BORDER = 6
export const LEVEL_BAR_TEXT_STROKE = 4
export const LEVEL_BAR_CAPTION_STROKE = 5

// Caption ("<Power> Power") and the on-bar labels ("Level N", "<into> / <span>"),
// in CSS pixels — ~2x the originals (15 / 17).
export const LEVEL_BAR_CAPTION_FONT_PX = 34
export const LEVEL_BAR_LABEL_FONT_PX = 34

// Starburst badge at the left edge: rendered size, and how far its centre is
// pulled left of the track's left edge (fraction of its own size).
export const LEVEL_BAR_ICON_SIZE = 136
export const LEVEL_BAR_ICON_OVERHANG = 0.44

// Gap from the bottom edge of the screen, in CSS pixels.
export const LEVEL_BAR_BOTTOM = 28

// Fill transition when the value jumps (ms). Keeps a "+N" gain reading as a
// slide, not a snap.
export const LEVEL_BAR_TRANSITION_MS = 200

// Left -> right fill: bright at the top, hot at the bottom edge.
export const LEVEL_BAR_FILL_GRADIENT =
  'linear-gradient(180deg, #ffe24d 0%, #ff9d00 52%, #ff2d00 100%)'

// Vertical gradient painted into the "<Power> Power" caption glyphs (clipped to
// text): solid white down to ~45%, then fading toward a translucent lavender so
// the caption dissolves at its lower edge. The black outline is a real
// -webkit-text-stroke painted *under* the fill (paint-order: stroke), so it
// stays a crisp edge instead of bleeding through the transparent lower half.
export const LEVEL_BAR_CAPTION_TEXT_GRADIENT =
  'linear-gradient(180deg, #ffffff 0%, #ffffff 58%, rgba(255,255,255,0.62) 100%)'

// Public-root path to the badge art — same convention as data/actionPopups.js.
export const LEVEL_BAR_ICON_URL = '/ui/action_popup.png'
