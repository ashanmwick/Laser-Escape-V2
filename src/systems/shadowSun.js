// Player-following shadow light target (Tech.md §7). The shadow-casting key
// light's orthographic frustum is only ~90x90 world metres — far too small
// to cover the whole map (the ground alone is ~1820m wide) — so instead of
// covering the level, it recenters on the player every frame. Cost is then
// bounded by "whatever's near the player right now", not level size, which
// is what makes a real shadow map affordable in a map this large.
//
// Mutated in place, never reallocated (Tech.md §5.1's playerState.js
// convention) so ShadowSun.jsx's own useFrame can read it without a
// subscription.
import { player } from './playerState.js'

// Elevated and angled, not overhead — an overhead light produces short,
// pillar-like shadows directly under objects, which reads worse than a raked
// angle. Matches the ~30/45/20 offset a comparable shadow-casting light used
// in a reference project at this same rough elevation-to-spread ratio.
const OFFSET = { x: 30, y: 45, z: 20 }

export const sunTarget = { x: 0, y: 0, z: 0 }
export const sunPosition = { x: OFFSET.x, y: OFFSET.y, z: OFFSET.z }

export function step() {
  sunTarget.x = player.position.x
  sunTarget.y = player.position.y
  sunTarget.z = player.position.z
  sunPosition.x = player.position.x + OFFSET.x
  sunPosition.y = player.position.y + OFFSET.y
  sunPosition.z = player.position.z + OFFSET.z
}
