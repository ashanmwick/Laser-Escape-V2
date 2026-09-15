// Data for the black-hole-style vortex look
// (components/VortexRingEffect.jsx) — the second of the two looks
// VortexEffectCycle.jsx alternates on vortex_target's aim point (the first
// is the swirling disc, data/vortexEffect.js). Shares that same world-space
// anchor. THREE.TorusGeometry's own default orientation already lies flat
// in the local XY plane, i.e. facing the camera once mounted inside a
// <Billboard> — same as the disc's circle layers — so no extra rotation is
// needed to keep the rings facing the player.
//
// What actually reads as "a black hole" rather than "some purple rings":
// an opaque black void at the centre (the event horizon's shadow — nothing
// escapes, so it must block whatever's behind it, unlike every other layer
// here which is additive-transparent), a thin near-white "photon ring"
// blazing right at that void's edge, and an accretion disk whose bands
// fade from hot near-white close in to cooler deep purple further out —
// not one flat, uniform purple tint.
import { TARGET_AIM_POINT } from './targets.js'
import { VORTEX_EFFECT_TARGET_ID } from './vortexEffect.js'

// The event horizon: a solid (non-additive, depthWrite on) black disc.
// Rendered at a small negative local Z (data/vortexEffect.js's Billboard
// convention: local Z always points at the camera), so it never
// z-fights the accretion-disk layers sitting at/near local Z 0 — it's
// simply the backdrop those transparent layers' own donut holes reveal.
export const VORTEX_BLACK_HOLE_RADIUS = 0.4
export const VORTEX_BLACK_HOLE_COLOR = '#000000'
export const VORTEX_BLACK_HOLE_DEPTH_OFFSET = -0.05

// The photon ring: a thin, very bright band sitting right on the shadow's
// edge — the single most recognizable feature of a black hole image (the
// bright ring bent around the event horizon by gravitational lensing).
export const VORTEX_PHOTON_RING_RADIUS = 0.43
export const VORTEX_PHOTON_RING_TUBE = 0.05
export const VORTEX_PHOTON_RING_COLOR = '#fff2ff'
export const VORTEX_PHOTON_RING_OPACITY = 0.95
export const VORTEX_PHOTON_RING_SCROLL_SPEED = 2.2

// One entry per accretion-disk band (torusGeometry args = radius/tube):
// `color` fades hot-near-white close to the hole to cooler deep purple
// further out, like a real disk's own temperature gradient. `rotationOffset`
// staggers each band's starting angle so they don't start perfectly
// aligned; `scrollSpeed` animates that band's own texture along its U axis
// (native map.offset.x, not mesh rotation) for the "streaks spin around the
// ring" motion; `pulseAmp`/`pulseSpeed`/`pulsePhase` drive a slow uniform
// scale pulse, standing in for a per-vertex sine warp without needing a
// custom vertex shader (Tech.md §7 keeps materials Lambert/Basic only).
export const VORTEX_RING_LAYERS = [
  {
    radius: 0.58,
    tube: 0.16,
    color: '#e6b3ff',
    rotationOffset: 0,
    scrollSpeed: 1.4,
    opacity: 0.7,
    pulseAmp: 0.04,
    pulseSpeed: 1.1,
    pulsePhase: 0,
  },
  {
    radius: 0.9,
    tube: 0.18,
    color: '#cc66ff',
    rotationOffset: 0.6,
    scrollSpeed: -1.0,
    opacity: 0.58,
    pulseAmp: 0.05,
    pulseSpeed: 0.9,
    pulsePhase: 1.3,
  },
  {
    radius: 1.22,
    tube: 0.2,
    color: '#a833ff',
    rotationOffset: 1.2,
    scrollSpeed: 0.7,
    opacity: 0.46,
    pulseAmp: 0.05,
    pulseSpeed: 0.75,
    pulsePhase: 2.6,
  },
  {
    radius: 1.54,
    tube: 0.22,
    color: '#7a1fcc',
    rotationOffset: 1.9,
    scrollSpeed: -0.45,
    opacity: 0.35,
    pulseAmp: 0.06,
    pulseSpeed: 0.6,
    pulsePhase: 3.9,
  },
]

export const VORTEX_RING_RADIAL_SEGMENTS = 10 // tube cross-section resolution
export const VORTEX_RING_TUBULAR_SEGMENTS = 64 // main-circumference resolution

export const VORTEX_RING_POSITION = TARGET_AIM_POINT[VORTEX_EFFECT_TARGET_ID] ?? [0, 0, 0]
