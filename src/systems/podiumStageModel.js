// Builder for the code-generated `podium_stage` prop — the wooden tiered
// display stage with real climbable side staircases and the neon POWER sign.
// Framework-free (Tech.md rule 2): pure three.js, no React import.
// components/PodiumStage.jsx calls buildPodiumStage() once, adds the returned
// root to a mount group and calls dispose() on teardown (three.js does not GC
// GPU memory — Tech.md §7).
//
// Shape of the output, and why:
//  - Every part is an axis-aligned box, UV-mapped into one region of the one
//    canvas atlas (systems/podiumStageAtlas.js). Boxes are bucketed by
//    MATERIAL, not by region, and each bucket is merged into a single
//    geometry — so the whole prop is TWO meshes / two draw calls:
//      podium_stage_wood  MeshLambertMaterial(map: atlas)  — lit
//      podium_stage_sign  MeshBasicMaterial(map: atlas)    — unlit "neon"
//    (Tech.md §7: static and unique is merged into one geometry per material;
//    materials are Lambert or Basic only, and glow is an unlit surface rather
//    than bloom.)
//  - Each stair step is its own solid box from the ground to its tread, so the
//    top face IS a tread quad and the front face IS a riser quad. That is what
//    makes the flights real, walkable geometry for a collider or a navmesh
//    bake — data/podiumStage.js generates the collider AABBs from the very
//    same spans.
//  - Under 1k triangles, well inside the 5k budget; getPodiumStageStats()
//    reports the real count so the figure is checked, not claimed.
//
// Every number lives in data/podiumStage.js (Tech.md §4).
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getPodiumStageAtlas, regionUv } from './podiumStageAtlas.js'
import {
  ATLAS,
  FOOTPRINT,
  SIGN,
  SIGN_FACE_TONE_MAPPED,
  STEPS_PER_FLIGHT,
  TIERS,
  TIER_WIDTHS,
  TOP_Y,
  TOTAL_WIDTH,
  BACK_Z,
  TRIM,
  flankSpan,
  stepSpan,
  tierOfStep,
  tierSpan,
} from '../data/podiumStage.js'

// Same deterministic mulberry32 the atlas paints with: grain placement must
// be identical across reloads (and between the runtime prop and an exported
// GLB), so nothing here may use Math.random.
function makeRand(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// --- UV mapping ----------------------------------------------------------
// Planar-map a box's six faces into one atlas region. Each face is scaled by
// its own physical size against ATLAS.grainMetres, so the wood grain is the
// same real-world size on a 2.6 m platform slab as on a 7 cm trim strip, and
// each face takes a deterministic offset inside the region so neighbouring
// planks do not repeat in lockstep. A face larger than one grain pass clamps
// to the region (the regions are painted seamlessly along U, so the join does
// not read as a seam).
//
// Face order in BoxGeometry (1x1x1 segments, 4 verts each): +X, -X, +Y, -Y,
// +Z, -Z — so the in-plane extents per face are (d,h), (d,h), (w,d), (w,d),
// (w,h), (w,h).
function mapBoxUv(geo, w, h, d, region, seed) {
  const uv = geo.attributes.uv
  const dims = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ]
  const rand = makeRand(seed)
  for (let f = 0; f < 6; f++) {
    const fu = Math.min(1, dims[f][0] / ATLAS.grainMetres)
    const fv = Math.min(1, dims[f][1] / ATLAS.grainMetres)
    const ou = rand() * (1 - fu)
    const ov = rand() * (1 - fv)
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i
      uv.setXY(
        idx,
        region.x + (ou + uv.getX(idx) * fu) * region.w,
        region.y + (ov + uv.getY(idx) * fv) * region.h,
      )
    }
  }
  uv.needsUpdate = true
  return geo
}

