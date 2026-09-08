// Laser impact spark tunables (Tech.md §4: src/data/ owns every tunable number).

// Fixed pool size — the InstancedMesh is allocated once at this capacity and
// never resized (Tech.md §7: no per-frame allocation, no growing buffers).
export const SPARK_POOL_SIZE = 64

// New sparks spawned per second while the laser holds steady on one surface.
export const SPARK_SPAWN_RATE = 40

// Extra sparks spawned immediately the instant the laser lands on a new
// object/point, on top of the steady trickle — reads as an impact rather
// than the trickle slowly ramping up.
export const SPARK_BURST_COUNT = 10

// How long a single spark lives after spawning, in seconds.
export const SPARK_LIFETIME_MIN = 0.15
export const SPARK_LIFETIME_MAX = 0.35

// Outward speed along the surface normal (plus a random lateral component),
// in metres/second.
export const SPARK_SPEED_MIN = 1.2
export const SPARK_SPEED_MAX = 3.2
export const SPARK_LATERAL_SPREAD = 1.5

// Simple gravity pulling sparks down as they fly, m/s^2.
export const SPARK_GRAVITY = 4

export const SPARK_SIZE_MIN = 0.04
export const SPARK_SIZE_MAX = 0.2

export const SPARK_COLOR = '#fff2b0'

// Position tolerance (metres) within which a moving hit point still counts
// as "the same spot" on the same object — keeps the effect sustained instead
// of restarting from tiny raycast jitter.
export const IMPACT_POSITION_TOLERANCE = 0.05

// Once the laser leaves a point, the overall emitter fades and any live
// sparks are cut short over this many seconds instead of vanishing abruptly.
export const IMPACT_FADE_DURATION = 0.35
