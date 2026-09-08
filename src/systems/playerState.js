// The player singleton (Tech.md §5.1). Mutated in place, never reallocated, so a
// frame loop can read it without a React subscription.
export const player = {
  // Capsule base (feet) in world space, +Y up.
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  grounded: true,
  facing: Math.PI, // yaw the character model faces, radians
  zone: 'hub',
  // Live collider dimensions. Seeded from the defaults below, but the avatar's
  // height/shoulderWidth proportions rescale them — so this is a mutable field
  // on the singleton rather than an imported const binding, which callers could
  // not have reassigned.
  dims: { radius: 0.4, height: 1.8 },
}

export const PLAYER_RADIUS = 0.4
export const PLAYER_HEIGHT = 1.8 // total capsule height, metres (1u = 1m)

// Rescale the collider to match the drawn avatar. Called from the avatar's
// proportion handler; the movement and camera systems read player.dims every
// frame, so there is nothing to invalidate.
export function setDims(radius, height) {
  player.dims.radius = radius
  player.dims.height = height
}

export function resetDims() {
  setDims(PLAYER_RADIUS, PLAYER_HEIGHT)
}

export function resetPlayer(spawn = { x: 0, y: 0, z: 0 }) {
  player.position.x = spawn.x
  player.position.y = spawn.y
  player.position.z = spawn.z
  player.velocity.x = 0
  player.velocity.y = 0
  player.velocity.z = 0
  player.grounded = true
  player.facing = Math.PI
}