// --- build ---------------------------------------------------------------
export function buildPodiumStage() {
  const root = new THREE.Group()
  root.name = 'podium_stage'

  const uv = {
    oak: regionUv('oak'),
    walnut: regionUv('walnut'),
    trim: regionUv('trim'),
    metal: regionUv('metal'),
    sign: regionUv('sign'),
  }

  const wood = [] // -> one merged Lambert mesh
  let seed = 0x1a2b3c4d
  const nextSeed = () => (seed = (seed * 1664525 + 1013904223) >>> 0)

  // One wood box: size + centre in local space, UV-mapped into `region`.
  const box = (region, w, h, d, cx, cy, cz) => {
    const geo = new THREE.BoxGeometry(w, h, d)
    mapBoxUv(geo, w, h, d, uv[region], nextSeed())
    geo.translate(cx, cy, cz)
    wood.push(geo)
  }
  // A box given as spans instead of size + centre — most of this model is
  // authored as "from here to there", and converting at each call site is
  // where sign errors creep in.
  const span = (region, x0, x1, y0, y1, z0, z1) =>
    box(region, x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)

  // A walkable block: the solid walnut body plus the lighter oak cap slab
  // that forms its tread. `nose` extends the cap forward (+Z) as a lip.
  const CAP = TRIM.cap
  const walkable = (x0, x1, top, z0, z1, nose = 0) => {
    span('walnut', x0, x1, 0, top - CAP.thickness, z0, z1)
    span(
      'oak',
      x0 - CAP.overhang,
      x1 + CAP.overhang,
      top - CAP.thickness,
      top,
      z0 - CAP.overhang,
      z1 + CAP.overhang + nose,
    )
  }

  // =====================================================================
  // Side staircases — real steps, both flanks, each its own box, open on
  // the outside (no stringer wall — see data/podiumStage.js FOOTPRINT):
  // the steps run the full flank width, so every tread and riser is visible
  // and climbable from the side, not boxed in behind a solid panel. The last
  // step of each tier's own group (stepSpan's `treadOf` / TIER_STEP_COUNTS)
  // is a wider landing that tops out at, and reaches back to, its tier's own
  // edge — that's the point a climber steps sideways off the flank and onto
  // the tier. The near-ground first stage has only one step in its group, so
  // that single step simply IS the landing.
  // =====================================================================
  for (let i = 0; i < STEPS_PER_FLIGHT; i++) {
    const s = stepSpan(i)
    // Each step's own flank span, anchored to whichever tier it belongs to
    // (TIER_WIDTHS can now differ per tier — see data/podiumStage.js).
    const f = flankSpan(tierOfStep(i))
    walkable(f.x0, f.x1, s.top, s.z0, s.z1, CAP.nosing)
    walkable(-f.x1, -f.x0, s.top, s.z0, s.z1, CAP.nosing)
  }

  // =====================================================================
  // Centre tiers — TIERS walkable shelves, each a framed sheer riser
  // =====================================================================
  for (let k = 0; k < TIERS; k++) {
    const c = tierSpan(k)
    const halfCentre = TIER_WIDTHS[k] / 2 // this tier's own width, not a shared one
    walkable(-halfCentre, halfCentre, c.top, c.z0, c.z1, CAP.nosing)

    // The riser face standing proud of the tier below: exposed from that
    // tier's ledge (or the ground, for the front tier) up to this one's top.
    // Tiers no longer share one rise (TIER_RISES varies per tier — the first
    // stage sits low, near the ground), so the bottom of this face is
    // whatever the tier below topped out at, not a uniform k * rise.
    const yBottom = k === 0 ? 0 : tierSpan(k - 1).top
    const yTop = c.top
    const faceZ = c.z1
    const F = TRIM.frameWidth
    const proud = TRIM.frameProud
    // A frame strip: sunk 3 mm into the riser so the two never share a plane.
    const strip = (sx0, sx1, sy0, sy1) =>
      span('trim', sx0, sx1, sy0, sy1, faceZ + proud - 0.003, faceZ + proud)
    // A shallow tier (the near-ground first stage) may not have room for a
    // bottom rail + top rail (2*F) plus any visible field between them —
    // skip the frame rather than draw an inverted/zero-height strip. TRIM.nub
    // is already opted in per-tier (onTiers) and never targets a tier this
    // short, so it needs no separate guard.
    const faceHeight = yTop - CAP.thickness - yBottom
    if (faceHeight > 2 * F + 0.01) {
      strip(-halfCentre, halfCentre, yBottom, yBottom + F) // bottom rail
      strip(-halfCentre, halfCentre, yTop - CAP.thickness - F, yTop - CAP.thickness) // top rail
      strip(-halfCentre, -halfCentre + F, yBottom + F, yTop - CAP.thickness - F) // left stile
      strip(halfCentre - F, halfCentre, yBottom + F, yTop - CAP.thickness - F) // right stile
    }

    // Tread lip: a raised border along the ledge's front and side edges (the
    // back edge normally butts into the next riser, so it gets none) — EXCEPT
    // on the last tier when there's no separate back platform past it
    // (FOOTPRINT.backDepth folded into TIER_DEPTHS[TIERS-1] — see
    // data/podiumStage.js FOOTPRINT): its own back edge (c.z0) is then the
    // whole object's true rear edge, genuinely exposed, so it gets a lip too.
    const L = TRIM.lipWidth
    const lipTop = c.top + TRIM.lipProud
    span('trim', -halfCentre, halfCentre, c.top - 0.003, lipTop, c.z1 - L, c.z1)
    const isExposedBack = k === TIERS - 1 && FOOTPRINT.backDepth <= 0
    const sideZ0 = isExposedBack ? c.z0 + L : c.z0
    span('trim', -halfCentre, -halfCentre + L, c.top - 0.003, lipTop, sideZ0, c.z1 - L)
    span('trim', halfCentre - L, halfCentre, c.top - 0.003, lipTop, sideZ0, c.z1 - L)
    if (isExposedBack) {
      span('trim', -halfCentre, halfCentre, c.top - 0.003, lipTop, c.z0, c.z0 + L)
    }

    // The small ribbed nub centred on the riser (reference detail): a
    // three-step stack, each rib a touch narrower than the one below.
    if (TRIM.nub.onTiers.includes(k)) {
      const N = TRIM.nub
      for (let r = 0; r < N.ribs; r++) {
        const hw = (N.width * (1 - 0.16 * r)) / 2
        const y0 = yBottom + F + 0.01 + r * N.ribHeight
        span('trim', -hw, hw, y0, y0 + N.ribHeight, faceZ + proud - 0.003, faceZ + N.proud)
      }
    }
  }

  // =====================================================================
  // Back platform — full width behind the top tier, where the sign stands.
  // Skipped when FOOTPRINT.backDepth is 0 (that depth is folded into
  // TIER_DEPTHS[2] instead — see data/podiumStage.js FOOTPRINT): tier 2's
  // own centre-tier box and flank landing step already reach BACK_Z, so a
  // separate platform here would be a zero-depth, degenerate box.
  // =====================================================================
  if (FOOTPRINT.backDepth > 0) {
    const z1 = BACK_Z + FOOTPRINT.backDepth
    const half = TOTAL_WIDTH / 2
    walkable(-half, half, TOP_Y, BACK_Z, z1)
    // lip along the two outer edges and the back edge
    const L = TRIM.lipWidth
    const lipTop = TOP_Y + TRIM.lipProud
    span('trim', -half, half, TOP_Y - 0.003, lipTop, BACK_Z, BACK_Z + L)
    span('trim', -half, -half + L, TOP_Y - 0.003, lipTop, BACK_Z + L, z1)
    span('trim', half - L, half, TOP_Y - 0.003, lipTop, BACK_Z + L, z1)
  }

  // =====================================================================
  // Sign — backboard on two posts, brushed cap, unlit neon face
  // =====================================================================
  const boardBottom = TOP_Y + SIGN.postHeight
  const boardTop = boardBottom + SIGN.boardHeight
  {
    const p = SIGN.postSection / 2
    for (const side of [-1, 1]) {
      const px = side * SIGN.postSpread
      span('trim', px - p, px + p, TOP_Y, boardBottom + 0.02, SIGN.z - p, SIGN.z + p)
    }
    span(
      'walnut',
      -SIGN.boardWidth / 2,
      SIGN.boardWidth / 2,
      boardBottom,
      boardTop,
      SIGN.z - SIGN.boardThickness / 2,
      SIGN.z + SIGN.boardThickness / 2,
    )
    span(
      'metal',
      -SIGN.boardWidth / 2 - SIGN.capOverhang,
      SIGN.boardWidth / 2 + SIGN.capOverhang,
      boardTop,
      boardTop + SIGN.capHeight,
      SIGN.z - SIGN.boardThickness / 2 - SIGN.capOverhang,
      SIGN.z + SIGN.boardThickness / 2 + SIGN.capOverhang,
    )
  }

  // The lit-looking part: one quad on the board's front face, its whole
  // appearance (dark ground, white neon frame, POWER, the two bursts) baked
  // into the atlas's unique sign region. Two triangles, no transparency.
  const faceGeo = new THREE.PlaneGeometry(SIGN.boardWidth, SIGN.boardHeight)
  {
    const a = faceGeo.attributes.uv
    for (let i = 0; i < a.count; i++) {
      a.setXY(i, uv.sign.x + a.getX(i) * uv.sign.w, uv.sign.y + a.getY(i) * uv.sign.h)
    }
    a.needsUpdate = true
    faceGeo.translate(
      0,
      (boardBottom + boardTop) / 2,
      SIGN.z + SIGN.boardThickness / 2 + SIGN.faceInset,
    )
  }

  // =====================================================================
  // merge: one lit wood mesh + one unlit sign mesh, sharing one texture
  // =====================================================================
  const atlas = getPodiumStageAtlas()

  const woodGeo = mergeGeometries(wood, false)
  for (const g of wood) g.dispose()
  const woodMesh = new THREE.Mesh(
    woodGeo,
    new THREE.MeshLambertMaterial({ map: atlas, color: 0xffffff }),
  )
  woodMesh.name = 'podium_stage_wood'

  const signMesh = new THREE.Mesh(
    faceGeo,
    new THREE.MeshBasicMaterial({ map: atlas, toneMapped: SIGN_FACE_TONE_MAPPED }),
  )
  signMesh.name = 'podium_stage_sign'

  for (const mesh of [woodMesh, signMesh]) {
    mesh.castShadow = false
    mesh.receiveShadow = false
    root.add(mesh)
  }

  return {
    root,
    // The texture is a shared module singleton (podiumStageAtlas.js), so it is
    // deliberately not disposed here — only this instance's geometry and
    // materials are.
    dispose() {
      root.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose()
          o.material.dispose()
        }
      })
    },
  }
}

// Triangle / mesh count of a built prop — used by the preview page and worth
// reading before touching the tables in data/podiumStage.js, since the budget
// is 5k triangles (the brief) inside the scene's own 150k (Tech.md §7).
export function getPodiumStageStats(built) {
  let triangles = 0
  let meshes = 0
  built.root.traverse((o) => {
    if (!o.isMesh) return
    meshes++
    const g = o.geometry
    triangles += g.index ? g.index.count / 3 : g.attributes.position.count / 3
  })
  return { triangles, meshes, materials: meshes, textures: 1 }
}
