// Building-block prop geometry and placement (Tech.md §4: every tunable number
// lives here, never in a component).
//
// Mirrors the Blender prop `building_block` / material `building_block_mat`
// one-for-one — a grass cap overhanging three dirt strata. Blender authors the
// prop, but the same rule that governs Ground.jsx applies: this block is cheap
// enough to author as code, so it costs nothing to download (Tech.md §7) and
// the .blend stays the visual reference the numbers below track.
//
// All colour variation is carried by vertex colours (Tech.md §6), which is what
// lets the whole set share one material and instance down to one draw call.

// 1 unit = 1 metre. The body is a 1m cube; the grass cap juts past it.
export const BLOCK_SIZE = 1.0 // body footprint (X and Z)
export const BLOCK_HEIGHT = 1.0 // base to the top of the grass cap
export const CAP_OVERHANG = 0.04 // per side, so the cap reads as a lip

// Strata, bottom-up. `y0`/`y1` are heights above the block's base, in metres.
export const DIRT_BANDS = [
  { y0: 0.0, y1: 0.26, color: '#5b3417' }, // deep soil
  { y0: 0.26, y1: 0.56, color: '#8a4c23' }, // subsoil
  { y0: 0.56, y1: 0.86, color: '#b4712f' }, // topsoil
]

// The cap carries three tones so the lip still reads without runtime shadows
// (Tech.md §7) — occlusion is baked into the vertex colours, as in Blender.
export const GRASS_CAP = {
  y0: 0.86,
  y1: BLOCK_HEIGHT,
  top: '#3adb25',
  side: '#2fbe1c',
  bottom: '#249612',
}

// The pixel speckle across every face. Drawn to a small CanvasTexture and
// multiplied over the vertex colours, so one texture serves every band.
export const SPECKLE = {
  size: 64, // px, power-of-two, mipmapped (Tech.md §7)
  cell: 8, // px per dot cell
  dot: 3, // px per dot
  alpha: 0.16, // dot darkness over the band colour
  // 8 dots per tile, so this is dots per metre / 8. Finer than ~16 dots per
  // metre and minification just averages the speckle back into flat colour at
  // the distance the third-person camera actually sits.
  tilesPerMetre: 2,
}

// Where the blocks stand. Empty for now — no blocks are placed.
export const BLOCK_PLACEMENTS = []

// World-space { min, max } boxes for the kinematic collider (Tech.md §5.2).
// Vertically contiguous blocks in the same column merge into one box: the scan
// is linear and unindexed, so every box removed is real frame time.
//
// Collision uses the body footprint, not the cap's — the overhanging lip is
// cosmetic, and letting it block movement would make the steps feel sticky.
function toAabbs(placements) {
  const columns = new Map()
  for (const b of placements) {
    const sx = b.sx ?? b.scale ?? 1
    const sy = b.sy ?? b.scale ?? 1
    const sz = b.sz ?? b.scale ?? 1
    const key = `${b.x}|${b.z}|${sx}|${sy}|${sz}`
    const entry = { x: b.x, y: b.y, z: b.z, sx, sy, sz }
    const list = columns.get(key)
    if (list) list.push(entry)
    else columns.set(key, [entry])
  }

  const out = []
  for (const list of columns.values()) {
    list.sort((a, b) => a.y - b.y)
    let run = null
    for (const b of list) {
      const halfX = (BLOCK_SIZE * b.sx) / 2
      const halfZ = (BLOCK_SIZE * b.sz) / 2
      const top = b.y + BLOCK_HEIGHT * b.sy
      if (run && Math.abs(b.y - run.max.y) < 1e-6) {
        run.max.y = top
        continue
      }
      run = {
        min: { x: b.x - halfX, y: b.y, z: b.z - halfZ },
        max: { x: b.x + halfX, y: top, z: b.z + halfZ },
      }
      out.push(run)
    }
  }
  return out
}

export const BLOCK_AABBS = toAabbs(BLOCK_PLACEMENTS)
