// The player singleton (Tech.md §5.1). Mutated in place, never reallocated, so a
// frame loop can read it without a React subscription.
export const player = {
  // Capsule base (feet) in world space, +Y up.
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  grounded: true,
  facing: Math.PI, // yaw the character model faces, radians
  zone: 'hub',
}

export const PLAYER_RADIUS = 0.4
export const PLAYER_HEIGHT = 1.8 // total capsule height, metres (1u = 1m)

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
