// Data for the 51 `grass_block_cube` prop instances (Tech.md §4), collection
// `grass_block` in the .blend — a second lane border, mounted alongside the
// `grass_block_dirt` one (data/grassBlocks.js) rather than replacing it.
//
// Every object in the collection is a duplicate of `grass_block_cube` and
// differs only in its own transform (verified against the .blend: all 51
// object bound boxes are the identical unit cube, -0.5..0.5 on every axis).
// So all 51 share one exported mesh — `grass_block_cube.glb`, written from
// `grass_block_cube` with location/rotation zeroed and scale reset to 1, so
// the glTF holds only the ~1m local block (two primitives: a dirt body for
// the lower 80% and a grass cap for the top 20%) and nothing else. Same
// pipeline as grass_block_dirt.glb.
//
// The two source materials (`grass_block_cube_dirt_mat`,
// `grass_block_cube_grass_mat`) arrive per-instance-duplicated in the .blend
// (102 datablocks, all identical to those two). Exporting from one donor
// collapses that to the 2 the glTF carries, and propModel.js's
// convertMaterial() does the PBR -> Lambert conversion at load (Tech.md §7),
// same as every other imported prop — that pair is the whole "optimize the
// material" step. No Blender render/bake was run; this is an import only.
//
// Kept as exact as-authored transforms (no zFit) per the import instruction
// — same precedent as data/grassBlocks.js, data/wallProps.js and
// data/glowFloorPanel.js.
export const GRASS_BLOCK_CUBE_MODEL_URL = '/models/grass_block_cube.glb'

// Raw Blender transform per object, read directly off grass_block_cube and
// grass_block_cube.001 .. .050: location, yaw (rotation around Blender's Z
// axis — every instance's rotation_euler.x/y is exactly 0) and scale.
// 50 blocks run the border in pairs down the two sides of the track
// (y 21.970417 / -29.578068), stepping X from ~103 to ~1596 on the shared
// scale [50.005592, 10, 12.869711]; the last one is an end cap turned
// yaw -pi/2 with a longer X scale so it spans the gap between the two rows.
const RAW = [
  { location: [102.813354, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [102.813354, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [165.914902, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [165.914902, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [228.9543, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [228.9543, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [293.299225, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [293.299225, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [545.067749, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [545.067749, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [480.722839, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [480.722839, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [417.683411, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [417.683411, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [354.581879, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [354.581879, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [607.510315, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [607.510315, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [670.162354, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [670.162354, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [732.814453, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [732.814453, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [795.079773, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [795.079773, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [856.571655, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [856.571655, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [917.707642, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [917.707642, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [980.638184, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [980.638184, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1042.165283, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1042.165283, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1103.113281, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1103.113281, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1165.665161, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1165.665161, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1226.613037, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1226.613037, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1287.560913, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1287.560913, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1350.112793, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1350.112793, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1411.060669, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1411.060669, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1473.075317, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1473.075317, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1534.836304, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1534.836304, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1596.437866, 21.970417, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1596.437866, -29.578068, 6.170032], yaw: 0, scale: [50.005592, 10, 12.869711] },
  { location: [1625.968262, -3.674243, 6.170032], yaw: -1.570796, scale: [61.287884, 10, 12.869711] },
]

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own convention
// (same remap as data/grassBlocks.js / data/podium.js): three.x = blender.x,
// three.y = blender.z, three.z = -blender.y.
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

// Composes Blender's own transform order (scale, then rotate around Z, then
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
// (GrassBlockCubes.jsx): world position, yaw around three.js's Y (unchanged
// across the remap, per data/podium.js), and scale remapped the same way as
// position — three.x = blender.x, three.y = blender.z, three.z = blender.y.
export const GRASS_BLOCK_CUBE_INSTANCES = RAW.map((r) => ({
  position: worldPoint(r, 0, 0, 0),
  rotationY: r.yaw,
  scale: [r.scale[0], r.scale[2], r.scale[1]],
}))

// Object-space (local, pre-scale) box — object.bound_box, the unit cube
// shared by all 51 and matching the exported glTF's own POSITION bounds.
const LOCAL_MIN = { x: -0.5, y: -0.5, z: -0.5 }
const LOCAL_MAX = { x: 0.5, y: 0.5, z: 0.5 }

// World-space { min, max } AABBs for the kinematic collider (Tech.md §5.2) —
// each block is a solid object, so its box IS its collider, same as the
// building blocks, the grass_block_dirt border and the walls (data/hub.js).
// The min/max is taken over all 8 corners rather than assumed, since toThree's
// axis remap plus each instance's own yaw both permute which local axis ends
// up where.
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

export const GRASS_BLOCK_CUBE_AABBS = RAW.map(worldAabb)
