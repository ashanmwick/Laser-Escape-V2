// Data for the 160 `grass_block_dirt.NNN` prop instances (Tech.md §4),
// collection `grass_block_new` in the .blend (objects .001-.045 and
// .047-.161; .046 is not in the collection — it sits alone in the scene
// root at x≈-106 as the material/mesh donor, see below) — a long lane
// border running both sides of the track from x≈-35 to x≈1636, in three
// bands: an inner low kerb (.001-.045, mixed scales, x≈-35..575), a
// uniform running border past it (.047-.078, yaw π/2, x≈637..1565), and a
// raised outer double-row that alternates a mid wall with a taller back
// wall (.079-.160, yaw 0, x≈134..1596). .161 is a far end cap turned
// yaw -π/2, wide enough to close the gap between the two sides.
//
// Every object in the collection is a duplicate of `grass_block_dirt.001`
// and differs only in its own transform (verified against the .blend: all
// 160 object bound boxes are the identical block, -0.525..0.525 on X/Y and
// -0.5..0.5 on Z-up/Blender-Z, 24 verts / 18 polys). So all 160 share one
// exported mesh (`grass_block_dirt.glb`, built from the donor
// grass_block_dirt.046 at an identity transform: location/rotation/scale
// zeroed before export, so the glTF holds the ~1m local block shape — a
// dirt body plus a grass cap — and nothing else). This import only grew
// the instance list (77 -> 160); the mesh is unchanged, so the .glb was
// not re-exported.
//
// grass_block_dirt.046 supplies the material for all 160 (per the import
// instruction). The .blend carries a per-instance-duplicated material pair
// on every object (`grass_block_dirt_mat.NNN` / `grass_block_grass_mat.NNN`
// — 85 identical pairs); exporting from one donor collapses that to the 2
// the glTF carries, and propModel.js's convertMaterial() does the
// PBR -> Lambert conversion generically at load (Tech.md §7), same as every
// other imported prop. That pair of steps is the whole "optimize the
// material" step — no Blender render/bake was run; this is an import only.
//
// Kept as exact as-authored transforms (no zFit) per the import
// instruction — same precedent as data/wallProps.js and data/glowFloorPanel.js.
export const GRASS_BLOCK_MODEL_URL = '/models/grass_block_dirt.glb'

// Raw Blender transform per object, read directly off grass_block_dirt.001
// through .161 (skipping .046, the donor): location, yaw (rotation around
// Blender's Z axis — every instance's rotation_euler.x/y is exactly 0, only
// Z ever rotates, to one of 0 / ±π/2) and scale. Non-uniform and
// per-instance — this border's blocks vary in both footprint and height.
const RAW = [
  // --- band one: grass_block_dirt.001 .. .045 — inner low kerb, x≈-35..575
  { location: [-35.214493, -25.522144, 5.336075], yaw: 1.570796, scale: [54.543262, 22.272581, 22.191719] },
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
  { location: [102.927322, 33.746742, 16.882303], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [15.601585, -32.141685, 4.789442], yaw: 0, scale: [22.491165, 10.001233, 9.964924] },
  { location: [-8.728882, 37.719105, 5.336075], yaw: 0, scale: [27.996086, 11.43212, 11.390615] },
  { location: [102.927322, -42.173649, 17.121738], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [134.643509, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [134.643509, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [197.492233, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [197.492233, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [165.776047, -43.011505, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [165.776047, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [260.931091, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [260.931091, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [229.21489, -43.011505, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [229.21489, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [291.674133, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [291.674133, -43.011505, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [323.39032, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [323.39032, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [354.133362, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [354.133362, -43.011505, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [385.849548, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [385.849548, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [417.22995, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [417.22995, -43.011505, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [448.946167, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [448.946167, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [480.255707, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [480.255707, -43.011505, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [511.971924, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [511.971924, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [543.281494, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [543.281494, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [574.997681, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [574.997681, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },

  // --- band two: grass_block_dirt.047 .. .078 — uniform running border, x≈637..1565
  { location: [637.440247, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [637.440247, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [700.092285, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [700.092285, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [762.744385, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [762.744385, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [825.009705, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [825.009705, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [886.501587, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [886.501587, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [947.637573, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [947.637573, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1010.568115, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1010.568115, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1072.095215, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1072.095215, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1133.043213, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1133.043213, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1195.595093, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1195.595093, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1256.542969, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1256.542969, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1317.490845, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1317.490845, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1380.042725, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1380.042725, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1440.990601, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1440.990601, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1503.005249, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1503.005249, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1564.766235, 25.027731, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },
  { location: [1564.766235, -32.479267, 5.336075], yaw: 1.570796, scale: [30.777733, 14.738917, 14.685409] },

  // --- band three: grass_block_dirt.079 .. .160 — raised outer double-row
  // (back wall scale [32.5, 22.2, 22.1] at z≈22.45, y ±(51.9 / -60.1);
  // mid wall scale [45.8, 14.7, 14.7] at z≈19.10, y ±(32.6 / -40.9)), x≈134..1596
  { location: [134.437454, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [134.437454, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [194.619888, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [194.619888, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [259.918274, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [259.918274, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [320.388123, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [320.388123, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [381.777771, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [381.777771, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [449.130432, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [449.130432, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [510.178802, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [510.178802, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [573.174866, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [573.174866, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [606.277527, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [606.277527, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [668.906372, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [668.906372, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [635.803711, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [635.803711, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [731.213562, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [731.213562, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [698.110901, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [698.110901, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [759.80835, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [759.80835, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [792.911011, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [792.911011, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [854.33728, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [854.33728, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [821.234619, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [821.234619, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [884.113525, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [884.113525, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [917.216187, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [917.216187, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [979.699585, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [979.699585, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [946.596924, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [946.596924, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1008.684937, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1008.684937, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1041.787598, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1041.787598, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1102.293701, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1102.293701, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1069.19104, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1069.19104, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1130.488037, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1130.488037, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1163.590698, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1163.590698, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1227.260498, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1227.260498, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1194.157837, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1194.157837, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1254.268433, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1254.268433, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1287.371094, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1287.371094, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1347.086304, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1347.086304, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1313.983643, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1313.983643, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1376.071655, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1376.071655, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1409.174316, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1409.174316, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1473.948608, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1473.948608, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1440.845947, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1440.845947, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1503.516113, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1503.516113, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1536.618774, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1536.618774, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1595.741943, 32.604839, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1595.741943, -40.894867, 19.09866], yaw: 0, scale: [45.756023, 14.738917, 14.685409] },
  { location: [1562.639282, 51.933468, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },
  { location: [1562.639282, -60.139683, 22.44809], yaw: 0, scale: [32.497292, 22.222477, 22.141796] },

  // --- far end cap: grass_block_dirt.161 — turned yaw -π/2, spans the gap
  { location: [1636.112305, -3.646088, 24.369425], yaw: -1.570796, scale: [86.387573, 27.827141, 27.726116] },
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

// Object-space (local, pre-scale) box shared by all 160 — object.bound_box,
// identical across the set (see the file header).
const LOCAL_MIN = { x: -0.525, y: -0.525, z: -0.5 }
const LOCAL_MAX = { x: 0.525, y: 0.525, z: 0.5 }

// World-space { min, max } AABBs for the kinematic collider (Tech.md §5.2)
// — each block is a solid object, so its box IS its collider, same as the
// building blocks, both podiums and the walls (data/hub.js). The min/max is
// taken over all 8 corners rather than assumed, since toThree's axis remap
// plus each instance's own yaw both permute which local axis ends up where.
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
