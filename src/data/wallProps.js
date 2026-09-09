// Data for the 25 distinct objects in collection `wall` (Tech.md §4/§6): a
// shelf of material swatches that runs the length of the lane, soft to
// legendary — paper, cardboard, carpet, leather, rubber, grass, wood, glass,
// concrete, brick, limestone, stone, marble, iron, copper, granite, titanium,
// steel, metal, diamond, carbon fibre, tungsten, void, magma, obsidian. Each
// is its own mesh + material, like data/targets.js (not N duplicates of one
// shared source, like data/hexPowerPad.js). All 25 share one identical box
// mesh (8 verts, 12 tris — comfortably inside Tech.md §6's <500-tri budget),
// one non-uniform scale and one -90° yaw around Blender's Z axis; only
// location.x differs between them (read directly off each object). Kept as
// exact as-authored transforms (no zFit) per the import instruction, same
// precedent as data/glowFloorPanel.js — brick_wall's x was resynced here
// after it moved in the .blend (628.41 -> 636.15); the other nine originals
// were unchanged.
//
// The first ten (paper..brick) are textured: each source material carries a
// Normal Map input built from a Blender-GENERATED texture (not a real
// authored asset) — the same situation data/targets.js documents — so it was
// unlinked from the Principled BSDF before export and restored after, leaving
// the .blend untouched. glass_wall_mat's blend_method was Eevee BLEND despite
// its Alpha input never being linked to anything but the constant default 1.0
// — the same as-authored-for-Eevee case data/glowFloorPanel.js fixes — so it
// was set OPAQUE for the export only, then restored. Every albedo map was
// exported as JPEG rather than the glTF exporter's PNG default (no material
// here has a used alpha channel): that alone took the ten walls from ~5MB to
// ~430KB combined.
//
// The fifteen new ones (limestone..obsidian) are fully procedural in the
// .blend — noise / Voronoi / Color Ramp graphs with no authored bitmap, which
// the glTF exporter cannot carry and Tech.md §7 would reject as PBR anyway.
// "Optimize the material to suit the game" here means: a single flat
// baseColorFactor per wall, sampled straight from each material's own node
// values (Color Ramp stops, Mix inputs, constant sockets) — no Blender
// render/bake was run. void_wall and magma_wall additionally carry an
// emissiveFactor so propModel.js's convertMaterial() promotes them to the
// engine's unlit "glow without bloom" path (the same treatment as any neon
// prop). All fifteen glTFs are ~2KB (31KB combined), so the whole 25-wall set
// stays far inside Tech.md §7's <5MB download budget.
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
  { id: 'brick_wall', x: 636.1453857421875 },
  { id: 'limestone_wall', x: 699.5711059570312 },
  { id: 'stone_wall', x: 762.2233276367188 },
  { id: 'marble_wall', x: 824.10205078125 },
  { id: 'iron_wall', x: 885.67138671875 },
  { id: 'copper_wall', x: 948.3236083984375 },
  { id: 'granite_wall', x: 1010.2023315429688 },
  { id: 'titanium_wall', x: 1071.3076171875 },
  { id: 'steel_wall', x: 1133.9598388671875 },
  { id: 'metal_wall', x: 1195.838623046875 },
  { id: 'diamond_wall', x: 1254.5194091796875 },
  { id: 'carbon_fiber_wall', x: 1317.171630859375 },
  { id: 'tungsten_wall', x: 1379.05029296875 },
  { id: 'void_wall', x: 1441.3934326171875 },
  { id: 'magma_wall', x: 1504.045654296875 },
  { id: 'obsidian_wall', x: 1565.9244384765625 },
]

// Stage number (1-based, in roster order — paper_wall is Stage 1, brick_wall is
// Stage 10) and human-readable material name for the always-on
// "Stage N / <Material>" sign above every wall health bar
// (components/WallHealthBars.jsx). Tech.md §4: the label text and its ordering
// live in data, not the component.
const WALL_DISPLAY_NAMES = {
  paper_wall: 'Paper',
  cardboard_wall: 'Cardboard',
  carpet_wall: 'Carpet',
  leather_wall: 'Leather',
  rubber_wall: 'Rubber',
  grass_wall: 'Grass',
  wood_wall: 'Wood',
  glass_wall: 'Glass',
  concrete_wall: 'Concrete',
  brick_wall: 'Brick',
  limestone_wall: 'Limestone',
  stone_wall: 'Stone',
  marble_wall: 'Marble',
  iron_wall: 'Iron',
  copper_wall: 'Copper',
  granite_wall: 'Granite',
  titanium_wall: 'Titanium',
  steel_wall: 'Steel',
  metal_wall: 'Metal',
  diamond_wall: 'Diamond',
  carbon_fiber_wall: 'Carbon Fiber',
  tungsten_wall: 'Tungsten',
  void_wall: 'Void',
  magma_wall: 'Magma',
  obsidian_wall: 'Obsidian',
}

export const WALL_STAGES = WALLS.map((w, i) => ({
  id: w.id,
  stage: i + 1,
  name: WALL_DISPLAY_NAMES[w.id],
}))

// location.y / location.z, identical across all 25.
const LOCATION_Y = -4.012638568878174
const LOCATION_Z = -0.7776517271995544

// Shared scale and yaw (rotation around Blender's Z / three's Y — the same
// angle, unchanged, across the Z-up -> Y-up remap, per data/podium.js).
const SCALE = { x: 7.254423141479492, y: 16.405601501464844, z: 4.8133015632629395 }
const YAW = -1.5707963705062866

// Local (object-space, pre-scale) box — object.bound_box, identical for
// all 25 since they share one base mesh.
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
