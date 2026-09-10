// Data for the `merchant_shop` prop — the "AURA" LEGO-style crystal stall
// (Tech.md §4: every tunable number lives here, never in a component).
//
// Unlike the Blender-authored props (Tech.md §6) this one is generated in
// code: systems/merchantShopModel.js reads the tables below and merges a
// pile of box / cylinder / cone primitives into ONE MeshLambertMaterial mesh
// per colour, matrixAutoUpdate off (Tech.md §7 — "static and unique is
// merged into one geometry per material"). components/MerchantShop.jsx just
// mounts that root next to the target podium.
//
// The model is authored in its own local space: origin at the baseplate
// centre, +Y up, +Z is the shop *front* (counter, awning, sign face, the
// side the merchant looks out from). SHOP_TRANSFORM turns and drops it into
// world space beside data/podium.js's TARGET_PODIUM_POSITION (≈ world
// [13.57, 0, 17.85], footprint ≈ ±11 X by ±7 Z). The shop sits just east of
// that footprint, front turned back toward the hub so a player climbing the
// target podium's stairs walks past its counter.

// --- placement -------------------------------------------------------------
// World transform of the local model. yaw is a rotation about +Y (radians):
// -PI/2 turns local +Z (the front) to face world -X, i.e. back toward the
// podium stairs and the hub beyond.
export const SHOP_TRANSFORM = {
  x: 50,
  y: 0,
  z: 20,
  yaw: -Math.PI / 2,
  scale: 1,
}

// --- palette (sRGB hex; one MeshLambertMaterial each) ---------------------
// "basic diffuse/roughness" from the brief collapses to flat Lambert here:
// Tech.md §7 permits only Lambert/Basic (no MeshStandardMaterial), and against
// this scene's baked, shadowless lighting a roughness channel buys nothing.
export const SHOP_COLORS = {
  baseGray: '#8b9199', // modular baseplate + its studs
  wood: '#8a5a2b', // pillars, roof frame, gable planks, crate, chest
  woodLight: '#a9713b', // counter top, sign board face
  woodDark: '#5b3a1c', // pillar notches, chest/crate trim, railings
  trouser: '#6b4a2f', // merchant trousers
  purple: '#7b3fc4', // roof tiles, awning stripe
  white: '#eef0f2', // awning stripe, "AURA" block letters
  skin: '#e7b088', // merchant head + hands
  shirt: '#2f6fd0', // merchant shirt + sleeves
  gold: '#e7b53a', // coins (crate fill + the one in his hand)
  faceDark: '#3a2a1a', // eyes + mouth
  crystalCyan: '#7fe6e0',
  crystalMagenta: '#e88fd0',
  crystalWhite: '#e9ecff',
}

// Translucent wares — Lambert with opacity, drawn last, depthWrite off so the
// shards in a cluster don't punch holes in each other.
export const CRYSTAL_OPACITY = 0.55

// --- structure -----------------------------------------------------------
export const BASEPLATE = {
  size: 6.4, // 16 studs @ 0.4
  height: 0.3,
  studPitch: 0.4,
  studCount: 16,
  studRadius: 0.12,
  studHeight: 0.12,
  studSegments: 8,
}

// Four notched corner pillars. `inset` is the pillar-centre offset from the
// baseplate centre on both X and Z; notches are the small dark cubes ringing
// each pillar at every `notchStep` up its height (the "notched brown wood").
export const PILLARS = {
  inset: 2.6,
  section: 0.7,
  base: 0.3, // sits on the baseplate top
  top: 4.5,
  notchStep: 0.75,
  notchSize: 0.16,
}

// Front counter: a solid plank box spanning the two front pillars with an
// overhanging top shelf the wares sit on.
export const COUNTER = {
  z: 2.3,
  width: 5.6,
  bodyTop: 1.6,
  base: 0.3,
  depth: 0.7,
  lipWidth: 6.0,
  lipDepth: 0.95,
  lipThickness: 0.18,
}

// Low side + back railings (two horizontal bars each, on posts).
export const RAILINGS = {
  height: 1.15,
  barThickness: 0.14,
  inset: 2.45, // from centre, matches the pillar inner faces
  backZ: -2.4,
}

// Interior floor plate the merchant + chest + crate stand on.
export const INTERIOR_FLOOR = { width: 4.6, depth: 4.2, top: 0.42, z: -0.15 }

