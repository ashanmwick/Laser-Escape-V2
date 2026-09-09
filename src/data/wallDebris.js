// Wall-break debris tunables (Tech.md §4: src/data/ owns every tunable number).
// Purely cosmetic rubble chunks flung from a wall the frame its health first
// reaches 0 (systems/wallHealth.js strikeWall() -> systems/wallDebris.js
// spawnBurst()). No collider, no gameplay effect — every chunk has shrunk away
// within DEBRIS_LIFETIME_MAX seconds. Same "system owns the sim, one
// InstancedMesh draws it" split as the laser sparks (data/laserParticles.js).

// Fixed pool size — the InstancedMesh is allocated once at this capacity and
// never resized (Tech.md §7: no per-frame allocation, no growing buffers). One
// break flings DEBRIS_BURST_COUNT chunks; the pool holds a few bursts so
// back-to-back wall breaks still overlap cleanly by recycling oldest-first.
export const DEBRIS_POOL_SIZE = 96
export const DEBRIS_BURST_COUNT = 26

// How long a single chunk lives after spawning, in seconds (the last
// DEBRIS_FADE_PORTION of that is spent shrinking to nothing rather than a pop).
export const DEBRIS_LIFETIME_MIN = 0.7
export const DEBRIS_LIFETIME_MAX = 1.35
export const DEBRIS_FADE_PORTION = 0.4

// Initial speed, metres/second: chunks spray outward with a random direction
// biased back toward the approach (-X) face, then get DEBRIS_UP_BIAS added
// straight up so the burst lofts before gravity brings it down.
export const DEBRIS_SPEED_MIN = 4
export const DEBRIS_SPEED_MAX = 12
export const DEBRIS_UP_BIAS = 5.5
export const DEBRIS_GRAVITY = 24

// Tumble: each chunk spins about a fixed random axis at this rate, rad/s.
export const DEBRIS_SPIN_MIN = 3
export const DEBRIS_SPIN_MAX = 15

// Cube edge length, metres — a wide spread so the burst reads as a mix of
// dust-sized bits and fist-sized blocks.
export const DEBRIS_SIZE_MIN = 0.3
export const DEBRIS_SIZE_MAX = 1.15

// Neutral rubble colour. Kept flat/shared across all 25 walls (the sparks do
// the same) — a per-wall tint would need the loaded prop material, which lives
// inside WallProp.jsx and is gone by the time the wall unmounts.
export const DEBRIS_COLOR = '#b3a99b'

// When a chunk drops back to its wall's base height it stops there and loses
// most of its momentum instead of sinking through the ground — these are the
// restitution / horizontal-drag / spin-drag factors applied on that contact.
export const DEBRIS_FLOOR_BOUNCE = 0.32
export const DEBRIS_FLOOR_DRAG = 0.55
export const DEBRIS_FLOOR_SPIN_DRAG = 0.4
