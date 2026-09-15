// Data for the glowing purple vortex disc mounted on the `vortex_target`
// prop itself (components/VortexEffect.jsx) — two additive circle layers,
// independently spun, so they drift apart into a parallax swirl rather than
// reading as one flat disc. Billboarded (drei's <Billboard>, same trick
// AfkTargetLabel.jsx/HexPowerPadLabel.jsx use) so it always turns to face
// the player instead of lying flat on the ground. Same additive-plane trick
// Laser.jsx's glow cylinder uses (Tech.md §7: no postprocessing bloom).
import { TARGET_AIM_POINT } from './targets.js'

export const VORTEX_EFFECT_TARGET_ID = 'vortex_target'
export const VORTEX_EFFECT_COLOR = '#aa00ff'
export const VORTEX_EFFECT_RADIUS = 1.7 // metres, inner layer — 2x the original 0.85
export const VORTEX_EFFECT_SCALE_OUTER = 1.2 // outer layer, 20% larger

// Small bright flare at the centre — same trick Laser.jsx's sprite core
// uses to read as a "light" without an actual THREE.Light (Tech.md §7 caps
// the scene at one hemisphere + one directional light; a real point light
// per target would blow that budget). Near-white so it pops out over the
// tinted swirl layers instead of just deepening the purple.
export const VORTEX_EFFECT_CORE_RADIUS = VORTEX_EFFECT_RADIUS * 0.32
export const VORTEX_EFFECT_CORE_COLOR = '#f2e0ff'
export const VORTEX_EFFECT_CORE_OPACITY = 1.0

// Local-space nudge along the Billboard's own Z (the axis that always
// points at the player) — just enough that the coplanar layers never
// z-fight each other. Order doesn't matter for the additive result itself
// (additive blending is order-independent), only for avoiding same-depth
// flicker.
export const VORTEX_EFFECT_DEPTH_OFFSET_CORE = 0.02
export const VORTEX_EFFECT_DEPTH_OFFSET_INNER = 0
export const VORTEX_EFFECT_DEPTH_OFFSET_OUTER = 0.01

export const VORTEX_EFFECT_OPACITY_INNER = 0.95
export const VORTEX_EFFECT_OPACITY_OUTER = 0.6

export const VORTEX_EFFECT_SPEED_INNER = 0.6 // rad/s
export const VORTEX_EFFECT_SPEED_OUTER = -0.35 // rad/s — opposite + slower, for parallax

// World-space anchor: vortex_target's own aim point (data/targets.js
// TARGET_AIM_POINT) — the ~85%-of-height point on the object's upper body
// systems/afk.js already fires at, so the effect reads as mounted on the
// target itself rather than floating separately or sitting on its mat.
export const VORTEX_EFFECT_POSITION = TARGET_AIM_POINT[VORTEX_EFFECT_TARGET_ID] ?? [0, 0, 0]
