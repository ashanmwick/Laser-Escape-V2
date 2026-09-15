// Data for the Blender-authored `tree_lowpoly_canopy_bright` prop (Tech.md
// §6) — exported straight off Blender/World.blend's own scattered
// tree_lowpoly_canopy_bright.004 instance. That scene builds every tree from
// one reusable template (an empty, "tree_lowpoly", parenting
// tree_lowpoly_trunk + tree_lowpoly_canopy_bright + tree_lowpoly_canopy_dark)
// which gets duplicated and rescaled around the map; the export joined that
// same template's three parts into one 246-tri mesh (well under the <500
// tri/prop budget) at their authored real-world scale (~4.6 m tall), so this
// is the same tree every other instance in that scene is a copy of, not a
// from-scratch model. Its three original materials — bark, sun-lit leaf
// clumps ("bright"), shadowed leaf clumps ("dark") — each carry a small
// baked-shading 256x256 texture and convert straight to MeshStandardMaterial
// at the propModel.js load boundary, same as every other Blender prop here.
//
// public/models/tree_lowpoly_canopy_bright.glb (mirrored into dist/models/
// for the built site, same as every other prop glb).
export const TREE_MODEL_URL = '/models/tree_lowpoly_canopy_bright.glb'

// --- placement -------------------------------------------------------------
// Every object named tree_lowpoly_canopy_bright(.NNN) in World.blend, read
// via the Blender MCP connection (obj.matrix_world per object) rather than
// hand-picked: 8 objects total.
//   - tree_lowpoly_canopy_bright / .001 sit in the `tree_lowpoly` collection
//     (the reusable-template staging area), both parented to their own empty
//     at the same world spot [14, 0, 0] — two trees stacked exactly on top of
//     each other. Included as-is (this file mirrors what's actually in the
//     .blend, not a curated subset).
//   - .002-.007 sit in the `tree_new` collection — the real scattered forest
//     instances, each its own position/scale, no parent.
// None of the 8 carry any rotation (world_rotation_euler is [0,0,0] on every
// one), so yaw is 0 throughout.
//
// Conversion: three.x = blender.world_x, three.z = -blender.world_y, same
// remap as data/pvpWall.js / data/wallProps.js. `y` (ground height) is fixed
// at 0 for all of them rather than carrying over blender.world_z (11.9-14.9
// there): that's the source scene's own hillside elevation at each tree's
// spot, but this game's Ground.jsx renders a flat plane at y=0 — every other
// hub prop's own TRANSFORM already drops Blender elevation the same way
// (data/merchantShop.js SHOP_TRANSFORM, data/podiumStage.js, etc. all fix
// y=0), so a tree standing on that flat ground does too.
//
// `scale` is each object's own world_scale (uniform on every axis) — the
// .blend's own forest mixes ~7-10x blown-up trees for a big-canopy backdrop
// look with two real-world-scale (~4.6 m) ones, and that variation carries
// straight over.
export const TREE_TRANSFORMS = [
  { x: -29.13449478149414, y: 11, z: -19.610502243041992, yaw: Math.PI / 2, scale: 5}, // .002
  { x: -29.13449478149414, y: 11, z: 18.755083084106445, yaw: Math.PI / 2, scale: 5 }, // .003
  { x: 70.61740112304688, y: 11, z: -19.610502243041992, yaw: Math.PI / 2, scale: 5 }, // .004
  { x: 70.61740112304688, y: 11, z: 31.653043746948242, yaw: Math.PI / 2, scale: 5 }, // .005
  { x: 28.402957916259766, y: 11, z: 48.24097442626953, yaw: Math.PI / 2, scale: 5 }, // .006
  { x: 2.3389835357666016, y: 11, z: -53.337493896484375, yaw: Math.PI / 2, scale: 5 }, // .007
]

// --- collision ---------------------------------------------------------
// No collider. Six of the eight sit at the .blend's own authored backdrop
// scale/position (~7-10x, meant for a huge open-world scatter) and their
// trunks land squarely inside the hub podiums/shop/crates built later at hub
// scale — a trunk AABB there would fight those props' own colliders instead
// of stopping the player at a believable trunk. Purely decorative, matching
// how data/hexPowerPad.js / data/targets.js props with no drawn collision
// role simply don't appear in HUB_AABBS.
