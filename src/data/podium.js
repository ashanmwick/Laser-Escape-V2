// Data for the `power_podium` prop and its duplicate `target_podium`
// (Tech.md §4: every tunable number lives here, never in a component).
// Both objects share one Blender mesh/material set (`data_name` power_podium
// in the .blend) and differ only in placement, so this file holds one local
// (object-space) geometry description and generates each instance's world
// AABBs — and mount position/rotation — from its own transform, rather than
// authoring the box list (or the model) twice.
//
// The prop is a tiered display riser: a flight of 12 steps up EACH side
// (climbable — "solid object... climb it up through side stairs"), leading
// to three flat tiers in the centre that the side stairs open onto. The
// centre tiers have no stairs of their own — each is a sheer riser taller
// than the player's jump apex (~1.28m, playerMovement.js) — so the side
// staircases are the only way up, exactly as modelled in Blender.
//
// The boxes below were derived by raycasting the actual mesh (Blender,
// top-down per column) rather than guessed, so the collider tracks the real
// geometry: every ~0.36m step is comfortably under the jump apex, and the
// two mid-flight landings (after steps 4 and 8) line up with tier1/tier2's
// height, matching the model exactly.
export const PODIUM_MODEL_URL = '/models/power_podium.glb'

// Each object's transform: location.x/y, +Z height already corrected to sit
// flush on this scene's ground (zFit), a `yaw` — rotation around the up
// axis, radians, independent of position — and uniform scale.
// power_podium's authored Z sits 1.5014272928237915 below the scene's ground
// reference, which would bury its entire first flight under the ground
// plane; target_podium's does not. Both end up flush at world Y=0, which is
// the design intent for a floor-standing prop, not a coincidence.
export const POWER_PODIUM_TRANSFORM = {
  x: 13.571624755859375,
  y: 15.831555366516113,
  zFit: 0,
  yaw: 0,
  scale: 1.1043590307235718,
}
export const TARGET_PODIUM_TRANSFORM = {
  x: 13.571624755859375,
  y: -17.854000091552734,
  zFit: 0,
  yaw: 3.1193714141845703, // ~178.7°: turns its stairs to face power_podium's
  scale: 1.1043599843978882,
}

// Rotates a local (x, y) point by `t.yaw` around the up axis — the same
// angle whether read as a turn around Blender's Z or three.js's Y, since
// the fixed Z-up -> Y-up remap (three.x = blender.x, three.z = -blender.y)
// carries a rotation about that shared axis across unchanged.
function rotate(t, lx, ly) {
  const cos = Math.cos(t.yaw)
  const sin = Math.sin(t.yaw)
  return [lx * cos - ly * sin, lx * sin + ly * cos]
}

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own convention
// (verified against an exported node's translation): three.x = blender.x,
// three.y = blender.z, three.z = -blender.y — applied after rotating the
// local point by yaw and before scaling/translating.
function toThree(t, lx, ly, lz) {
  const [rx, ry] = rotate(t, lx, ly)
  return [t.x + t.scale * rx, t.zFit + t.scale * lz, -(t.y + t.scale * ry)]
}

// The position to set on each instance's own mount group (PodiumProp.jsx).
// PodiumProp also applies `t.yaw` as the group's own rotation-y, so the
// loaded model (whose baked placement propModel.js strips to identity on
// load) ends up exactly here, turned exactly this far.
export const POWER_PODIUM_POSITION = toThree(POWER_PODIUM_TRANSFORM, 0, 0, 0)
export const TARGET_PODIUM_POSITION = toThree(TARGET_PODIUM_TRANSFORM, 0, 0, 0)

// Object-space (local, pre-transform) step footprints: each side's 12 steps
// + 2 mid-flight landings, solid from the ground up to that tread's height.
// x is mirrored for the left side by negating it (local origin is the
// object's own centreline), so the profile is only authored once.
const STEP_PROFILE = [
  { y: [-6.45, -4.912], top: 0.33 },
  { y: [-4.912, -4.168], top: 0.66 },
  { y: [-4.168, -3.473], top: 0.99 },
  { y: [-3.473, -2.729], top: 1.32 },
  { y: [-2.729, -2.034], top: 1.65 }, // landing 1 (= tier1 height)
  { y: [-2.034, -1.29], top: 1.98 },
  { y: [-1.29, -0.595], top: 2.31 },
  { y: [-0.595, 0.149], top: 2.64 },
  { y: [0.149, 0.843], top: 2.97 },
  { y: [0.843, 1.588], top: 3.3 }, // landing 2 (= tier2 height)
  { y: [1.588, 2.282], top: 3.63 },
  { y: [2.282, 3.027], top: 3.96 },
  { y: [3.027, 3.721], top: 4.29 },
  { y: [3.721, 4.465], top: 4.62 },
]
const RIGHT_X = [8.35, 10.05]
const LEFT_X = [-10.05, -8.35]

// The three centre tiers the side stairs open onto, plus the back platform
// (full width once both side staircases have topped out).
const CENTRE_PROFILE = [
  { x: [-8.35, 8.35], y: [-6.45, -2.034], top: 1.65 }, // tier1
  { x: [-8.35, 8.35], y: [-2.034, 1.588], top: 3.3 }, // tier2
  { x: [-8.35, 8.35], y: [1.588, 4.465], top: 4.95 }, // platform (centre)
  { x: [-10.05, 10.05], y: [4.465, 6.45], top: 4.95 }, // platform (full width)
]

// The enclosing world AABB of a local box after rotate+scale+translate is
// applied to all 8 corners — exact for an unrotated instance (power_podium)
// and, for a turn this close to 180° like target_podium's, only
// fractionally looser than the box itself.
function box(t, x0, x1, y0, y1, z1) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const lx of [x0, x1]) {
    for (const ly of [y0, y1]) {
      for (const lz of [0, z1]) {
        const p = toThree(t, lx, ly, lz)
        for (let i = 0; i < 3; i++) {
          if (p[i] < min[i]) min[i] = p[i]
          if (p[i] > max[i]) max[i] = p[i]
        }
      }
    }
  }
  return {
    min: { x: min[0], y: min[1], z: min[2] },
    max: { x: max[0], y: max[1], z: max[2] },
  }
}

export function buildPodiumAabbs(t) {
  const out = []
  for (const s of STEP_PROFILE) {
    out.push(box(t, RIGHT_X[0], RIGHT_X[1], s.y[0], s.y[1], s.top))
    out.push(box(t, LEFT_X[0], LEFT_X[1], s.y[0], s.y[1], s.top))
  }
  for (const c of CENTRE_PROFILE) {
    out.push(box(t, c.x[0], c.x[1], c.y[0], c.y[1], c.top))
  }
  return out
}

export const POWER_PODIUM_AABBS = buildPodiumAabbs(POWER_PODIUM_TRANSFORM)
export const TARGET_PODIUM_AABBS = buildPodiumAabbs(TARGET_PODIUM_TRANSFORM)
