// "LEVEL UP!" banner tunables (Tech.md §4: src/data/ owns every tunable
// number). Whenever the store's `level` rises, a big cartoon banner pops in at
// the top-centre of the screen, holds, then floats up and fades. Drawn by
// components/hud/LevelUpPopup.jsx as a DOM sibling of the canvas (Tech.md §5.4),
// never drei <Html>; it never re-renders per frame — a transient store
// subscription drives a single Web-Animations run on the node.

// Headline text and the "Level N" subline template.
export const LEVEL_UP_POPUP_TITLE = 'LEVEL UP!'
export const LEVEL_UP_POPUP_SUBLABEL = (level) => `Level ${level}`

// Gap from the top edge of the screen, in CSS pixels.
export const LEVEL_UP_POPUP_TOP = 116

// Animation phase lengths, in milliseconds: elastic pop-in, full-opacity hold,
// then float-up fade-out. Total run = the three summed.
export const LEVEL_UP_POPUP_IN_MS = 420
export const LEVEL_UP_POPUP_HOLD_MS = 900
export const LEVEL_UP_POPUP_OUT_MS = 560

// Scale the banner springs up from during the pop-in, and the overshoot scale it
// briefly passes through before settling at 1.
export const LEVEL_UP_POPUP_POP_SCALE_FROM = 0.4
export const LEVEL_UP_POPUP_POP_OVERSHOOT = 1.14

// Pixels the banner drifts upward while it fades out.
export const LEVEL_UP_POPUP_RISE = 46

// Glyph sizes in CSS pixels — matched to the chunky 2x HUD art (see
// data/levelBar.js).
export const LEVEL_UP_POPUP_TITLE_FONT_PX = 68
export const LEVEL_UP_POPUP_SUB_FONT_PX = 32

// Black cartoon outline width behind the text fill, in CSS pixels.
export const LEVEL_UP_POPUP_TEXT_STROKE = 5

// Solid yellow headline fill, with the black cartoon outline drawn behind it —
// the same #ffd21e the HUD's Wins readout uses.
export const LEVEL_UP_POPUP_TITLE_COLOR = '#ffd21e'
