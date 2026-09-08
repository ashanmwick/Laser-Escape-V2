// Action power-gain popup tunables (Tech.md §4: src/data/ owns every tunable
// number). Every Action that raises Power spawns one of these — the
// public/ui/action_popup.png badge with a "+N" readout — near the player. It
// springs in with an elastic pop, then sweeps down to the very bottom-middle of
// the screen and fades. Simulated by systems/actionPopups.js, drawn by
// components/hud/ActionPopups.jsx as DOM siblings of the canvas (Tech.md §5.4),
// never drei <Html>.

// Fixed pool — the DOM nodes are created once at this capacity and recycled
// round-robin, never grown/shrunk (Tech.md §7: no per-frame allocation).
export const ACTION_POPUP_POOL_SIZE = 14

// Seconds a popup stays on screen, from spawn to fully gone.
export const ACTION_POPUP_LIFETIME = 0.95

// Seconds spent fading in from 0 -> 1 opacity at the very start.
export const ACTION_POPUP_FADE_IN = 0.09

// --- Pop-in flourish ---
// Fraction of the lifetime (0..1) spent on the spawn "pop": the badge springs
// from ACTION_POPUP_POP_SCALE_FROM up to full size with an elastic overshoot
// (ACTION_POPUP_POP_OVERSHOOT — higher = punchier) and hops ACTION_POPUP_HOP
// upward, before it sweeps down.
export const ACTION_POPUP_POP_T = 0.24
export const ACTION_POPUP_POP_SCALE_FROM = 0.25
export const ACTION_POPUP_POP_OVERSHOOT = 2.4
export const ACTION_POPUP_HOP = 0.05

// Normalized lifetime point (0..1) at which the badge starts fading out; opacity
// reaches 0 at the end of the lifetime, as it lands at the bottom.
export const ACTION_POPUP_FADE_OUT_START = 0.55

// World anchor: the player's feet position raised this many metres, so badges
// appear around the avatar's torso, not the floor.
export const ACTION_POPUP_ANCHOR_HEIGHT = 1.3

// Random scatter applied once at spawn, in normalized-viewport units (the whole
// viewport spans 2 wide and 2 tall). Keeps a burst of popups from stacking.
export const ACTION_POPUP_SPREAD_X = 0.16
export const ACTION_POPUP_SPREAD_Y = 0.12

// --- Travel ---
// After the pop-in, the badge sweeps to the bottom-middle of the screen, eased
// in-out. ACTION_POPUP_TARGET_Y is the normalized device Y it lands on (-1 is
// the very bottom edge); ACTION_POPUP_CENTER_PULL is the fraction of its
// horizontal gap to screen centre that it closes.
export const ACTION_POPUP_TARGET_Y = -0.95
export const ACTION_POPUP_CENTER_PULL = 0.7

// Rendered width of the action_popup.png badge, in CSS pixels (height auto).
export const ACTION_POPUP_IMAGE_SIZE = 120

// Font size of the "+N" readout shown beside the badge, in CSS pixels.
export const ACTION_POPUP_FONT_SIZE = 40

// Public-root path to the badge art — same convention as the data/*.js model
// URLs (served straight out of public/).
export const ACTION_POPUP_IMAGE_URL = '/ui/action_popup.png'
