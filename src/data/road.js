// Data for the spawn-hub road (Tech.md §4: every tunable number lives here,
// never in a component). Drawn by components/Road.jsx as a yellow brick/tile
// path laid directly over Ground.jsx's checker floor.
//
// ROAD_WAYPOINTS is hand-authored, not derived from other landmark data, and
// is meant to be hand-edited: it's the one place to adjust the route. It
// currently runs a short stretch from the spawn point (hub.js SPAWN,
// {0, 0, 3}) out toward the target podium / merchant shop cluster
// (data/podiumStage.js PODIUM_STAGE_TARGET_POSITION ≈ [13.57, 0, 17.85],
// data/merchantShop.js SHOP_TRANSFORM at [50, 0, 20]) — the landmarks
// nearest spawn in the reference screenshots. Stops short of the podium's
// own stair footprint (±9 x, ±7 z around it) so the road doesn't run into
// the steps.
//
// Each waypoint may optionally override `width` (metres, kerb to kerb) and
// `color` (hex string) for that point — Road.jsx lerps both across the
// segment to each neighbouring waypoint, so the road can taper and/or
// change tint along its length. Omitted fields fall back to ROAD_WIDTH /
// ROAD_COLOR below, reproducing today's uniform look exactly.
export const ROAD_WAYPOINTS = [
  { x: -40, z: 4, width: 8, color: '#f3c520'  },
  { x: 65, z: 4, width: 8, color: '#f3c520' },
  { x: 65, z: 4, width: 45, color: '#fefdf8' },
  { x: 135, z: 4, width: 45, color: '#fefdf8' },
  { x: 135, z: 4, width: 45, color: '#ff00f2' },
  { x: 200, z: 4, width: 45, color: '#ff00f2' },
  { x: 200, z: 4, width: 45, color: '#5c0023' },
  { x: 270, z: 4, width: 45, color: '#5c0023' },
]

export const ROAD_WIDTH = 14 // metres, kerb to kerb — default; see ROAD_WAYPOINTS[].width
export const ROAD_Y_OFFSET = 0.02 // above Ground.jsx's plane, avoids z-fighting

// World-unit size of one brick tile, independent of segment length — the
// same role Ground.jsx's CELL plays for its checker.
export const ROAD_BRICK_SIZE = 1

// Default brick tint — see ROAD_WAYPOINTS[].color. A waypoint's color
// re-tints the baked texture by its ratio to this default (both brick and
// grout shift together), so a waypoint that doesn't set `color` renders
// identically to today regardless of how this constant changes.
export const ROAD_COLOR = '#f3c520'
export const ROAD_GROUT_COLOR = '#c99a12'
