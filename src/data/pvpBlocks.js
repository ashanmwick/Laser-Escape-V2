// Data for the `Pvp` collection in the .blend (Tech.md §4) — a separate
// cluster of 46 objects (40 `grass_block_dirt.NNN`, 6 `grass_block_cube.NNN`)
// west of the main hub, laid out for a PvP area. Verified against the .blend:
// every object's bound box matches its donor exactly — the 40 dirt objects
// against grass_block_dirt.014 and grass_block_dirt.005 (±0.525 X/Y, ±0.5 Z,
// 24 verts/18 polys, same as every object in data/grassBlocks.js), and the 6
// cube objects against grass_block_cube (±0.5 unit cube, 12 polys, same as
// data/grassBlockCubes.js). Per the import instruction, this collection is
// transforms only — no new mesh or material, so this file holds nothing but
// placements; components/GrassBlocks.jsx and components/GrassBlockCubes.jsx
// both take an `instances` prop precisely so this second placement list can
// reuse their geometry/material-build code unchanged (both are fully
// code-generated now — see Tech.md's amendment note — so there's no shared
// glTF url to reuse either, only the shape/colour constants each component
// already owns).
//
// Same as grass_block_dirt/.cube elsewhere: rotation_euler.x/y is 0 on every
// object, only Z (yaw) ever rotates, to one of 0 / -π/2. Kept as
// exact as-authored transforms (no zFit), same precedent as
// data/grassBlocks.js and data/grassBlockCubes.js.

// Raw Blender transform per dirt object, read directly off grass_block_dirt
// .011, .013, .162-.199 (collection `Pvp`): location, yaw, scale.
const RAW_DIRT = [
  { location: [-48.715382, -35.583225, 5.336075], yaw: 0, scale: [25.708996, 11.432119, 11.390615] },
  { location: [-89.805969, -35.583225, 5.336075], yaw: 0, scale: [25.708996, 11.432119, 11.390615] },
  { location: [-119.748138, -35.583225, 5.336075], yaw: 0, scale: [25.708996, 11.432119, 11.390615] },
  { location: [-120.065994, 46.93681, 7.663084], yaw: 0, scale: [25.708996, 11.432119, 11.390615] },
  { location: [-90.282753, 44.280415, 5.550862], yaw: 0, scale: [25.708996, 11.432119, 11.390615] },
  { location: [-46.402, 44.280415, 3.943976], yaw: 0, scale: [25.708996, 11.432119, 11.390615] },
  { location: [-138.819595, 30.372227, 5.336075], yaw: -1.570796, scale: [25.708996, 11.432119, 11.390615] },
  { location: [-138.819595, -21.279636, 5.336075], yaw: -1.570796, scale: [25.708996, 11.432119, 11.390615] },
  { location: [-138.819595, 4.784687, 4.637313], yaw: -1.570796, scale: [22.040686, 9.800918, 9.765335] },
  { location: [-130.911438, -7.536753, 3.500827], yaw: -1.570796, scale: [18.959419, 8.430759, 8.400151] },
  { location: [-129.531311, 19.927992, 3.32264], yaw: -1.570796, scale: [19.475002, 8.660026, 8.628585] },
  { location: [-104.264076, -26.091644, 3.85062], yaw: 0, scale: [19.847481, 8.825656, 8.793614] },
  { location: [-70.30761, -26.091644, 4.150739], yaw: 0, scale: [19.847481, 8.825656, 8.793614] },
  { location: [-67.949516, 36.156284, 2.530332], yaw: 0, scale: [19.847481, 8.825656, 8.793614] },
  { location: [-105.01899, 37.749615, 2.756587], yaw: 0, scale: [19.847481, 8.825656, 8.793614] },
  { location: [-107.118851, -32.242058, 12.924863], yaw: 0, scale: [15.536207, 6.908545, 6.883464] },
  { location: [-70.879486, -33.06279, 13.121493], yaw: 0, scale: [18.935001, 8.419901, 8.389332] },
  { location: [-43.540787, -25.979897, 2.988917], yaw: 0, scale: [18.719397, 8.324026, 8.293807] },
  { location: [-88.044792, -20.168152, 3.411428], yaw: 0, scale: [18.719397, 8.324026, 8.293807] },
  { location: [-123.063499, -20.780046, 4.286284], yaw: 0, scale: [21.609407, 9.609138, 9.574254] },
  { location: [-125.29644, 6.277311, 2.305495], yaw: -1.570796, scale: [12.633202, 5.617655, 5.59726] },
  { location: [-124.052246, 33.466515, 3.192569], yaw: 0, scale: [16.785965, 7.464279, 7.43718] },
  { location: [-123.576584, 22.927204, 2.256553], yaw: -1.570796, scale: [12.79136, 5.687984, 5.667333] },
  { location: [-80.259109, -47.79549, 15.387944], yaw: 0, scale: [22.913311, 10.188951, 10.151959] },
  { location: [-98.268059, -39.783691, 15.387944], yaw: 0, scale: [17.453833, 7.761263, 7.733086] },
  { location: [-120.118011, -43.531693, 15.387944], yaw: 0, scale: [23.432255, 10.41971, 10.381882] },
  { location: [-143.790466, -38.286003, 16.872019], yaw: 0, scale: [29.609858, 13.166728, 13.118926] },
  { location: [-146.676682, -21.530254, 15.010069], yaw: -1.570796, scale: [25.708996, 11.432119, 11.390615] },
  { location: [-154.072388, 2.215031, 19.223253], yaw: -1.570796, scale: [28.946287, 12.871658, 12.824926] },
  { location: [-147.465179, 19.750135, 15.010069], yaw: -1.570796, scale: [15.554006, 6.91646, 6.891349] },
  { location: [-147.18074, 38.869247, 15.010069], yaw: -1.570796, scale: [27.195633, 12.093186, 12.049283] },
  { location: [-129.471985, 57.74279, 13.521437], yaw: 0, scale: [24.144146, 10.736271, 10.697293] },
  { location: [-107.421761, 62.608067, 15.764098], yaw: 0, scale: [24.153532, 10.740445, 10.701452] },
  { location: [-85.412132, 53.421444, 13.521437], yaw: 0, scale: [21.406904, 9.519091, 9.484532] },
  { location: [-63.120049, 58.476871, 15.950547], yaw: 0, scale: [25.482605, 11.331449, 11.290311] },
  { location: [-39.684601, 54.554367, 12.527876], yaw: 0, scale: [19.831543, 8.818568, 8.786553] },
  { location: [-59.342064, -40.175385, 12.56768], yaw: 0, scale: [17.666704, 7.855922, 7.827401] },
  { location: [-45.892159, -45.283329, 15.319299], yaw: 0, scale: [20.526869, 9.127763, 9.094624] },
  { location: [-147.465179, 1.452618, 12.177559], yaw: -1.570796, scale: [20.771898, 9.236721, 9.203187] },
  { location: [-108.088417, 53.421444, 12.788402], yaw: 0, scale: [18.435104, 8.197609, 8.167849] },
]

