// Timing for VortexEffectCycle.jsx, which alternates vortex_target's two
// looks — the swirling disc (data/vortexEffect.js) and the accretion-disk
// rings (data/vortexRingEffect.js) — forever.
export const VORTEX_CYCLE_HOLD_SECONDS = 4 // each look's own fully-visible hold
export const VORTEX_CYCLE_TRANSITION_SECONDS = 1.2 // crossfade duration between them
export const VORTEX_CYCLE_LENGTH_SECONDS =
  2 * (VORTEX_CYCLE_HOLD_SECONDS + VORTEX_CYCLE_TRANSITION_SECONDS)
