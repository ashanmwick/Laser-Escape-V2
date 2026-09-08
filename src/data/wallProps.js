// Data for the 10 distinct objects in collection `wall` (Tech.md §4/§6): a
// shelf of material swatches — brick, cardboard, carpet, concrete, glass,
// grass, leather, paper, rubber, wood — each its own mesh + material, like
// data/targets.js (not 15 duplicates of one shared source, like
// data/hexPowerPad.js). All ten share one identical box mesh (8 verts, 12
// tris — comfortably inside Tech.md §6's <500-tri budget), one non-uniform
// scale and one -90° yaw around Blender's Z axis; only location.x differs
// between them (read directly off each object). Kept as exact
// as-authored transforms (no zFit) per the import instruction, same
// precedent as data/glowFloorPanel.js.
//
// Each source material carries a Normal Map input built from a
// Blender-GENERATED texture (not a real authored asset) — the same
// situation data/targets.js documents — so it was unlinked from the
// Principled BSDF before export and restored after, leaving the .blend
// untouched. glass_wall_mat's blend_method was Eevee BLEND despite its
// Alpha input never being linked to anything but the constant default 1.0
// — the same as-authored-for-Eevee case data/glowFloorPanel.js fixes — so
// it was set OPAQUE for the export only, then restored. Every albedo map
// was exported as JPEG rather than the glTF exporter's PNG default (no
// material here has a used alpha channel): that alone took the ten walls
// from ~5MB to ~430KB combined, which is what keeps Tech.md §7's <5MB
// total download budget intact once they join the rest of the props.
const WALLS = [
  { id: 'paper_wall', x: 71.43270874023438 },
  { id: 'cardboard_wall', x: 138.57650756835938 },
  { id: 'carpet_wall', x: 200.74349975585938 },
  { id: 'leather_wall', x: 259.98797607421875 },
  { id: 'rubber_wall', x: 326.5576477050781 },
  { id: 'grass_wall', x: 389.21905517578125 },
  { id: 'wood_wall', x: 448.4115905761719 },
  { id: 'glass_wall', x: 514.3745727539062 },
  { id: 'concrete_wall', x: 577.2219848632812 },
  { id: 'brick_wall', x: 628.4105224609375 },
]

// location.y / location.z, identical across all ten.
const LOCATION_Y = -4.012638568878174
const LOCATION_Z = -0.7776517271995544

// Shared scale and yaw (rotation around Blender's Z / three's Y — the same
// angle, unchanged, across the Z-up -> Y-up remap, per data/podium.js).
const SCALE = { x: 7.254423141479492, y: 16.405601501464844, z: 4.8133015632629395 }
const YAW = -1.5707963705062866

// Local (object-space, pre-scale) box — object.bound_box, identical for
// all ten since they share one base mesh.
const LOCAL_MIN = { x: -2, y: -0.125, z: 0 }
const LOCAL_MAX = { x: 2, y: 0.125, z: 2.4000000953674316 }

function rotateYaw(x, y) {
  const cos = Math.cos(YAW)
  const sin = Math.sin(YAW)
  return [x * cos - y * sin, x * sin + y * cos]
}

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own
// convention (same remap as data/podium.js / data/targets.js): three.x =
// blender.x, three.y = blender.z, three.z = -blender.y.
function toThree(bx, by, bz) {
  return [bx, bz, -by]
}

// Composes Blender's own transform order (scale, then rotate, then
// translate) for one local point, then remaps to three.js space.
function worldPoint(locationX, lx, ly, lz) {
  const [rx, ry] = rotateYaw(lx * SCALE.x, ly * SCALE.y)
  const bx = locationX + rx
  const by = LOCATION_Y + ry
  const bz = LOCATION_Z + lz * SCALE.z
  return toThree(bx, by, bz)
}

export const WALL_PROPS = WALLS.map((w) => ({
  id: w.id,
  url: `/models/${w.id}.glb`,
  position: worldPoint(w.x, 0, 0, 0),
  rotationY: YAW,
}))

// World-space { min, max } AABBs for the kinematic collider (Tech.md §5.2)
// — each wall is a solid object, so its box IS its collider, same as the
// building blocks and both podiums (data/hub.js). The yaw is an exact -90°
// turn so the box stays axis-aligned in world space, but the min/max is
// still taken over all 8 corners rather than assumed, since toThree's axis
// remap plus the yaw both permute which local axis ends up where.
function worldAabb(locationX) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const lx of [LOCAL_MIN.x, LOCAL_MAX.x]) {
    for (const ly of [LOCAL_MIN.y, LOCAL_MAX.y]) {
      for (const lz of [LOCAL_MIN.z, LOCAL_MAX.z]) {
        const p = worldPoint(locationX, lx, ly, lz)
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

export const WALL_AABBS = WALLS.map((w) => ({ id: w.id, ...worldAabb(w.x) }))