// Raw Blender transform per cube object, read directly off grass_block_cube
// .051-.056 (collection `Pvp`): location, yaw, scale.
const RAW_CUBE = [
  { location: [-70.630638, -45.979507, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [-70.630638, 54.336288, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [-120.2164, 54.336288, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [-120.40712, -45.979507, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [-150.120422, 28.322838, 6.170032], yaw: -1.570796, scale: [50.005592, 10, 12.869711] },
  { location: [-150.120422, -21.262924, 6.170032], yaw: -1.570796, scale: [50.005592, 10, 12.869711] },
]

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own convention
// (same remap as data/grassBlocks.js / data/grassBlockCubes.js): three.x =
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
// translate) for one local point, then remaps to three.js space.
function worldPoint(r, lx, ly, lz) {
  const [rx, ry] = rotateYaw(r.yaw, lx * r.scale[0], ly * r.scale[1])
  const bx = r.location[0] + rx
  const by = r.location[1] + ry
  const bz = r.location[2] + lz * r.scale[2]
  return toThree(bx, by, bz)
}

function toInstances(raw) {
  return raw.map((r) => ({
    position: worldPoint(r, 0, 0, 0),
    rotationY: r.yaw,
    scale: [r.scale[0], r.scale[2], r.scale[1]],
  }))
}

function worldAabb(r, localMin, localMax) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const lx of [localMin.x, localMax.x]) {
    for (const ly of [localMin.y, localMax.y]) {
      for (const lz of [localMin.z, localMax.z]) {
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

// The transform each instance's InstancedMesh matrix is composed from
// (GrassBlocks.jsx / GrassBlockCubes.jsx, both passed this list via their
// `instances` prop): world position, yaw around three.js's Y, and scale
// remapped the same way as position.
export const PVP_DIRT_INSTANCES = toInstances(RAW_DIRT)
export const PVP_CUBE_INSTANCES = toInstances(RAW_CUBE)

// Object-space (local, pre-scale) boxes — object.bound_box, identical across
// each set and matching the donors' own bounds (data/grassBlocks.js,
// data/grassBlockCubes.js).
const DIRT_LOCAL_MIN = { x: -0.525, y: -0.525, z: -0.5 }
const DIRT_LOCAL_MAX = { x: 0.525, y: 0.525, z: 0.5 }
const CUBE_LOCAL_MIN = { x: -0.5, y: -0.5, z: -0.5 }
const CUBE_LOCAL_MAX = { x: 0.5, y: 0.5, z: 0.5 }

// World-space { min, max } AABBs for the kinematic collider (Tech.md §5.2) —
// each block is a solid object, so its box IS its collider, same as every
// other grass block set (data/hub.js).
export const PVP_DIRT_AABBS = RAW_DIRT.map((r) => worldAabb(r, DIRT_LOCAL_MIN, DIRT_LOCAL_MAX))
export const PVP_CUBE_AABBS = RAW_CUBE.map((r) => worldAabb(r, CUBE_LOCAL_MIN, CUBE_LOCAL_MAX))
