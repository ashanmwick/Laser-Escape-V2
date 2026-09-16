// PVP zone bounds (Tech.md §4: src/data/ owns every tunable number). The zone
// is a plain XZ rectangle, derived from the 6 grass_block_cube wall segments
// that fence it (data/pvpBlocks.js PVP_CUBE_AABBS) rather than hand-typed, so
// it can never drift from the walls that actually bound it — same rectangle
// data/pvpCenterPentagon.js's header comment already worked out by hand
// (x: [-155.12, -45.63], z: [-59.34, 50.98]).
import { PVP_CUBE_AABBS } from './pvpBlocks.js'

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
for (const { min, max } of PVP_CUBE_AABBS) {
  if (min.x < minX) minX = min.x
  if (max.x > maxX) maxX = max.x
  if (min.z < minZ) minZ = min.z
  if (max.z > maxZ) maxZ = max.z
}

export const PVP_ZONE_BOUNDS = { minX, maxX, minZ, maxZ }

export function isInPvpZone(x, z) {
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ
}

// Where a player lands on death-respawn (systems/playerHealth.js): inside the
// zone, near its hub-facing entrance (data/pvpWall.js's glass sign sits around
// x -28.7, just outside this rectangle), and far enough from the King of the
// Hill pentagon stack (data/pvpCenterPentagon.js, base radius 15 centred at
// x:-80, z:-5) that a respawn never lands inside its collider.
export const PVP_RESPAWN_POINT = { x: -50, y: 0, z: -5 }
