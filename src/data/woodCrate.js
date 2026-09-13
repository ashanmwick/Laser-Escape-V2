// Data for the code-generated `wood_crate` prop — a stack of three wooden
// shipping crates (Tech.md §4: every tunable number lives here, never in a
// component). Framework-free geometry lives in systems/woodCrateModel.js; the
// single painted texture lives in systems/woodCrateAtlas.js.
//
// Local space: origin at the ground centre of the two front crates, +Y up,
// +Z toward the viewer. Scale is real-world metres (Tech.md §6) — CRATE_SIZE
// 1.0 is about what a person could carry two-handed.

// --- placement -------------------------------------------------------------
// World transform. Sits a few metres north of the merchant shop's baseplate
// (data/merchantShop.js SHOP_TRANSFORM, world [50, 0, 20]; its 6.4 m
// baseplate is square, so the yaw -90deg it's built with doesn't change its
// AABB — world x:[46.8,53.2] z:[16.8,23.2]). z=26 clears that edge by
// ~2 m once this stack's own ~1.5 m x 2.2 m footprint (WOOD_CRATE_AABBS,
// below) is centred here, and sits on the shop's side facing world +Z, not
// the front counter (which faces world -X). Re-check against HUB_AABBS
// after moving this or resizing CRATE_SIZE, the same way podiumStage.js's
// own placement comments describe.
export const WOOD_CRATE_TRANSFORM = {
  x: 50,
  y: 0,
  z: 26,
  yaw: 0,
  scale: 1,
}

// --- shape -----------------------------------------------------------------
export const CRATE_SIZE = 1.0 // one edge of a single crate, metres
export const CRATE_GAP = 0.02 // clearance between the two front crates

// The three crates' own local transforms: two side by side at the front,
// yaw 0, and a third turned 45 degrees and nested in the notch between them,
// resting higher up — the "pyramid of crates" read the reference image
// uses. `y` is each crate's CENTRE height (its geometry is centred on its
// own origin), so a flat crate's y is exactly CRATE_SIZE / 2.
export const CRATE_INSTANCES = [
  { x: -(CRATE_SIZE + CRATE_GAP) / 2, y: CRATE_SIZE / 2, z: 0, yaw: 0 },
  { x: (CRATE_SIZE + CRATE_GAP) / 2, y: CRATE_SIZE / 2, z: 0, yaw: 0 },
  // Yaw only turns the box about the vertical axis — its top/bottom stay
  // flat and its own height stays CRATE_SIZE regardless of yaw — so resting
  // flush on the two front crates' shared top (CRATE_SIZE) simply means this
  // crate's own centre is CRATE_SIZE / 2 higher still. The 45deg turn reads
  // as a diamond footprint straddling the seam between the two front
  // crates, same as the reference photo, without actually sinking into
  // either of them.
  {
    x: 0,
    y: CRATE_SIZE + CRATE_SIZE / 2,
    z: -CRATE_SIZE * 0.18,
    yaw: Math.PI / 4,
  },
]

// --- material / texture -----------------------------------------------------
// One square canvas, applied unmodified to all 6 faces of every crate's
// BoxGeometry (three's default box UVs already map each face to the full
// 0..1 square) — every face of the reference crate reads as the same
// painted panel, so one texture on every face is enough: base plank colour +
// grain, a raised-look darker frame around the edge, one corner-to-corner
// diagonal brace, and a scatter of small bolt/rivet squares across the rest
// of the panel.
export const CRATE_ATLAS_SIZE = 512

export const CRATE_COLORS = {
  base: '#c9944e', // plank base — warm oak/pine
  grain: '#a3703a', // grain lines / tonal bands
  light: '#dcae70', // lighter plank highlight
  frame: '#7a4a24', // edge frame + diagonal brace body
  frameLight: '#8f5b2e', // frame/brace bevel highlight (lit edge)
  frameDark: '#573419', // frame/brace bevel shadow (unlit edge)
  rivet: '#3a2414', // small bolt/rivet squares
}

// Border strip framing the panel, with a thin bevel sliver on its inner
// edges so it reads as proud of the base plank under the scene's directional
// light rather than just a flat darker rectangle.
export const FRAME = {
  width: 0.1, // strip width, fraction of the canvas
  bevel: 0.016, // highlight/shadow sliver width, fraction of the canvas
}

// One diagonal brace, corner to corner (top-left to bottom-right), same
// bevel treatment as FRAME.
export const BRACE = {
  width: 0.09, // beam width, fraction of the canvas diagonal
  bevel: 0.014,
}

// Small square rivets scattered on a grid across the inner panel. Cells
// whose centre falls too close to the diagonal brace are skipped so rivets
// never sit on top of it.
export const RIVETS = {
  size: 0.026, // square side, fraction of the canvas
  cells: 6, // grid cells per axis across the inner panel
}

// --- collision ---------------------------------------------------------
// Point at local (lx, ly, lz) under transform t, in world space — same
// rotate-scale-translate helper as data/podiumStage.js's own localToWorld.
function localToWorld(t, lx, ly, lz) {
  const cos = Math.cos(t.yaw)
  const sin = Math.sin(t.yaw)
  const sx = lx * t.scale
  const sy = ly * t.scale
  const sz = lz * t.scale
  return [t.x + sx * cos + sz * sin, t.y + sy, t.z - sx * sin + sz * cos]
}

// One crate's own enclosing AABB in world space — its 8 local corners
// (rotated by the crate's OWN yaw, since the nested top crate sits at 45deg)
// each carried through the stack's world transform, then min/maxed. A
// yawed box's true footprint is a rotated square, but Tech.md §5.2's
// kinematic collider only scans axis-aligned boxes, so the enclosing AABB
// (slightly larger than the crate at 45deg) is what's used here, same
// trade-off as every other prop's box collider in this file set.
function crateAabb(instance, transform) {
  const half = CRATE_SIZE / 2
  const cos = Math.cos(instance.yaw)
  const sin = Math.sin(instance.yaw)
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const lx of [-half, half]) {
    for (const lz of [-half, half]) {
      const rx = lx * cos + lz * sin
      const rz = -lx * sin + lz * cos
      for (const ly of [instance.y - half, instance.y + half]) {
        const [wx, wy, wz] = localToWorld(transform, instance.x + rx, ly, instance.z + rz)
        if (wx < min[0]) min[0] = wx
        if (wy < min[1]) min[1] = wy
        if (wz < min[2]) min[2] = wz
        if (wx > max[0]) max[0] = wx
        if (wy > max[1]) max[1] = wy
        if (wz > max[2]) max[2] = wz
      }
    }
  }
  return { min: { x: min[0], y: min[1], z: min[2] }, max: { x: max[0], y: max[1], z: max[2] } }
}

// The collider for the hub placement — data/hub.js spreads this into
// HUB_AABBS, the same way PODIUM_STAGE_HUB_AABBS is.
export const WOOD_CRATE_AABBS = CRATE_INSTANCES.map((c) => crateAabb(c, WOOD_CRATE_TRANSFORM))
