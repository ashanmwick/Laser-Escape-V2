// Data for the spawn-hub road (Tech.md §4: every tunable number lives here,
// never in a component). Drawn by components/Road.jsx as a yellow brick/tile
// path laid directly over Ground.jsx's checker floor.
//
// ROAD_WAYPOINTS is hand-authored, not derived from other landmark data, and
// is meant to be hand-edited: it's the one place to adjust the route. It
// starts at the spawn point (hub.js SPAWN, {0, 0, 3}), runs a short stretch
// out toward the target podium / merchant shop cluster (data/podiumStage.js
// PODIUM_STAGE_TARGET_POSITION ≈ [13.57, 0, 17.85], data/merchantShop.js
// SHOP_TRANSFORM at [50, 0, 20]) at ROAD_WIDTH, then widens to 45m from
// x=65 onward and runs the full length of the wall gauntlet (25 material
// stages, data/wallProps.js, x≈71..1570) as one paved zone per stage — each
// zone's x-span brackets that stage's panel(s) with room either side, and
// its color approximates that stage's material (paper's white through
// obsidian's near-black) so the road previews which wall is coming up next.
// Stops short of the podium's own stair footprint (±9 x, ±7 z around it) so
// the road doesn't run into the steps.
//
// Each waypoint may optionally override `width` (metres, kerb to kerb) and
// `color` (hex string) for that point — Road.jsx lerps both across the
// segment to each neighbouring waypoint, so the road can taper and/or
// change tint along its length. Omitted fields fall back to ROAD_WIDTH /
// ROAD_COLOR below, reproducing today's uniform look exactly. A repeated x
// across two consecutive waypoints (all the zone joins below) makes the
// color switch instantly rather than lerp, so each zone reads as one flat
// tint.
export const ROAD_WAYPOINTS = [
  { x: -40, z: 4, width: 8, color: '#f3c520'  },
  { x: 65, z: 4, width: 8, color: '#f3c520' },
  { x: 65, z: 4, width: 45, color: '#fefdf8' }, // stage 1 paper
  { x: 135, z: 4, width: 45, color: '#fefdf8' },
  { x: 135, z: 4, width: 45, color: '#ff00f2' }, // stage 2 cardboard
  { x: 200, z: 4, width: 45, color: '#ff00f2' },
  { x: 200, z: 4, width: 45, color: '#5c0023' }, // stages 3-4 carpet/leather
  { x: 270, z: 4, width: 45, color: '#5c0023' },
  { x: 270, z: 4, width: 45, color: '#262626' }, // stage 5 rubber
  { x: 355, z: 4, width: 45, color: '#262626' },
  { x: 355, z: 4, width: 45, color: '#4a8f3c' }, // stage 6 grass
  { x: 415, z: 4, width: 45, color: '#4a8f3c' },
  { x: 415, z: 4, width: 45, color: '#8b5a2b' }, // stage 7 wood
  { x: 480, z: 4, width: 45, color: '#8b5a2b' },
  { x: 480, z: 4, width: 45, color: '#bfe8f0' }, // stage 8 glass
  { x: 545, z: 4, width: 45, color: '#bfe8f0' },
  { x: 545, z: 4, width: 45, color: '#9a9a9a' }, // stage 9 concrete
  { x: 605, z: 4, width: 45, color: '#9a9a9a' },
  { x: 605, z: 4, width: 45, color: '#a6402c' }, // stage 10 brick
  { x: 670, z: 4, width: 45, color: '#a6402c' },
  { x: 670, z: 4, width: 45, color: '#d9cdb0' }, // stage 11 limestone
  { x: 730, z: 4, width: 45, color: '#d9cdb0' },
  { x: 730, z: 4, width: 45, color: '#787878' }, // stage 12 stone
  { x: 795, z: 4, width: 45, color: '#787878' },
  { x: 795, z: 4, width: 45, color: '#f0ede4' }, // stage 13 marble
  { x: 855, z: 4, width: 45, color: '#f0ede4' },
  { x: 855, z: 4, width: 45, color: '#4a4a4d' }, // stage 14 iron
  { x: 915, z: 4, width: 45, color: '#4a4a4d' },
  { x: 915, z: 4, width: 45, color: '#b5651d' }, // stage 15 copper
  { x: 980, z: 4, width: 45, color: '#b5651d' },
  { x: 980, z: 4, width: 45, color: '#948b86' }, // stage 16 granite
  { x: 1040, z: 4, width: 45, color: '#948b86' },
  { x: 1040, z: 4, width: 45, color: '#b8b8c0' }, // stage 17 titanium
  { x: 1105, z: 4, width: 45, color: '#b8b8c0' },
  { x: 1105, z: 4, width: 45, color: '#6e7880' }, // stage 18 steel
  { x: 1165, z: 4, width: 45, color: '#6e7880' },
  { x: 1165, z: 4, width: 45, color: '#c8c8c8' }, // stage 19 metal
  { x: 1225, z: 4, width: 45, color: '#c8c8c8' },
  { x: 1225, z: 4, width: 45, color: '#d8f5fb' }, // stage 20 diamond
  { x: 1285, z: 4, width: 45, color: '#d8f5fb' },
  { x: 1285, z: 4, width: 45, color: '#1b1e24' }, // stage 21 carbon fiber
  { x: 1350, z: 4, width: 45, color: '#1b1e24' },
  { x: 1350, z: 4, width: 45, color: '#55555c' }, // stage 22 tungsten
  { x: 1410, z: 4, width: 45, color: '#55555c' },
  { x: 1410, z: 4, width: 45, color: '#15001f' }, // stage 23 void
  { x: 1470, z: 4, width: 45, color: '#15001f' },
  { x: 1470, z: 4, width: 45, color: '#ff4500' }, // stage 24 magma
  { x: 1535, z: 4, width: 45, color: '#ff4500' },
  { x: 1535, z: 4, width: 45, color: '#0c0c0c' }, // stage 25 obsidian
  { x: 1630, z: 4, width: 45, color: '#0c0c0c' },
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
