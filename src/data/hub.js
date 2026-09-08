// Hub geometry (Tech.md §4). Level layout is data, not a Blender file — Blender
// authors props only. This file owns the spawn point and the static AABB list
// the kinematic collider reads (Tech.md §5.2).
export const SPAWN = { x: 0, y: 0, z: 3 }

// A few blocks so the basic controller has something to collide and slide
// against. Each entry is a world-space { min, max } box.
export const HUB_AABBS = [
  { min: { x: 4, y: 0, z: -6 }, max: { x: 6, y: 3, z: 6 } },
  { min: { x: -8, y: 0, z: -3 }, max: { x: -6, y: 2, z: 3 } },
  { min: { x: -3, y: 0, z: -10 }, max: { x: 3, y: 1.2, z: -8 } },
]
