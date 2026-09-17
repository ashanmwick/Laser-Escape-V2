// Equipped-Aura fire + smoke trail tunables (Tech.md §4: src/data/ owns every
// tunable number). Rendered as two GPU-animated THREE.Points clouds (see
// systems/auraParticleShader.js) rather than CPU-simulated instances — the
// vertex shader evaluates each particle's whole trajectory as a function of
// its age, so the only per-frame CPU work is writing a handful of floats
// into a typed array when a new particle spawns (systems/auraParticles.js)
// and nudging two uniforms (systems/auraParticles.js + components/
// AuraParticles.jsx). That's what makes it cheap even on a phone GPU: no
// per-particle JS math, no per-particle matrix composition, one draw call
// per pool.

// --- Fire ---------------------------------------------------------------

// Fixed pool size — the GPU buffer is allocated once at this capacity and
// never resized (Tech.md §7: no per-frame allocation, no growing buffers).
// Sized well above spawn-rate * lifetime so a full trail never runs out of
// slots mid-burst.
export const FIRE_POOL_SIZE = 160

// New flame particles spawned per second while an aura is equipped.
export const FIRE_SPAWN_RATE = 130

export const FIRE_LIFETIME_MIN = 0.35
export const FIRE_LIFETIME_MAX = 0.65

// Spawn ring around the player's feet, and how high above them flames start.
export const FIRE_SPAWN_RADIUS = 0.22
export const FIRE_SPAWN_HEIGHT_MIN = 0.02
export const FIRE_SPAWN_HEIGHT_MAX = 0.3

// Deliberately tiny and numerous — "lots of small particles" reads as a
// denser flame than fewer big ones spawned at the same fill rate.
export const FIRE_SIZE_MIN = 0.05
export const FIRE_SIZE_MAX = 0.12

// Upward drift speed, m/s (sampled per particle at spawn — no per-frame
// integration, the shader just multiplies this by the particle's own age).
export const FIRE_RISE_MIN = 1.1
export const FIRE_RISE_MAX = 1.9

// Per-particle lateral sway (licking-flame look), sampled at spawn.
export const FIRE_SWAY_SPEED_MIN = 5
export const FIRE_SWAY_SPEED_MAX = 10
export const FIRE_SWAY_AMOUNT = 0.22

// How far a particle ultimately drifts opposite the player's spawn-time
// velocity by the end of its life — this is what makes the trail bend and
// stream out behind the player while moving. Tuned as a fraction of player
// speed (playerMovement.js SPEED=6) rather than real drag physics, since a
// short-lived particle only needs to look right, not solve an ODE.
export const FIRE_WIND_DRAG = 0.12

// Alpha fades in over the first fraction of life and out over the last
// fraction; size shrinks to this fraction of its start size by end of life
// (a shrinking flame tip, unlike smoke below which grows).
export const FIRE_FADE_IN = 0.08
export const FIRE_FADE_OUT_START = 0.55
export const FIRE_SIZE_GROWTH = 0.5

// --- Smoke ----------------------------------------------------------------

export const SMOKE_POOL_SIZE = 48
export const SMOKE_SPAWN_RATE = 9

export const SMOKE_LIFETIME_MIN = 1.1
export const SMOKE_LIFETIME_MAX = 1.9

// Spawns a little above the fire's own spawn band, as if rising off the tips
// of the flame rather than out of the feet directly.
export const SMOKE_SPAWN_RADIUS = 0.3
export const SMOKE_SPAWN_HEIGHT_MIN = 0.3
export const SMOKE_SPAWN_HEIGHT_MAX = 0.7

export const SMOKE_SIZE_MIN = 0.16
export const SMOKE_SIZE_MAX = 0.3

export const SMOKE_RISE_MIN = 0.4
export const SMOKE_RISE_MAX = 0.9

export const SMOKE_SWAY_SPEED_MIN = 1.2
export const SMOKE_SWAY_SPEED_MAX = 2.4
export const SMOKE_SWAY_AMOUNT = 0.4

// Bigger fraction of player speed than fire: smoke is lighter and billows
// further behind movement over its longer life.
export const SMOKE_WIND_DRAG = 0.35

export const SMOKE_FADE_IN = 0.15
export const SMOKE_FADE_OUT_START = 0.6
// Grows instead of shrinking — a puff blooms outward as it dissipates.
export const SMOKE_SIZE_GROWTH = 2.4

// How much of the equipped tier's edge color (data/aura.js) bleeds into the
// otherwise-neutral grey smoke, so it still reads as belonging to that aura.
export const SMOKE_TINT_WEIGHT = 0.3
