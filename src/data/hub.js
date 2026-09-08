import { BLOCK_AABBS } from './blocks.js'
import { POWER_PODIUM_AABBS, TARGET_PODIUM_AABBS } from './podium.js'

// Hub geometry (Tech.md §4). Level layout is data, not a Blender file — Blender
// authors props only. This file owns the spawn point and the static AABB list
// the kinematic collider reads (Tech.md §5.2).
export const SPAWN = { x: 0, y: 0, z: 3 }

// Placeholder walls, drawn as plain boxes by Obstacles.jsx. Each entry is a
// world-space { min, max } box that is both the drawn shape and the collider's.
export const HUB_BOXES = [
  { min: { x: 4, y: 0, z: -6 }, max: { x: 6, y: 3, z: 6 } },
  { min: { x: -8, y: 0, z: -3 }, max: { x: -6, y: 2, z: 3 } },
  { min: { x: -3, y: 0, z: -10 }, max: { x: 3, y: 1.2, z: -8 } },
]

// Everything the kinematic collider scans (Tech.md §5.2). The building blocks
// and both podiums draw themselves, so their boxes join the scan here but
// never HUB_BOXES — only props whose collider *is* their drawn shape belong
// in that list. Each set is pre-merged/derived to keep the linear scan short.
export const HUB_AABBS = [
  ...HUB_BOXES,
  ...BLOCK_AABBS,
  ...POWER_PODIUM_AABBS,
  ...TARGET_PODIUM_AABBS,
]
