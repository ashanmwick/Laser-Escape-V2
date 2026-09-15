// Data for the `pvp_wall` object (Blender collection `wall`, Tech.md §4/§6) —
// a stand-alone glass barrier for the Pvp area (data/pvpBlocks.js), not one of
// the 63 destructible panels in data/wallProps.js: it has no health, no stage
// number, and sits off in the Pvp zone at its own location rather than the
// shared lane row those panels share.
//
// pvp_wall's mesh (data-block paper_wall.001) is an unmodified duplicate of
// the shared wall-panel box every WALL_TYPES entry uses — verified against
// the .blend: bound_box [-2,-0.125,0]..[2,0.125,2.4], 8 verts / 6 quads, same
// as wallProps.js's own LOCAL_MIN/MAX. So, same as that file, this is a plain
// box: no new geometry to author, only a transform and a material.
//
// Per the import instruction, its inherited material (paper_wall_mat.001, a
// duplicate of paper_wall's own material and used by nothing else) was
// discarded in the .blend and replaced with pvp_wall_glass_mat — a Principled
// BSDF, pale blue, Alpha 0.35, blend mode BLEND, with Alpha actually wired to
// the constant (unlike glass_wall_mat elsewhere in the file, whose Alpha
// input is never connected to anything but the unused default 1.0 — see
// wallProps.js's header). The .blend is the visual reference only, same
// precedent as data/grassBlocks.js / data/podiumStage.js: this prop is cheap
// enough to generate at boot (Tech.md §7) instead of exporting a glTF for a
// single flat box, and PvpWall.jsx builds an honest alpha-blended, low-
// roughness MeshStandardMaterial from PVP_WALL_MATERIAL below (still no
// transmission/refraction, so it's a stand-in for real glass, not the thing
// itself).
//
// Raw transform read directly off pvp_wall in the .blend: location, yaw
// (rotation_euler.x/y is 0, only Z rotates, matching every other wall panel),
// scale.
const RAW = {
  location: [-28.7077579498291, -4.064126968383789, -0.7776517271995544],
  yaw: -1.5707963705062866,
  scale: [6.101956844329834, 8.654608726501465, 4.8133015632629395],
}

// Local (object-space, pre-scale) box — identical to wallProps.js's shared
// LOCAL_MIN/MAX, since this object reuses that same base mesh.
const LOCAL_MIN = { x: -2, y: -0.125, z: 0 }
const LOCAL_MAX = { x: 2, y: 0.125, z: 2.4 }

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own convention
// (same remap as data/wallProps.js / data/podiumStage.js): three.x =
// blender.x, three.y = blender.z, three.z = -blender.y.
function toThree(bx, by, bz) {
  return [bx, bz, -by]
}

// Rotates a local (x, y) point by `yaw` around the up axis — the same angle
// whether read as a turn around Blender's Z or three.js's Y (data/podium.js).
function rotateYaw(x, y) {
  const cos = Math.cos(RAW.yaw)
  const sin = Math.sin(RAW.yaw)
  return [x * cos - y * sin, x * sin + y * cos]
}

// Composes Blender's own transform order (scale, then rotate, then
// translate) for one local point, then remaps to three.js space.
function worldPoint(lx, ly, lz) {
  const [rx, ry] = rotateYaw(lx * RAW.scale[0], ly * RAW.scale[1])
  const bx = RAW.location[0] + rx
  const by = RAW.location[1] + ry
  const bz = RAW.location[2] + lz * RAW.scale[2]
  return toThree(bx, by, bz)
}

// The mount transform PvpWall.jsx places its group at. Rotation only ever
// turns around the up axis (yaw), unchanged across the Z-up -> Y-up remap.
export const PVP_WALL_POSITION = worldPoint(0, 0, 0)
export const PVP_WALL_ROTATION_Y = RAW.yaw