// --- roof + sign -------------------------------------------------------
// Gable roof: a ridge running along X at `ridgeY`, two purple slabs sloping
// down to the eaves at ±`eaveZ` / `eaveY`. Stud rows are dotted across each
// slab. Triangular gable-end panels (planked brown) close the ±X ends.
export const ROOF = {
  ridgeY: 6.2,
  eaveY: 4.7,
  eaveZ: 3.6,
  overhangX: 3.9, // half-span of the slabs in X (past the pillars)
  slabThickness: 0.26,
  studRows: 5,
  studCols: 7,
  studRadius: 0.13,
  studHeight: 0.12,
}

// Front awning: a shorter, steeper valance clipped to the front eave, split
// into alternating purple / white vertical stripe boxes.
export const AWNING = {
  stripes: 10,
  totalWidth: 6.4,
  drop: 1.0, // vertical fall of the valance
  reach: 0.75, // how far it juts forward in Z
  topY: 4.75,
  topZ: 3.5,
  thickness: 0.16,
}

// Octagonal sign board mounted on the roof ridge, face square to +Z. Built as
// an 8-gon prism (cylinder, 8 segments) laid flat by a rotateX then spun about
// its own face normal by `spin` so a flat edge sits at the top (no yaw skew).
// A recessed lighter face disc, a ring of border studs, and the block letters
// proud of it. `y` puts the board's lower points about at ridge height so it
// reads as sitting on the roof.
export const SIGN = {
  y: 7.7,
  z: 0.55,
  radius: 3.0, // circumradius (to the 8 points)
  thickness: 0.5,
  spin: Math.PI / 8, // 22.5° — turns a flat edge to the top
  faceRadius: 2.6, // recessed lighter panel
  faceInset: 0.03,
  faceThickness: 0.08,
  borderStuds: 24,
  borderStudRadius: 0.15,
  borderStudHeight: 0.13,
  borderRadius: 2.55,
}

