// Data for collection `wall` (Tech.md §4/§6): a shelf of material swatches that
// runs the length of the lane, soft to legendary — paper, cardboard, carpet,
// leather, rubber, grass, wood, glass, concrete, brick, limestone, stone,
// marble, iron, copper, granite, titanium, steel, metal, diamond, carbon fibre,
// tungsten, void, magma, obsidian.
//
// The collection holds 63 objects, not 25: most materials are now a
// front-to-back run of 2–3 panels (`carbon_fiber_wall` + `carbon_fiber_wall.001`
// + `carbon_fiber_wall.002`, and so on — the "duplicates" in the .blend). Each
// object is imported as ITS OWN destructible wall: a separate health pool, a
// separate collider box, a separate in-world health bar. The duplicates are not
// merged — you break them one at a time, front to back, before the lane opens
// to the win pad. All three panels of a material share that material's Strength
// value (STAGE_STRENGTH keyed by the type's stage number, data/wallHealth.js),
// but their health drains independently.
//
// `id` is the Blender object name verbatim, so every wall maps 1:1 to an object
// in the collection (`carbon_fiber_wall.001` stays `carbon_fiber_wall.001` —
// obsidian's stack is `.002`/`.003`, no `.001`, kept as-authored). `WALL_PROPS`,
// `WALL_AABBS` and `WALL_STAGES` are all flat, 63 entries, index-aligned, in
// lane order.
//
// Every panel shares one identical box mesh (8 verts, 12 tris — inside Tech.md
// §6's <500-tri budget), one non-uniform scale and one -90° yaw around
// Blender's Z; only location.x differs, read directly off each object. Kept as
// exact as-authored transforms (no zFit) per the import instruction, same
// precedent as data/glowFloorPanel.js — every base x moved when the stacks were
// added (carbon_fiber_wall 1313.26, with .001/.002 behind it), so all 25 bases
// were resynced here alongside the new panels.
//
// Imported optimized: ONE glTF per material type (25 files), unchanged from the
// previous import — the panel geometry and every material are byte-identical,
// and propModel.js strips the glTF's baked position/rotation on load, so the 38
// extra panels download nothing and reuse the cached geometry/material via
// root.clone() (propModel.js loadProp refCount path — three mounts of
// carbon_fiber_wall.glb cost one set of GPU geometry). The duplicate materials
// in the .blend (`carbon_fiber_wall_mat.001` …) are exact copies of the base
// and never reach the game; `url` is keyed on the material type, not the id.
//
// The first ten materials (paper..brick) are textured: each source material
// carries a Normal Map built from a Blender-GENERATED texture (not a real
// authored asset) — the same situation data/targets.js documents — so it was
// unlinked from the Principled BSDF before export and restored after, leaving
// the .blend untouched. glass_wall_mat's blend_method was Eevee BLEND despite
// its Alpha input never being linked to anything but the constant default 1.0 —
// the same as-authored-for-Eevee case data/glowFloorPanel.js fixes — so it was
// set OPAQUE for the export only, then restored. Every albedo map was exported
// as JPEG rather than the glTF exporter's PNG default (no material here has a
// used alpha channel): that alone took the ten walls from ~5MB to ~430KB
// combined.
//
// The fifteen procedural materials (limestone..obsidian) are noise / Voronoi /
// Color Ramp graphs with no authored bitmap, which the glTF exporter cannot
// carry and Tech.md §7 would reject as PBR anyway. "Optimize the material to
// suit the game" here means: a single flat baseColorFactor per wall, sampled
// straight from each material's own node values (Color Ramp stops, Mix inputs,
// constant sockets) — no Blender render/bake was run. void_wall and magma_wall
// additionally carry an emissiveFactor so propModel.js's convertMaterial()
// promotes them to the engine's unlit "glow without bloom" path (the same
// treatment as any neon prop). All fifteen glTFs are ~2KB, so the whole set
// stays far inside Tech.md §7's <5MB download budget.
//
// Each type's `panels` is [Blender object name, location.x], front to back, in
// the exact order the .blend places them along the lane.
const WALL_TYPES = [
  { type: 'paper_wall', name: 'Paper', panels: [['paper_wall', 71.43270874023438]] },
  { type: 'cardboard_wall', name: 'Cardboard', panels: [['cardboard_wall', 138.57650756835938]] },
  { type: 'carpet_wall', name: 'Carpet', panels: [['carpet_wall', 200.74349975585938]] },
  { type: 'leather_wall', name: 'Leather', panels: [['leather_wall', 259.98797607421875]] },
  { type: 'rubber_wall', name: 'Rubber', panels: [['rubber_wall', 324.9098815917969]] },
  {
    type: 'grass_wall',
    name: 'Grass',
    panels: [
      ['grass_wall', 384.4512023925781],
      ['grass_wall.001', 389.37799072265625],
    ],
  },
  {
    type: 'wood_wall',
    name: 'Wood',
    panels: [
      ['wood_wall', 445.5508728027344],
      ['wood_wall.001', 450.1597900390625],
    ],
  },
  {
    type: 'glass_wall',
    name: 'Glass',
    panels: [
      ['glass_wall', 508.5496520996094],
      ['glass_wall.001', 512.8416748046875],
      ['glass_wall.002', 517.3636474609375],
    ],
  },
  {
    type: 'concrete_wall',
    name: 'Concrete',
    panels: [
      ['concrete_wall', 570.9310302734375],
      ['concrete_wall.001', 575.5664672851562],
      ['concrete_wall.002', 579.9811401367188],
    ],
  },
  {
    type: 'brick_wall',
    name: 'Brick',
    panels: [
      ['brick_wall', 633.590576171875],
      ['brick_wall.001', 637.9976196289062],
      ['brick_wall.002', 642.3407592773438],
    ],
  },
  {
    type: 'limestone_wall',
    name: 'Limestone',
    panels: [
      ['limestone_wall', 696.313720703125],
      ['limestone_wall.001', 700.5291137695312],
      ['limestone_wall.002', 704.9361572265625],
    ],
  },
  {
    type: 'stone_wall',
    name: 'Stone',
    panels: [
      ['stone_wall', 759.0962524414062],
      ['stone_wall.001', 763.4189453125],
      ['stone_wall.002', 767.9255981445312],
    ],
  },
  {
    type: 'marble_wall',
    name: 'Marble',
    panels: [
      ['marble_wall', 821.3428955078125],
      ['marble_wall.001', 825.757568359375],
      ['marble_wall.002', 830.0618896484375],
    ],
  },
  {
    type: 'iron_wall',
    name: 'Iron',
    panels: [
      ['iron_wall', 882.7972412109375],
      ['iron_wall.001', 886.9487915039062],
      ['iron_wall.002', 891.100341796875],
    ],
  },
  {
    type: 'copper_wall',
    name: 'Copper',
    panels: [
      ['copper_wall', 943.6398315429688],
      ['copper_wall.001', 947.8978271484375],
      ['copper_wall.002', 952.2622680664062],
    ],
  },
  {
    type: 'granite_wall',
    name: 'Granite',
    panels: [
      ['granite_wall', 1007.0599365234375],
      ['granite_wall.001', 1011.1220703125],
      ['granite_wall.002', 1015.2608032226562],
    ],
  },
  {
    type: 'titanium_wall',
    name: 'Titanium',
    panels: [
      ['titanium_wall', 1068.0885009765625],
      ['titanium_wall.001', 1072.227294921875],
      ['titanium_wall.002', 1076.550048828125],
    ],
  },
  {
    type: 'steel_wall',
    name: 'Steel',
    panels: [
      ['steel_wall', 1129.1036376953125],
      ['steel_wall.001', 1133.187255859375],
      ['steel_wall.002', 1137.8226318359375],
    ],
  },
  {
    type: 'metal_wall',
    name: 'Metal',
    panels: [
      ['metal_wall', 1191.6005859375],
      ['metal_wall.001', 1195.838623046875],
      ['metal_wall.002', 1200.4739990234375],
    ],
  },
  {
    type: 'diamond_wall',
    name: 'Diamond',
    panels: [
      ['diamond_wall', 1252.0361328125],
      ['diamond_wall.001', 1256.1749267578125],
      ['diamond_wall.002', 1260.6815185546875],
    ],
  },
  {
    type: 'carbon_fiber_wall',
    name: 'Carbon Fiber',
    panels: [
      ['carbon_fiber_wall', 1313.2626953125],
      ['carbon_fiber_wall.001', 1317.2481689453125],
      ['carbon_fiber_wall.002', 1321.156982421875],
    ],
  },
  {
    type: 'tungsten_wall',
    name: 'Tungsten',
    panels: [
      ['tungsten_wall', 1376.533935546875],
      ['tungsten_wall.001', 1380.6395263671875],
      ['tungsten_wall.002', 1384.95703125],
    ],
  },
  {
    type: 'void_wall',
    name: 'Void',
    panels: [
      ['void_wall', 1436.9287109375],
      ['void_wall.001', 1441.327880859375],
      ['void_wall.002', 1445.7972412109375],
    ],
  },
  {
    type: 'magma_wall',
    name: 'Magma',
    panels: [
      ['magma_wall', 1498.7232666015625],
      ['magma_wall.001', 1503.22216796875],
      ['magma_wall.002', 1508.164306640625],
    ],
  },
  {
    type: 'obsidian_wall',
    name: 'Obsidian',
    panels: [
      ['obsidian_wall', 1561.236083984375],
      ['obsidian_wall.002', 1565.591796875],
      ['obsidian_wall.003', 1570.3101806640625],
    ],
  },
]

