// Data for the Blender-authored `tree_pine_knot` prop — exported from
// World.blend's `tree_new` collection, object `tree_pine_knot.001` (a
// duplicate of the reusable `tree_pine_knot` template parented under the
// `tree_pine_stack` empty). The export duplicated that template at its
// authored scale=1, applied its transform, and joined its four material
// slots (a small reddish "knot" material for cut branch stumps, bark, and
// two leaf-clump shades — dark/bright, same "baked shading" trick as the
// other tree) into one 204-tri mesh, comfortably under the <500 tri/prop
// budget, at real-world scale (~4.54 m tall). Converts straight to
// MeshStandardMaterial per material at the propModel.js load boundary, same
// as every other Blender prop here.
//
// public/models/tree_pine_knot.glb (mirrored into dist/models/ for the
// built site, same as every other prop glb).
export const TREE_PINE_MODEL_URL = '/models/tree_pine_knot.glb'

// --- placement -------------------------------------------------------------
// Every object named tree_pine_knot(.NNN) in World.blend, read via the
// Blender MCP connection (obj.matrix_world per object), same approach as
// data/tree.js TREE_TRANSFORMS: 3 objects total.
//   - tree_pine_knot is the reusable template itself, parented to the
//     `tree_pine_stack` empty at world [20,0,0]. Included as-is, same call
//     data/tree.js makes for its own template instances.
//   - .001 and .002 sit in the `tree_new` collection — real scattered
//     instances, each its own position/scale, no parent.
// None of the 3 carry any rotation (world_rotation_euler is [0,0,0] on every
// one), so yaw is 0 throughout.
//
// Conversion: three.x = blender.world_x, three.z = -blender.world_y, same
// remap as data/tree.js / data/pvpWall.js / data/wallProps.js. `y` (ground
// height) is fixed at 0 for all of them rather than carrying over
// blender.world_z, for the same reason data/tree.js does: this game's
// Ground.jsx renders a flat plane at y=0.
//
// `scale` is each object's own world_scale (uniform on every axis) — .001
// and .002 are ~5x blown-up for a big-canopy backdrop look, same idea as
// data/tree.js's own oversized background instances; the template carries
// its authored real-world scale (1).
export const TREE_PINE_TRANSFORMS = [
  { x: 39.787025451660156, y: 11, z: -34.56736373901367, yaw: 0, scale: 5.0766801834106445 }, // .001
  { x: -0.04659271240234375, y: 11, z: 52.628944396972656, yaw: 0, scale: 5.0766801834106445 }, // .002
]
