import {
  PODIUM_STAGE_HUB_TRANSFORM,
  PODIUM_STAGE_TARGET_TRANSFORM,
  PODIUM_STAGE_PROFILE,
  PODIUM_STAGE_TARGET_PROFILE,
  localToWorld,
} from './podiumStage.js'

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

// Branch paths off the main road (ROAD_WAYPOINTS above) — each its own
// hand-shaped export, same flat {x, z, width?, color?}[] shape as
// ROAD_WAYPOINTS itself, so components/Road.jsx draws each as its own
// ribbon rather than one polyline jumping between unrelated points. Unlike
// ROAD_WAYPOINTS, a spur's endpoint IS derived from other landmark data
// (data/podiumStage.js): a spur's whole point is to land exactly on a
// staircase's own front edge, so hand-guessing that coordinate would drift
// the moment the podium's transform/profile changes, where deriving it
// never can.
//
// Both the Hub and Target podium instances sit near the same world x
// (PODIUM_STAGE_HUB_TRANSFORM.x === PODIUM_STAGE_TARGET_TRANSFORM.x,
// data/podiumStage.js) — dead centre of the road's own first zone (x -40..65,
// z 4, width 8, color unset → default ROAD_COLOR, this file's yellow), so
// every spur's own junction point sits on that same zone's kerb (z 0 or z 8,
// not the centreline z 4) on whichever side actually faces its podium: z 0
// (south kerb) for the two Hub spurs, since the Hub podium sits behind the
// road at z -20; z 8 (north kerb) for the two Target spurs, since the
// Target podium sits ahead of it at z ~26. Each spur then runs straight
// (constant x) up to its own flank staircase, not the shared centre landing
// (HUB_STAIRS_LANDING.x/TARGET_STAIRS_LANDING.x) both flanks sit either
// side of.
//
// Each landing's z is that podium's own stepSpan(0).z1 — the front edge of
// the bottom step, i.e. where a climber's foot actually lands before the
// first riser (STAIR_APRON pushes it forward of the tier block's FRONT_Z,
// then LANDING_WIDEN_MULT and allStepsDepthMult reshape it further — see
// buildPodiumStageProfile's own comments); each spur's own x is hand-picked
// near that same profile's flankSpan for the flank it targets (see the two
// comments below), not the centre x localToWorld(t, 0, 0, ...) returns.

function podiumStairsLanding(transform, profile) {
  const [x, , z] = localToWorld(transform, 0, 0, profile.stepSpan(0).z1)
  return { x, z }
}

const HUB_STAIRS_LANDING = podiumStairsLanding(PODIUM_STAGE_HUB_TRANSFORM, PODIUM_STAGE_PROFILE)
const TARGET_STAIRS_LANDING = podiumStairsLanding(
  PODIUM_STAGE_TARGET_TRANSFORM,
  PODIUM_STAGE_TARGET_PROFILE,
)

// Hub spurs run one straight line per flank staircase (not to the shared
// centre landing HUB_STAIRS_LANDING.x sits at) — x 2 and x 25 hand-picked
// near the left/right flank's own landing x (computed rightFoot/leftFoot
// were ~2.03/~25.11 — see flankSpan/stepSpan(0) in data/podiumStage.js),
// mirrored around ROAD_SPUR_BRANCH_X. Both share HUB_STAIRS_LANDING.z, the
// landing depth being the same for either flank.
export const ROAD_SPUR_HUB_LEFT_WAYPOINTS = [
  { x: 2, z: 0, width: 4 },
  { x: 2, z: HUB_STAIRS_LANDING.z, width: 4 },
]

export const ROAD_SPUR_HUB_RIGHT_WAYPOINTS = [
  { x: 25, z: 0, width: 4 },
  { x: 25, z: HUB_STAIRS_LANDING.z, width: 4 },
]

// Target spurs, same idea as the Hub ones above — one straight line per
// flank staircase rather than the shared centre landing TARGET_STAIRS_
// LANDING.x sits at. yaw is Math.PI here (PODIUM_STAGE_TARGET_TRANSFORM),
// which mirrors local +X to world -X, so the computed rightFoot/leftFoot
// come out swapped in world space (~1.38/~25.76) versus the Hub's own
// (~2.03/~25.11) — close enough to the Hub's own x 2/x 25 (within half a
// metre, well inside this path's own 4m width) that both spur pairs reuse
// the same two x values rather than a second hand-picked pair, keeping the
// "left"/"right" names Hub uses (smaller/larger world x) for consistency
// between the two spur pairs, not tied to the model's own local left/right.
export const ROAD_SPUR_TARGET_LEFT_WAYPOINTS = [
  { x: 2, z: 8, width: 4 },
  { x: 2, z: TARGET_STAIRS_LANDING.z, width: 4 },
]

export const ROAD_SPUR_TARGET_RIGHT_WAYPOINTS = [
  { x: 25, z: 8, width: 4 },
  { x: 25, z: TARGET_STAIRS_LANDING.z, width: 4 },
]

export const ROAD_WIDTH = 14 // metres, kerb to kerb — default; see ROAD_WAYPOINTS[].width
export const ROAD_Y_OFFSET = 0.02 // above Ground.jsx's plane, avoids z-fighting

// World-unit size of one checker cell, independent of segment length — the
// same role Ground.jsx's CELL plays for its own stud checker.
export const ROAD_BRICK_SIZE = 1

// Default stud-checker tint — see ROAD_WAYPOINTS[].color. A waypoint's color
// re-tints the baked texture by its ratio to this default (both tones shift
// together), so a waypoint that doesn't set `color` renders identically to
// today regardless of how this constant changes.
export const ROAD_COLOR = '#f3c520'
export const ROAD_GROUT_COLOR = '#c99a12'
