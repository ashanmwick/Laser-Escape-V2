// PVP death-ragdoll tunables (Tech.md §4: src/data/ owns every tunable
// number). Purely cosmetic: when a player's hp hits 0 (schema `dead` flips
// true — server-authoritative, same field every client already reads),
// systems/ragdoll.js bursts 6 boxes outward from their death position and
// tumbles them to the ground under gravity, exactly like a wall's rubble
// (data/wallDebris.js) but per player instead of per wall. Same "system owns
// the sim, one InstancedMesh draws it" split.

// One box per body region, offset from the player's feet-origin death
// position (x,y,z) — mirrors PLAYER_HEIGHT/PLAYER_RADIUS (systems/
// playerState.js, 1.8m / 0.4m) so the burst roughly matches the standing
// silhouette it replaces. `color` picks the box's tint (see RAGDOLL_COLORS).
export const RAGDOLL_PARTS = [
  { key: 'head', offset: [0, 1.55, 0], size: [0.32, 0.32, 0.32], color: 'head' },
  { key: 'torso', offset: [0, 1.0, 0], size: [0.42, 0.5, 0.26], color: 'body' },
  { key: 'armL', offset: [0.3, 1.05, 0], size: [0.15, 0.5, 0.15], color: 'body' },
  { key: 'armR', offset: [-0.3, 1.05, 0], size: [0.15, 0.5, 0.15], color: 'body' },
  { key: 'legL', offset: [0.13, 0.4, 0], size: [0.17, 0.55, 0.17], color: 'body' },
  { key: 'legR', offset: [-0.13, 0.4, 0], size: [0.17, 0.55, 0.17], color: 'body' },
]

export const RAGDOLL_COLORS = {
  head: '#e0b088',
  body: '#3a3f4a',
}

// Fixed pool size — the InstancedMesh is allocated once at this capacity and
// never resized (Tech.md §7). RAGDOLL_MAX_ACTIVE concurrent bursts (matches
// data/net.js MAX_REMOTE_BODIES headroom) x 6 parts each; back-to-back deaths
// recycle the oldest burst's parts first, same as wallDebris's pool.
export const RAGDOLL_MAX_ACTIVE = 8
export const RAGDOLL_POOL_SIZE = RAGDOLL_MAX_ACTIVE * RAGDOLL_PARTS.length

// How long a single part lives after spawning, in seconds (the last
// RAGDOLL_FADE_PORTION of that is spent shrinking to nothing rather than a
// pop). Long enough to clearly outlast the respawn delay (data/
// playerHealth.js PVP_RESPAWN_DELAY_MS = 3s) so the corpse keeps lying there
// after the player has already respawned elsewhere.
export const RAGDOLL_LIFETIME = 9
export const RAGDOLL_FADE_PORTION = 0.25

// Initial speed, metres/second: parts fly outward from the body's center in a
// random direction, then get RAGDOLL_UP_BIAS added straight up so the burst
// lofts before gravity brings it down. Gentler than wall rubble (data/
// wallDebris.js) — a body falling apart, not an explosion.
export const RAGDOLL_SPEED_MIN = 1.2
export const RAGDOLL_SPEED_MAX = 3.2
export const RAGDOLL_UP_BIAS = 2.6
export const RAGDOLL_GRAVITY = 14

// Tumble: each part spins about a fixed random axis at this rate, rad/s.
export const RAGDOLL_SPIN_MIN = 1.5
export const RAGDOLL_SPIN_MAX = 6

// When a part drops back to ground level (y=0 — data/hub.js SPAWN is flat)
// it stops there and loses most of its momentum instead of sinking through
// the floor — these are the restitution / horizontal-drag / spin-drag
// factors applied on that contact, same shape as DEBRIS_FLOOR_* above.
export const RAGDOLL_FLOOR_BOUNCE = 0.28
export const RAGDOLL_FLOOR_DRAG = 0.5
export const RAGDOLL_FLOOR_SPIN_DRAG = 0.35