// World-space box size, scale already baked in (Blender's own object.dimensions:
// local extent * scale, along the object's own pre-rotation axes) — verified
// against the .blend (29.0177 x 4.1014 x 11.5519). PvpWall.jsx builds its
// BoxGeometry directly at this size (no non-uniform scale on the mesh, which
// would otherwise skew MeshStandardMaterial's lighting normals), remapped the
// same way as position: three width = blender x-extent, three height =
// blender z-extent, three depth = blender y-extent.
export const PVP_WALL_SIZE = {
  width: (LOCAL_MAX.x - LOCAL_MIN.x) * RAW.scale[0],
  height: (LOCAL_MAX.z - LOCAL_MIN.z) * RAW.scale[2],
  depth: (LOCAL_MAX.y - LOCAL_MIN.y) * RAW.scale[1],
}

// Local origin sits at the panel's base (Tech.md §6), not its centre — the
// mesh needs lifting by half its height to rest on the ground at
// PVP_WALL_POSITION, same convention as every other box prop in this set.
export const PVP_WALL_CENTER_Y = PVP_WALL_SIZE.height / 2

// Honest glass, not the fake opaque "Glass" wall type in wallProps.js: a
// pale-blue alpha-blended, low-roughness MeshStandardMaterial (still no
// transmission/refraction). Matches pvp_wall_glass_mat's node values in the
// .blend (Base Color, Alpha); roughness/metalness live in
// data/materials.js's MATERIAL_PBR.GLASS.
export const PVP_WALL_MATERIAL = {
  color: '#bfe9ff',
  opacity: 0.35,
}

// pvp_wall is a stand-alone barrier, not one of wallProps.js's 63 destructible
// panels: no health, no health bar, never breaks. It gets a static in-world
// sign instead (Tech.md §1: drei's SDF <Text> is used for exactly this),
// placed on the panel's local -Z face — the -90° yaw (RAW.yaw) turns that
// face to world +X, i.e. the hub/spawn side, opposite the Pvp-zone face at
// world -X. PvpWall.jsx positions it at local (0, PVP_WALL_CENTER_Y,
// -depth/2 - gap) and turns it 180° about Y: drei's Text default normal is
// +Z (WallHealthBars.jsx documents the same convention for its own wall
// signage), so facing -Z needs that extra turn to still read left-to-right
// instead of mirrored.
// Title (big, yellow) plus a smaller white caption underneath — same
// two-tier idea as GlowFloorPanelLabel.jsx's "+N Wins" / "Return" pair.
export const PVP_WALL_SIGN = {
  title: 'PVP Zone',
  titleSize: 3,
  titleColor: '#ffd21e',
  subtitle: 'UNLOCKABLE ON REBIRTH 1',
  subtitleSize: 1.2,
  subtitleColor: '#ffffff',
  // Vertical drop from the title's own anchor to the subtitle's, in metres.
  subtitleGap: 2.4,
}
export const PVP_WALL_SIGN_GAP = 0.08 // clearance off the panel face, avoids z-fighting

// World-space { min, max } AABB for the kinematic collider (Tech.md §5.2) —
// solid glass, blocks movement the same as any other wall. Taken over all 8
// local corners rather than assumed, since toThree's axis remap plus the yaw
// both permute which local axis ends up where.
function worldAabb() {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const lx of [LOCAL_MIN.x, LOCAL_MAX.x]) {
    for (const ly of [LOCAL_MIN.y, LOCAL_MAX.y]) {
      for (const lz of [LOCAL_MIN.z, LOCAL_MAX.z]) {
        const p = worldPoint(lx, ly, lz)
        for (let i = 0; i < 3; i++) {
          if (p[i] < min[i]) min[i] = p[i]
          if (p[i] > max[i]) max[i] = p[i]
        }
      }
    }
  }
  return { min: { x: min[0], y: min[1], z: min[2] }, max: { x: max[0], y: max[1], z: max[2] } }
}

export const PVP_WALL_AABB = worldAabb()