// Flattened to one entry per Blender object, in lane order. `stage` is the
// material type's 1-based roster position (paper = 1, carbon fibre = 21,
// obsidian = 25) — it keys STAGE_STRENGTH in data/wallHealth.js, so every panel
// of a type gets that type's Strength, and it drives the always-on
// "Stage N / <Material>" sign (components/WallHealthBars.jsx). Panels of the
// same type therefore all read the same sign; they are still separate walls.
const PANELS = WALL_TYPES.flatMap((t, ti) =>
  t.panels.map(([id, x]) => ({ id, type: t.type, stage: ti + 1, name: t.name, x })),
)

export const WALL_STAGES = PANELS.map((p) => ({ id: p.id, stage: p.stage, name: p.name }))

// location.y / location.z, identical across all 63 panels.
const LOCATION_Y = -4.012638568878174
const LOCATION_Z = -0.7776517271995544

// Shared scale and yaw (rotation around Blender's Z / three's Y — the same
// angle, unchanged, across the Z-up -> Y-up remap, per data/podium.js).
const SCALE = { x: 7.254423141479492, y: 16.405601501464844, z: 4.8133015632629395 }
const YAW = -1.5707963705062866

// Local (object-space, pre-scale) box — object.bound_box, identical for every
// panel since they all share one base mesh.
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

export const WALL_PROPS = PANELS.map((p) => ({
  id: p.id,
  url: `/models/${p.type}.glb`,
  position: worldPoint(p.x, 0, 0, 0),
  rotationY: YAW,
}))

// World-space { min, max } AABB for the kinematic collider (Tech.md §5.2) —
// each panel is a solid object, so its own box IS its collider, same as the
// building blocks and both podiums (data/hub.js). One box per Blender object:
// the beam breaks the front panel, its box is dropped (systems/collision.js
// removeAabb), and the beam then reaches the one behind it. The yaw is an exact
// -90° turn so the box stays axis-aligned in world space, but the min/max is
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

export const WALL_AABBS = PANELS.map((p) => ({ id: p.id, ...worldAabb(p.x) }))
