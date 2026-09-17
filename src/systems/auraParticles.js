// Equipped-Aura fire + smoke trail (Tech.md §5.1 style: framework-free,
// mutable singleton pools, stepped once per frame from GameLoop). Unlike
// systems/laserParticles.js's pool, this one does no per-particle physics at
// all — it only ever writes a handful of floats into a typed array when a
// particle (re)spawns. Everything else (rise, sway, the backward "wind" bend
// from player movement) is evaluated per-vertex on the GPU from those floats
// plus one shared uTime uniform — see systems/auraParticleShader.js for why,
// and components/AuraParticles.jsx for the THREE.Points that reads this pool.
import { player } from './playerState.js'
import { useGameStore } from '../store/useGameStore.js'
import {
  FIRE_POOL_SIZE,
  FIRE_SPAWN_RATE,
  FIRE_LIFETIME_MIN,
  FIRE_LIFETIME_MAX,
  FIRE_SPAWN_RADIUS,
  FIRE_SPAWN_HEIGHT_MIN,
  FIRE_SPAWN_HEIGHT_MAX,
  FIRE_SIZE_MIN,
  FIRE_SIZE_MAX,
  FIRE_RISE_MIN,
  FIRE_RISE_MAX,
  FIRE_SWAY_SPEED_MIN,
  FIRE_SWAY_SPEED_MAX,
  FIRE_WIND_DRAG,
  SMOKE_POOL_SIZE,
  SMOKE_SPAWN_RATE,
  SMOKE_LIFETIME_MIN,
  SMOKE_LIFETIME_MAX,
  SMOKE_SPAWN_RADIUS,
  SMOKE_SPAWN_HEIGHT_MIN,
  SMOKE_SPAWN_HEIGHT_MAX,
  SMOKE_SIZE_MIN,
  SMOKE_SIZE_MAX,
  SMOKE_RISE_MIN,
  SMOKE_RISE_MAX,
  SMOKE_SWAY_SPEED_MIN,
  SMOKE_SWAY_SPEED_MAX,
  SMOKE_WIND_DRAG,
} from '../data/auraParticles.js'

// Elapsed seconds since this module first ticked — the clock the shader's
// uTime uniform tracks (components/AuraParticles.jsx reads auraClock.elapsed
// each frame). A mutable-field object, not an exported `let`, matching
// systems/playerState.js's `player` and systems/laser.js's `laser` (Tech.md
// §5.1: a singleton mutated in place is a plain, unambiguous live binding
// across bundlers; a re-exported primitive isn't guaranteed to be). Never
// wraps: float32 rounding on a multi-hour session still leaves sub-
// millisecond error on the (age = uTime - aBirth) subtraction, far below
// anything visible on a particle that lives under two seconds.
export const auraClock = { elapsed: 0 }

// One pool's typed-array attributes, laid out to match the shader's
// attributes 1:1 (systems/auraParticleShader.js) — components/
// AuraParticles.jsx wraps each array in a THREE.BufferAttribute directly
// over this same memory, so a spawn write here needs no copying to reach
// the GPU, just an `attribute.needsUpdate = true` next frame.
function makePool(size) {
  return {
    size,
    nextSlot: 0,
    spawnAccumulator: 0,
    offset: new Float32Array(size * 3),
    // Birth defaults far in the past so every slot starts already "dead"
    // (age >> lifetime) instead of visible at the world origin on frame one.
    birth: new Float32Array(size).fill(-1e6),
    lifetime: new Float32Array(size).fill(1),
    rise: new Float32Array(size),
    sway: new Float32Array(size * 2),
    wind: new Float32Array(size * 2),
    particleSize: new Float32Array(size),
  }
}

export const firePool = makePool(FIRE_POOL_SIZE)
export const smokePool = makePool(SMOKE_POOL_SIZE)

