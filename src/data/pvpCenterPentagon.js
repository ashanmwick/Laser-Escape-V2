// A new landmark prop, not sourced from the .blend: a stack of pentagon
// prisms marking the middle of the Pvp zone (data/pvpBlocks.js, data/
// pvpWall.js), fully code-generated the same way as TargetGroundMat.jsx.
//
// Position derived, not authored: the Pvp zone's 6 grass_block_cube wall
// segments (data/pvpBlocks.js RAW_CUBE) form a walled rectangle around the
// zone's dirt terrain. Their world AABBs (PVP_CUBE_AABBS) bound that
// rectangle at three.js x: [-155.12, -45.63], z: [-59.34, 50.98] — this
// prop's X/Z sit at that rectangle's midpoint. None of the Pvp zone's dirt
// tiles (PVP_DIRT_AABBS) actually cover that midpoint — they're terrain
// mounds clustered near the zone's north/south edges — so the midpoint sits
// on the shared base Ground plane (Ground.jsx, flat at y = 0) rather than on
// any raised dirt platform, hence Y = 0 here (the bottom tier's own mesh
// lifts itself by half its height on top of that, same convention as every
// other box/cylinder prop in the scene).
export const PVP_CENTER_PENTAGON_POSITION = [-80, 0, -5]
export const PVP_CENTER_PENTAGON_ROTATION_Y = Math.PI / 3 // 60°, turn around the up axis

// Same checker-cell pitch as Ground.jsx's own CELL (2m), so each tier's
// recolored stud texture (systems/studTexture.js, built per-tier in
// PvpCenterPentagon.jsx) reads at the same physical stud density as the
// ground it's standing on, not a stretched or squished copy of it.
export const PVP_CENTER_PENTAGON_CELL = 2

// The stack: a wide purple base tier, then alternating narrower/shorter
// tiers (purple/yellow) on top of each other, each one 0.98x the radius and
// 0.85x the height of the tier below it — originally authored as just a
// base + one tier on top, then extended to 5 such purple/yellow couples (10
// tiers total) by continuing that same pair of ratios.
const BASE_RADIUS = 15 // metres, circumscribed radius of tier 0's 5-sided prism
const BASE_HEIGHT = 0.75
const RADIUS_RATIO = 0.98 // each tier's radius, relative to the tier below it
const HEIGHT_RATIO = 0.85 // each tier's height, relative to the tier below it
const COUPLES = 5 // purple+yellow pairs, tier 0 (purple) included
const PURPLE = '#5500ff'
const YELLOW = '#ffe600'

const [PENTAGON_X, GROUND_Y, PENTAGON_Z] = PVP_CENTER_PENTAGON_POSITION

// Each tier's own world centre, stacked directly on the running height
// total of every shorter tier below it (PvpCenterPentagon.jsx no longer
// needs to redo this walk itself — it just mounts each tier at its own
// `position`).
let centerY = GROUND_Y
export const PVP_CENTER_PENTAGON_TIERS = Array.from({ length: COUPLES * 2 }, (_, i) => {
  const radius = BASE_RADIUS * RADIUS_RATIO ** i
  const height = BASE_HEIGHT * HEIGHT_RATIO ** i
  centerY += height / 2
  const position = [PENTAGON_X, centerY, PENTAGON_Z]
  centerY += height / 2
  return { radius, height, color: i % 2 === 0 ? PURPLE : YELLOW, position }
})

// Real pentagon colliders, not a box approximation: an axis-aligned box
// around a 5-sided shape rotated 60° always leaves big empty wedges at its
// corners (or, shrunk to fit inside, chops off the mesh's points) — neither
// reads as "the collider matches the object". So systems/playerMovement.js
// gained a second collider kind for this stack: a convex-polygon prism,
// tested as a circle (the player's own XZ radius) against the pentagon's 5
// face planes directly, the same push-the-shallow-way idea data/hub.js's
// AABBs use, generalized from 2 push axes (±x, ±z) to 5 (one per face
// normal). Each tier is fully described by its centre, its Y range, and its
// apothem (perpendicular centre-to-face distance, R*cos(pi/N) for a regular
// N-gon — the same for every face by construction) plus that face's own
// outward unit normal.
//
// Face i sits between vertex i and vertex i+1 (CylinderGeometry — three.js
// source — places local vertex i at angle i*(2*pi/N), (x, z) =
// (radius*sin(angle), radius*cos(angle)); the mesh's own rotation-y just
// adds directly to every vertex's angle, per data/pvpBlocks.js's rotateYaw
// precedent), so face i's outward normal points along the angular midpoint
// of its two vertices: rotationY + (i + 0.5) * (2*pi/N). Same rotation for
// every tier, so these 5 normals are shared across the whole stack.
const SIDES = 5
const PENTAGON_FACE_NORMALS = Array.from({ length: SIDES }, (_, i) => {
  const angle = PVP_CENTER_PENTAGON_ROTATION_Y + (i + 0.5) * ((Math.PI * 2) / SIDES)
  return { x: Math.sin(angle), z: Math.cos(angle) }
})

// Registered into data/hub.js's HUB_POLYGONS (a second, parallel collider
// list next to HUB_AABBS — systems/collision.js's getPolys(), threaded into
// systems/playerMovement.js's step() alongside getAabbs()) so the whole
// stack is solid, closely-fitting ground: players land on top of each tier
// and step from one onto the next the moment its rise is within
// systems/playerMovement.js's STEP_HEIGHT (0.45m) — true once BASE_HEIGHT's
// 0.85x falloff has shrunk a tier past that, same jump-assisted climb below
// that point as stepping up data/podiumStage.js's risers.
export const PVP_CENTER_PENTAGON_POLYGONS = PVP_CENTER_PENTAGON_TIERS.map((tier) => ({
  center: { x: tier.position[0], z: tier.position[2] },
  minY: tier.position[1] - tier.height / 2,
  maxY: tier.position[1] + tier.height / 2,
  apothem: tier.radius * Math.cos(Math.PI / SIDES),
  normals: PENTAGON_FACE_NORMALS,
}))
