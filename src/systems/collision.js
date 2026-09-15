// Owns the live copy of the kinematic collider's AABB list (Tech.md §5.1
// style: framework-free, mutable module state). Starts as a copy of
// data/hub.js's static HUB_AABBS; systems/wallHealth.js calls removeAabb()
// on the rare event a wall is destroyed, so getAabbs() stays a cached array
// reference the rest of the time — no per-frame allocation on the hot path.
import { HUB_AABBS, HUB_POLYGONS } from '../data/hub.js'

let liveAabbs = HUB_AABBS.slice()

export function getAabbs() {
  return liveAabbs
}

// The convex-polygon collider list (data/hub.js's HUB_POLYGONS — currently
// just data/pvpCenterPentagon.js's pentagon stack) never grows/shrinks at
// runtime the way HUB_AABBS does, so it's exposed as-is with no live-copy or
// remove/reset machinery to match.
export function getPolys() {
  return HUB_POLYGONS
}

export function removeAabb(id) {
  liveAabbs = liveAabbs.filter((a) => a.id !== id)
}

// Bring every collider back — used by the win-panel respawn
// (systems/glowFloorPanel.js) to undo the removeAabb() calls destroyed walls
// made. Cheap: one slice, same as boot.
export function resetAabbs() {
  liveAabbs = HUB_AABBS.slice()
}