function spawnInto(pool, tunables, windX, windZ) {
  const i = pool.nextSlot
  pool.nextSlot = (pool.nextSlot + 1) % pool.size

  const angle = Math.random() * Math.PI * 2
  const r = Math.random() * tunables.spawnRadius
  const height = tunables.spawnHeightMin + Math.random() * (tunables.spawnHeightMax - tunables.spawnHeightMin)

  pool.offset[i * 3 + 0] = player.position.x + Math.cos(angle) * r
  pool.offset[i * 3 + 1] = player.position.y + height
  pool.offset[i * 3 + 2] = player.position.z + Math.sin(angle) * r

  pool.birth[i] = auraClock.elapsed
  pool.lifetime[i] = tunables.lifetimeMin + Math.random() * (tunables.lifetimeMax - tunables.lifetimeMin)
  pool.rise[i] = tunables.riseMin + Math.random() * (tunables.riseMax - tunables.riseMin)
  pool.sway[i * 2 + 0] = tunables.swaySpeedMin + Math.random() * (tunables.swaySpeedMax - tunables.swaySpeedMin)
  pool.sway[i * 2 + 1] = Math.random() * Math.PI * 2
  // Captured once at spawn, not integrated every frame — the shader's own
  // smoothstep ramps this in over the particle's life (auraParticleShader.js).
  pool.wind[i * 2 + 0] = windX * tunables.windDrag
  pool.wind[i * 2 + 1] = windZ * tunables.windDrag
  pool.particleSize[i] = tunables.sizeMin + Math.random() * (tunables.sizeMax - tunables.sizeMin)
}

const fireTunables = {
  spawnRate: FIRE_SPAWN_RATE,
  lifetimeMin: FIRE_LIFETIME_MIN,
  lifetimeMax: FIRE_LIFETIME_MAX,
  spawnRadius: FIRE_SPAWN_RADIUS,
  spawnHeightMin: FIRE_SPAWN_HEIGHT_MIN,
  spawnHeightMax: FIRE_SPAWN_HEIGHT_MAX,
  sizeMin: FIRE_SIZE_MIN,
  sizeMax: FIRE_SIZE_MAX,
  riseMin: FIRE_RISE_MIN,
  riseMax: FIRE_RISE_MAX,
  swaySpeedMin: FIRE_SWAY_SPEED_MIN,
  swaySpeedMax: FIRE_SWAY_SPEED_MAX,
  windDrag: FIRE_WIND_DRAG,
}

const smokeTunables = {
  spawnRate: SMOKE_SPAWN_RATE,
  lifetimeMin: SMOKE_LIFETIME_MIN,
  lifetimeMax: SMOKE_LIFETIME_MAX,
  spawnRadius: SMOKE_SPAWN_RADIUS,
  spawnHeightMin: SMOKE_SPAWN_HEIGHT_MIN,
  spawnHeightMax: SMOKE_SPAWN_HEIGHT_MAX,
  sizeMin: SMOKE_SIZE_MIN,
  sizeMax: SMOKE_SIZE_MAX,
  riseMin: SMOKE_RISE_MIN,
  riseMax: SMOKE_RISE_MAX,
  swaySpeedMin: SMOKE_SWAY_SPEED_MIN,
  swaySpeedMax: SMOKE_SWAY_SPEED_MAX,
  windDrag: SMOKE_WIND_DRAG,
}

function stepPool(pool, tunables, dt, spawning, windX, windZ) {
  if (!spawning) {
    pool.spawnAccumulator = 0
    return
  }
  pool.spawnAccumulator += tunables.spawnRate * dt
  if (pool.spawnAccumulator > pool.size) pool.spawnAccumulator = pool.size
  while (pool.spawnAccumulator >= 1) {
    spawnInto(pool, tunables, windX, windZ)
    pool.spawnAccumulator -= 1
  }
}

export function step(dt) {
  auraClock.elapsed += dt
  const equipped = useGameStore.getState().equippedAura != null
  // Captured once per frame, not per particle — every particle spawned this
  // frame shares the same instantaneous read of the player's velocity.
  const windX = -player.velocity.x
  const windZ = -player.velocity.z

  stepPool(firePool, fireTunables, dt, equipped, windX, windZ)
  stepPool(smokePool, smokeTunables, dt, equipped, windX, windZ)
}
