import { BLOCK_AABBS } from './blocks.js'
import { GRASS_BLOCK_AABBS } from './grassBlocks.js'
import { POWER_PODIUM_AABBS, TARGET_PODIUM_AABBS } from './podium.js'
import { WALL_AABBS } from './wallProps.js'

// Hub geometry (Tech.md §4). Level layout is data, not a Blender file — Blender
// authors props only. This file owns the spawn point and the static AABB list
// the kinematic collider reads (Tech.md §5.2).
export const SPAWN = { x: 0, y: 0, z: 3 }

// Placeholder walls, drawn as plain boxes by Obstacles.jsx. Each entry is a
// world-space { min, max } box that is both the drawn shape and the collider's.
export const HUB_BOXES = []

// Everything the kinematic collider scans (Tech.md §5.2). The building blocks
// and both podiums draw themselves, so their boxes join the scan here but
// never HUB_BOXES — only props whose collider *is* their drawn shape belong
// in that list. Each set is pre-merged/derived to keep the linear scan short.
export const HUB_AABBS = [
  ...HUB_BOXES,
  ...BLOCK_AABBS,
  ...GRASS_BLOCK_AABBS,
  ...POWER_PODIUM_AABBS,
  ...TARGET_PODIUM_AABBS,
  ...WALL_AABBS,
]