// "AURA" in bold white 3D block letters, proud of the sign face. Each glyph is
// a 4-wide x 5-tall cell grid; `1` = a filled white cube. cell + gap are sized
// so the four glyphs span most of the face disc without overhanging it:
//   width = 4*(4*cell) + 3*gap = 4.6  <  face disc across-flats (~4.8).
export const SIGN_TEXT = {
  cell: 0.25,
  depth: 0.22,
  gap: 0.2,
  standoff: 0.2, // in front of the sign face
  glyphs: {
    A: [
      [0, 1, 1, 0],
      [1, 0, 0, 1],
      [1, 1, 1, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
    ],
    U: [
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [0, 1, 1, 0],
    ],
    R: [
      [1, 1, 1, 0],
      [1, 0, 0, 1],
      [1, 1, 1, 0],
      [1, 0, 1, 0],
      [1, 0, 0, 1],
    ],
  },
  word: ['A', 'U', 'R', 'A'],
}

// --- props ------------------------------------------------------------
// A wooden chest with its lid flipped open, back-left of the interior.
export const CHEST = {
  x: -1.35,
  z: -1.35,
  base: 0.42,
  width: 1.1,
  height: 0.72,
  depth: 0.78,
  lidThickness: 0.16,
  lidOpen: 2.0, // radians the lid is rotated back about its rear hinge
}

// A crate of gold coins, back-right.
export const CRATE = {
  x: 1.45,
  z: -1.2,
  base: 0.42,
  size: 1.0,
  wall: 0.12,
  height: 0.7,
  coin: { radius: 0.17, height: 0.05, count: 9, segments: 12 },
}

// Floor bin in front of the counter, brimming with crystal shards.
export const FRONT_BIN = {
  z: 3.05,
  base: 0,
  width: 1.5,
  height: 0.62,
  depth: 0.82,
  wall: 0.12,
}

// Crystal clusters: faceted cones (low radial segment count). Each entry is a
// cluster anchor; `shards` are local offsets + size + tint within it.
const shard = (x, y, z, r, h, tilt, tint) => ({ x, y, z, r, h, tilt, tint })
export const CRYSTALS = [
  // left end of the counter shelf
  {
    at: [-1.9, 1.78, 2.15],
    shards: [
      shard(0, 0.32, 0, 0.16, 0.72, 0.0, 'crystalCyan'),
      shard(0.22, 0.24, 0.05, 0.13, 0.52, 0.35, 'crystalWhite'),
      shard(-0.2, 0.2, -0.04, 0.12, 0.46, -0.3, 'crystalMagenta'),
      shard(0.05, 0.16, 0.2, 0.1, 0.36, 0.15, 'crystalCyan'),
    ],
  },
  // right end of the counter shelf
  {
    at: [1.85, 1.78, 2.15],
    shards: [
      shard(0, 0.3, 0, 0.15, 0.66, 0.0, 'crystalMagenta'),
      shard(-0.22, 0.22, 0.03, 0.12, 0.48, -0.32, 'crystalCyan'),
      shard(0.2, 0.2, -0.05, 0.12, 0.44, 0.34, 'crystalWhite'),
    ],
  },
  // heaped in the front floor bin
  {
    at: [0, 0.55, 3.05],
    shards: [
      shard(-0.35, 0.24, 0, 0.16, 0.6, -0.4, 'crystalCyan'),
      shard(0, 0.32, 0.05, 0.18, 0.74, 0.05, 'crystalWhite'),
      shard(0.36, 0.24, -0.03, 0.15, 0.56, 0.42, 'crystalMagenta'),
      shard(0.1, 0.2, 0.24, 0.12, 0.44, 0.2, 'crystalCyan'),
      shard(-0.15, 0.18, -0.22, 0.11, 0.4, -0.25, 'crystalMagenta'),
    ],
  },
]

// --- merchant character ------------------------------------------------
// Stylized cube figure behind the counter, facing +Z, offset a touch left so
// the wares on the right side of the shelf stay visible.
export const MERCHANT = {
  x: -0.35,
  z: -0.35,
  floor: 0.42, // stands on the interior floor plate
  legs: { width: 0.72, height: 0.8, depth: 0.5 },
  torso: { width: 0.86, height: 0.92, depth: 0.56 },
  arm: { width: 0.22, height: 0.82, depth: 0.28 },
  hand: 0.22,
  head: 0.6,
  // right arm swings forward to present a coin; left hangs straight.
  rightArmPitch: -1.15,
  coin: { radius: 0.24, height: 0.06, segments: 16 },
  face: { eyeSize: 0.07, mouthWidth: 0.2, mouthHeight: 0.05 },
}

// --- collider ---------------------------------------------------------
// The stall is a solid prop, so the collider is ONE box around its whole
// footprint (Tech.md §5.2 — the kinematic capsule scans a flat AABB list; one
// more box is nothing). SHOP_BOUNDS is that box in local space, half-extents
// about the baseplate centre (the model origin). Defaults enclose the
// baseplate, pillars, counter and front bin; the roof/sign overhang above
// head height is left out on purpose. Loosen or tighten by editing these.
export const SHOP_BOUNDS = {
  cx: 0,
  cy: 2.5, // centre height -> box spans y 0 .. 5.0
  cz: 0,
  hx: 3.3, // ~baseplate half-width + a hair
  hy: 2.5,
  hz: 3.5, // baseplate half-depth + the front bin
}

// Transform SHOP_BOUNDS through SHOP_TRANSFORM (scale, yaw about +Y, then
// translate) and return the enclosing world AABB. Returned as a one-element
// array so data/hub.js can keep spreading it into HUB_AABBS unchanged. At a
// 0 / ±90 / 180 yaw the result is exact; at other angles it is the enclosing
// box of the turned footprint (a little loose — fine for a kinematic scan).
export function buildMerchantShopAabbs(t = SHOP_TRANSFORM) {
  const cos = Math.cos(t.yaw)
  const sin = Math.sin(t.yaw)
  const b = SHOP_BOUNDS
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const lx = (b.cx + sx * b.hx) * t.scale
        const ly = (b.cy + sy * b.hy) * t.scale
        const lz = (b.cz + sz * b.hz) * t.scale
        const p = [t.x + lx * cos + lz * sin, t.y + ly, t.z - lx * sin + lz * cos]
        for (let i = 0; i < 3; i++) {
          if (p[i] < min[i]) min[i] = p[i]
          if (p[i] > max[i]) max[i] = p[i]
        }
      }
    }
  }
  return [{ min: { x: min[0], y: min[1], z: min[2] }, max: { x: max[0], y: max[1], z: max[2] } }]
}

export const MERCHANT_SHOP_AABBS = buildMerchantShopAabbs()
