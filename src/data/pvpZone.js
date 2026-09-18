// PVP zone bounds (Tech.md §4: src/data/ owns every tunable number). The zone
// is a plain XZ rectangle, derived from the 6 grass_block_cube wall segments
// that fence it (data/pvpBlocks.js PVP_CUBE_AABBS) rather than hand-typed, so
// it can never drift from the walls that actually bound it — same rectangle
// data/pvpCenterPentagon.js's header comment already worked out by hand
// (x: [-155.12, -45.63], z: [-59.34, 50.98]) BEFORE the entrance-side widening
// below.
//
// Those 6 cube segments only fence the north, south and west sides — the
// east/entrance side (where the player actually walks in) has no wall block
// at all, just open ground leading up to pvp_wall, the walk-through glass
// gate/sign (data/pvpWall.js). Left alone, that made the cubes' incidental
// east edge (x = -45.63) the zone boundary — ~17m short of the gate itself,
// so combat and health bars armed while the player was still reading the
// sign, well before they'd actually passed through it. maxX is widened to
// the gate's own zone-facing face (PVP_WALL_AABB) so "in the zone" always
// means "past the glass", matching the sign's promise.
import { PVP_CUBE_AABBS } from './pvpBlocks.js'
import { PVP_WALL_AABB } from './pvpWall.js'
import { envInt } from './progression.js'

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
for (const { min, max } of PVP_CUBE_AABBS) {
  if (min.x < minX) minX = min.x
  if (max.x > maxX) maxX = max.x
  if (min.z < minZ) minZ = min.z
  if (max.z > maxZ) maxZ = max.z
}
// The gate's near (zone-facing) face is its AABB's own min.x, since the zone
// sits at lower x than the entrance — passing fully through the glass means
// crossing past that face, not just touching its hub-facing side.
if (PVP_WALL_AABB.min.x > maxX) maxX = PVP_WALL_AABB.min.x

export const PVP_ZONE_BOUNDS = { minX, maxX, minZ, maxZ }

export function isInPvpZone(x, z) {
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ
}

// Respawn point for a death inside the zone (systems/playerHealth.js): the
// hub's SPAWN (data/hub.js) would drop a PVP death right back at the main
// hub, walking distance from the fight that killed them, so a death whose
// (x, z) satisfies isInPvpZone() above instead comes back in here.
//
// Hardcoded to the tuned initial position (0, 4.06) rather than derived from
// the gate geometry — x/z are still overridable via VITE_PVP_SPAWN_X /
// VITE_PVP_SPAWN_Z (same envInt override pattern as data/progression.js) for
// repositioning without a code change, but when neither is set this literal
// is the fallback; y stays hardcoded at ground level (data/hub.js SPAWN is
// flat too).
export const PVP_SPAWN = {
  x: envInt('VITE_PVP_SPAWN_X', 0),
  y: 0,
  z: envInt('VITE_PVP_SPAWN_Z', 4.06),
}
