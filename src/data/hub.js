import { BLOCK_AABBS } from './blocks.js'
import { GRASS_BLOCK_AABBS } from './grassBlocks.js'
import { GRASS_BLOCK_CUBE_AABBS } from './grassBlockCubes.js'
import { PVP_DIRT_AABBS, PVP_CUBE_AABBS } from './pvpBlocks.js'
import { PVP_CENTER_PENTAGON_POLYGONS } from './pvpCenterPentagon.js'
import { MERCHANT_SHOP_AABBS } from './merchantShop.js'
import { PODIUM_STAGE_HUB_AABBS, PODIUM_STAGE_TARGET_AABBS } from './podiumStage.js'
import { WOOD_CRATE_AABBS } from './woodCrate.js'
import { WALL_AABBS } from './wallProps.js'

// Hub geometry (Tech.md §4). Level layout is data, not a Blender file — Blender
// authors props only. This file owns the spawn point and the static AABB list
// the kinematic collider reads (Tech.md §5.2).
export const SPAWN = { x: 0, y: 0, z: 3 }

// Placeholder walls, drawn as plain boxes by Obstacles.jsx. Each entry is a
// world-space { min, max } box that is both the drawn shape and the collider's.
export const HUB_BOXES = []

// Everything the kinematic collider scans (Tech.md §5.2). The building blocks,
// both podiums, the merchant shop and the crate stack draw themselves, so
// their boxes join the scan here but never HUB_BOXES — only props whose
// collider *is* their drawn shape belong in that list. Each set is
// pre-merged/derived to keep the linear scan short.
export const HUB_AABBS = [
  ...HUB_BOXES,
  ...BLOCK_AABBS,
  ...GRASS_BLOCK_AABBS,
  ...GRASS_BLOCK_CUBE_AABBS,
  ...PVP_DIRT_AABBS,
  ...PVP_CUBE_AABBS,
  // pvp_wall is intentionally left out of the collider scan (Tech.md §5.2):
  // it's the "UNLOCKABLE ON REBIRTH 1" sign wall (data/pvpWall.js), and for
  // now the PVP zone stays walk-through so players can enter before that
  // gate is wired up. The glass panel + sign still render (PvpWall.jsx);
  // only the kinematic collider ignores it.
  ...PODIUM_STAGE_TARGET_AABBS,
  ...PODIUM_STAGE_HUB_AABBS,
  ...MERCHANT_SHOP_AABBS,
  ...WOOD_CRATE_AABBS,
  ...WALL_AABBS,
]

// A second, parallel collider list for props an axis-aligned box can't
// decently approximate (Tech.md §5.2's AABB scan above assumes rectangular
// or 0/90°-rotated footprints — true of every other prop in this file, but
// not data/pvpCenterPentagon.js's 60°-rotated pentagon stack). systems/
// collision.js's getPolys() exposes this; systems/playerMovement.js's
// step() scans it the same way as HUB_AABBS, just against convex-polygon
// faces instead of box faces.
export const HUB_POLYGONS = [...PVP_CENTER_PENTAGON_POLYGONS]

// A third collider list, for shells rather than solids (systems/
// playerMovement.js's resolveRingXZ/resolveRingY, via systems/collision.js's
// getRings()) — empty for now. data/pvpCenterPentagon.js's cylinder cap
// (PVP_CENTER_CYLINDER_RING) is intentionally left out, same precedent as
// pvp_wall above: it renders (PvpCenterPentagon.jsx's RingShell) but stays
// walk-through, not solid.
export const HUB_RINGS = []
