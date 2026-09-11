// Data for the spawn-hub road (Tech.md §4: every tunable number lives here,
// never in a component). Drawn by components/Road.jsx as a yellow brick/tile
// path laid directly over Ground.jsx's checker floor.
//
// ROAD_WAYPOINTS is hand-authored, not derived from other landmark data, and
// is meant to be hand-edited: it's the one place to adjust the route. It
// currently runs a short stretch from the spawn point (hub.js SPAWN,
// {0, 0, 3}) out toward the target podium / merchant shop cluster
// (data/podium.js TARGET_PODIUM_POSITION ≈ [13.57, 0, 17.85], data/
// merchantShop.js SHOP_TRANSFORM at [50, 0, 20]) — the landmarks nearest
// spawn in the reference screenshots. Stops short of the podium's own stair
// footprint (±11 x, ±7 z around it) so the road doesn't run into the steps.
export const ROAD_WAYPOINTS = [
  { x: -40, z: 0 },
  { x: 65, z: 5 },
]

export const ROAD_WIDTH = 14 // metres, kerb to kerb
export const ROAD_Y_OFFSET = 0.02 // above Ground.jsx's plane, avoids z-fighting

// World-unit size of one brick tile, independent of segment length — the
// same role Ground.jsx's CELL plays for its checker.
export const ROAD_BRICK_SIZE = 1

export const ROAD_COLOR = '#f3c520'
export const ROAD_GROUT_COLOR = '#c99a12'
