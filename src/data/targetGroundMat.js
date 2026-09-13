// Data for the ground mats under every object in collection `Targets`
// (Tech.md §4) — one code-generated red-brick-style checker plate per
// target (components/TargetGroundMat.jsx paints it, components/
// TargetGroundMats.jsx mounts one per data/targets.js TARGET_PROPS entry).
//
// Every target's mat shares the exact same size/grid/offsets below — only
// the palette (TARGET_GROUND_MAT_COLORS) varies per target id, so each can
// be recolored independently without touching its geometry.

// --- shared geometry (identical for every target) -------------------------
// World-space footprint, metres — centred on each target's own placement,
// nudged by Z_OFFSET. A target on either tier the nine targets stand on
// (data/targets.js: tier 0 or 1) sits 1.56 m clear of that tier's own back
// edge and 6.24 m clear of its front edge (TARGET_TIER_DEPTHS[0] ===
// TARGET_TIER_DEPTHS[1] === 1.2, so both tiers give identical margins at
// zBias 0.2 / PODIUM_STAGE_TARGET_TRANSFORM's scale 6.5) — the same numbers
// hold for all nine, which is what lets one shared size/offset work
// everywhere. MAT_DEPTH here is deliberately larger than that 3.12 m
// symmetric-safe figure; Z_OFFSET pulls every mat forward by the same
// amount to keep its back edge clear of the riser behind it instead.
export const TARGET_GROUND_MAT_WIDTH = 3.0 // local X
export const TARGET_GROUND_MAT_DEPTH = 6.5 // local Z

// Lifted a hair off the tier's own wood cap (systems/podiumStageModel.js)
// so the two coplanar meshes don't z-fight.
export const TARGET_GROUND_MAT_Y_OFFSET = 0.003

// World-space nudge off each target's own Z, metres — see the geometry
// comment above; shared by every target so they all sit the same distance
// off their own placement. The Target podium instance is mounted at yaw
// Math.PI (data/podiumStage.js PODIUM_STAGE_TARGET_TRANSFORM), which flips
// local front/back onto world Z: negative shifts every mat toward its own
// tier's front edge (away from the riser behind it).
export const TARGET_GROUND_MAT_Z_OFFSET = -2.5

// Slab thickness, metres — every mat is a short box, not a flat plane, so
// its four side edges (and underside) read as a raised plate standing
// proud of the tier surface instead of a decal painted onto it.
export const TARGET_GROUND_MAT_THICKNESS = 0.08

// Stud grid — in studs, not metres. Width/depth above just stretch this
// grid to size, so studsX:studsY should stay proportional to width:depth
// for square studs (10:20 here matches 3.6:9.0 above... actually any ratio
// works visually, studs just stretch slightly non-square if it drifts).
export const TARGET_GROUND_MAT_GRID = {
  studsX: 10, // across width
  studsY: 20, // across depth
  borderStuds: 1, // rim thickness, in studs
  blockStuds: 4, // each checker block is blockStuds x blockStuds studs
}

// Bevel tint shared by every target's studs (top-left highlight,
// bottom-right shadow) — the raised-nub illusion is baked into the
// texture, not real lighting (TargetGroundMat.jsx uses an unlit material).
export const TARGET_GROUND_MAT_STUD_HIGHLIGHT = 'rgba(255,255,255,0.35)'
export const TARGET_GROUND_MAT_STUD_SHADOW = 'rgba(0,0,0,0.35)'

// --- per-target palette -----------------------------------------------
// border = solid outer rim; blockA/blockB = the checker's two tones.
// Every entry is independent — recolor one target without touching any
// other. Defaults loosely echo each target's own name/color.
export const TARGET_GROUND_MAT_COLORS = {
  target_tan: { border: '#8a5a2c', blockA: '#a9743a', blockB: '#c9925a' },
  triple_target_grey: { border: '#4a4a4a', blockA: '#6b6b6b', blockB: '#8c8c8c' },
  target_red: { border: '#c40f0f', blockA: '#e01414', blockB: '#ff2c22' },
  target_yellow: { border: '#c48a00', blockA: '#e0a800', blockB: '#ffc722' },
  target_grey: { border: '#3a3a3a', blockA: '#5c5c5c', blockB: '#7d7d7d' },
  vortex_target: { border: '#5b12a3', blockA: '#7c1fd1', blockB: '#9b3bff' },
  grand_gold_multi_target: { border: '#8a6a00', blockA: '#c99a00', blockB: '#ffd42c' },
  triple_target_gold: { border: '#7a5800', blockA: '#b58600', blockB: '#e6b800' },
  target_blue: { border: '#0f3fc4', blockA: '#1454e0', blockB: '#2c78ff' },
}
