// Data for the 45 `grass_block_dirt.NNN` prop instances (Tech.md §4),
// collection `grass_block_new` in the .blend — a long lane border running
// both sides of the track from x≈-35 to x≈575. All 45 share one exported
// mesh (`grass_block_dirt.glb`, built from grass_block_dirt.046 at an
// identity transform: location/rotation/scale zeroed before export, so the
// glTF holds the ~1m local block shape and nothing else) and differ only in
// each instance's own transform — the import instruction's "duplicate of
// grass_block_dirt.001, only the transform differs" holds for the outer
// footprint every instance shares (verified against the .blend: all 45
// bound boxes are identical, -0.525..0.525 on X/Z and -0.5..0.5 on Y-up/Z
// pre-remap); only a few interior cap vertices vary instance to instance,
// which one shared render mesh intentionally discards — Tech.md §6 caps
// prop tris at 500 and this is a background border, so that's the right
// trade, not a shortcut.
//
// grass_block_dirt.046 supplies the material for all 45 (per the import
// instruction) — its two baked textures are already the smaller 256² pair
// (vs. the 512² pair authored on .001-.045), so reusing them **is** the
// "optimize the material" step, on top of collapsing 45 duplicate material
// datablocks down to the 2 that .046 already carried. propModel.js's
// convertMaterial() does the PBR -> Lambert conversion generically at load,
// same as every other imported prop (Tech.md §7).
//
// Kept as exact as-authored transforms (no zFit) per the import
// instruction — same precedent as data/wallProps.js and data/glowFloorPanel.js.
export const GRASS_BLOCK_MODEL_URL = '/models/grass_block_dirt.glb'

// Raw Blender transform per object, read directly off grass_block_dirt.001
// through .045: location, yaw (rotation around Blender's Z axis — every
// instance's rotation_euler.x/y is exactly 0, only Z ever rotates) and
// scale. Non-uniform and per-instance, unlike wallProps.js's one shared
// scale — this border's blocks vary in both footprint and height.
const RAW = [
  { location: [-35.214493, -39.446613, 5.336075], yaw: 1.570796, scale: [54.543262, 22.272581, 22.191719] },
  { location: [-11.11717, -34.947086, 5.336075], yaw: 0, scale: [25.708996, 11.432119, 11.390615] },
  { location: [-35.214493, 32.19762, 5.336075], yaw: 1.570796, scale: [54.543262, 22.272581, 22.191719] },
  { location: [48.558731, 34.816277, 5.336075], yaw: 0, scale: [27.996086, 11.43212, 11.390615] },
  { location: [18.283009, 52.425579, 5.336075], yaw: 0, scale: [58.554039, 23.91037, 23.823561] },
  { location: [18.283009, -49.34483, 5.336075], yaw: 0, scale: [54.543262, 22.272581, 22.191719] },
  { location: [71.179611, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [71.179611, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [48.558731, -32.290203, 5.336075], yaw: 0, scale: [27.996086, 11.43212, 11.390615] },
  { location: [15.991965, 28.380663, 4.706303], yaw: 0, scale: [20.987415, 8.570149, 8.539035] },
  { location: [35.709614, 24.980011, 3.415384], yaw: 0, scale: [17.6152, 7.193115, 7.167] },
  { location: [102.927322, 28.869717, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [15.601585, -32.141685, 4.789442], yaw: 0, scale: [22.491165, 10.001233, 9.964924] },
  { location: [-8.728882, 37.719105, 5.336075], yaw: 0, scale: [27.996086, 11.43212, 11.390615] },
  { location: [102.927322, -32.45974, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [134.643509, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [134.643509, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [197.492233, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [197.492233, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [165.776047, -32.45974, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [165.776047, 28.869717, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [260.931091, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [260.931091, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [229.21489, -32.45974, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [229.21489, 28.869717, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [291.674133, 28.869717, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [291.674133, -32.45974, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [323.39032, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [323.39032, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [354.133362, 28.869717, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [354.133362, -32.45974, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [385.849548, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [385.849548, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [417.22995, 28.869717, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [417.22995, -32.45974, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [448.946167, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [448.946167, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [480.255707, 28.869717, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [480.255707, -32.45974, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [511.971924, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [511.971924, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [543.281494, 28.869717, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [543.281494, -32.45974, 5.336075], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [574.997681, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [574.997681, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
]

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own
// convention (same remap as data/podium.js / data/wallProps.js): three.x =
// blender.x, three.y = blender.z, three.z = -blender.y.
function toThree(bx, by, bz) {
  return [bx, bz, -by]
}

// Rotates a local (x, y) point by `yaw` around the up axis — the same angle
// whether read as a turn around Blender's Z or three.js's Y (data/podium.js).
function rotateYaw(yaw, x, y) {
  const cos = Math.cos(yaw)
  const sin = Math.sin(yaw)
  return [x * cos - y * sin, x * sin + y * cos]
}

// Composes Blender's own transform order (scale, then rotate, then
// translate) for one local point, then remaps to three.js space. `local` is
// in the block's own pre-scale unit space (the exported mesh's own extent).
function worldPoint(r, lx, ly, lz) {
  const [rx, ry] = rotateYaw(r.yaw, lx * r.scale[0], ly * r.scale[1])
  const bx = r.location[0] + rx
  const by = r.location[1] + ry
  const bz = r.location[2] + lz * r.scale[2]
  return toThree(bx, by, bz)
}

// The transform each instance's InstancedMesh matrix is composed from
// (GrassBlocks.jsx): world position, yaw around three.js's Y (unchanged
// across the remap, per data/podium.js), and scale remapped the same way
// as position — three.x = blender.x, three.y = blender.z, three.z = blender.y.
export const GRASS_BLOCK_INSTANCES = RAW.map((r) => ({
  position: worldPoint(r, 0, 0, 0),
  rotationY: r.yaw,
  scale: [r.scale[0], r.scale[2], r.scale[1]],
}))

// Object-space (local, pre-scale) box shared by all 45 — object.bound_box,
// identical across the set even though a few interior cap vertices differ
// (see the file header).
const LOCAL_MIN = { x: -0.525, y: -0.525, z: -0.5 }
const LOCAL_MAX = { x: 0.525, y: 0.525, z: 0.5 }

// World-space { min, max } AABBs for the kinematic collider (Tech.md §5.2)
// — each block is a solid object, so its box IS its collider, same as the
// building blocks, both podiums and the ten walls (data/hub.js). The min/max
// is taken over all 8 corners rather than assumed, since toThree's axis
// remap plus each instance's own yaw both permute which local axis ends up
// where.
function worldAabb(r) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const lx of [LOCAL_MIN.x, LOCAL_MAX.x]) {
    for (const ly of [LOCAL_MIN.y, LOCAL_MAX.y]) {
      for (const lz of [LOCAL_MIN.z, LOCAL_MAX.z]) {
        const p = worldPoint(r, lx, ly, lz)
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

export const GRASS_BLOCK_AABBS = RAW.map(worldAabb)
