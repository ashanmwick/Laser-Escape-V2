// Data for the 9 distinct objects in collection `Targets` (Tech.md §4): each
// is its own mesh + material (unlike hex_power_pad's 15 duplicates of one
// mesh — data/hexPowerPad.js), so this table holds one glTF url and its own
// placement per object.
//
// Two of the nine (grand_gold_multi_target, vortex_target) carry an
// emissive texture alongside their base map — propModel.js's convertMaterial
// picks that case up automatically (Lambert with both channels, same as
// hex_power_pad). The other seven were authored with a normal map for
// Blender's viewport only; Tech.md §7 permits just Lambert/Basic, which has
// no normal-map input, so the Normal Map -> Principled BSDF link was
// unlinked before export (and restored after, leaving the .blend
// untouched) to keep each glTF from carrying a texture the game can never
// use.
//
// Placement was originally each object's own Blender-authored `location`,
// sitting on the Blender-authored target_podium's own steps. target_podium
// has since been retired in favour of a second instance of the
// code-generated `podium_stage` prop (data/podiumStage.js
// PODIUM_STAGE_TARGET_TRANSFORM), which now builds from a 3-tier profile
// (PODIUM_STAGE_TARGET_PROFILE) — only its bottom two tiers carry targets;
// tier 2, the topmost, right below the sign, is left bare on purpose. See
// TARGET_PLACEMENTS below: each target gets its own line (tier + local X +
// Z-bias on that tier), tuned independently rather than spread by formula,
// but still resolved through the profile's own tierSpan()/localToWorld
// rather than hand-baked world literals — the Target podium's tier count,
// depth and scale have each changed more than once already, and a fully
// baked table went stale every time.
import {
  localToWorld,
  PODIUM_STAGE_TARGET_PROFILE,
  PODIUM_STAGE_TARGET_TRANSFORM,
} from './podiumStage.js'

// Uniform extra scale on top of each glTF's own baked node scale (~3.038,
// left alone by propModel.js — see its own comment) — shrinks all nine
// target props to 0.8x their prior on-screen size. Applied by TargetProp.jsx
// (components/TargetProp.jsx `scale` prop) and folded into TARGET_AIM_OFFSET
// below so the auto-fire aim point (systems/afk.js) still lands on the
// (now smaller) model instead of floating above its actual top.
export const TARGET_SCALE = 0.8

// One line per target, editable independently — no automatic spread across
// a row any more. `tier` picks which of the Target podium's own tiers (0 or
// 1; see data/podiumStage.js PODIUM_STAGE_TARGET_PROFILE — tier 2 is left
// bare) it stands on. `x` is its local-space X offset in metres, BEFORE the
// podium's own `scale` (PODIUM_STAGE_TARGET_TRANSFORM.scale) — 0 is that
// tier's own centreline, negative is stage-left, positive stage-right.
// `zBias` is where along the tier's own depth it sits: 0 = the tier's back
// edge, 1 = its front edge (0.5 centres it). The x values below reproduce
// the evenly-spread layout this table replaces (~1.5 m clear of each tier's
// own edge at the podium's current scale) — move any single line to retune
// that one target without touching the rest.
const TARGET_PLACEMENTS = [
  { id: 'target_tan', tier: 0, x: -1.2692307692307692, zBias: 0.2 },
  { id: 'triple_target_grey', tier: 0, x: -0.6346153846153846, zBias: 0.2 },
  { id: 'target_red', tier: 0, x: 0, zBias: 0.2 },
  { id: 'target_yellow', tier: 0, x: 0.6346153846153846, zBias: 0.2 },
  { id: 'target_grey', tier: 0, x: 1.2692307692307692, zBias: 0.2 },
  { id: 'vortex_target', tier: 1, x: -1.2692307692307692, zBias: 0.2 },
  { id: 'grand_gold_multi_target', tier: 1, x: -0.423076923076923, zBias: 0.2 },
  { id: 'triple_target_gold', tier: 1, x: 0.42307692307692313, zBias: 0.2 },
  { id: 'target_blue', tier: 1, x: 1.2692307692307692, zBias: 0.2 },
]

export const TARGET_PROPS = TARGET_PLACEMENTS.map(({ id, tier, x, zBias }) => {
  const span = PODIUM_STAGE_TARGET_PROFILE.tierSpan(tier)
  const localZ = span.z0 + zBias * (span.z1 - span.z0)
  return {
    id,
    url: `/models/${id}.glb`,
    position: localToWorld(PODIUM_STAGE_TARGET_TRANSFORM, x, span.top, localZ),
    scale: TARGET_SCALE,
  }
})

// Local-space (X, Z centred on the pivot — measured true for all nine glTFs)
// offset from each target's placement position up to its "top area" — the
// point systems/afk.js's auto-fire aims at. Measured from each glTF's own
// POSITION accessor bounds at the glTF's own baked scale (before
// TARGET_SCALE): full mesh height ranges 3.42–4.62m; each entry below is
// ~85% of that, landing on the upper body rather than the very tip. Tune per
// id here — purely visual, no gameplay effect beyond where the beam is
// aimed. Scaled by TARGET_SCALE below since the actual mounted model is now
// that much smaller.
const TARGET_AIM_OFFSET_BASE = {
  grand_gold_multi_target: [0, 2.9, 0],
  target_blue: [0, 3.9, 0],
  target_grey: [0, 3.9, 0],
  target_red: [0, 3.9, 0],
  target_tan: [0, 3.9, 0],
  target_yellow: [0, 3.9, 0],
  triple_target_gold: [0, 3.7, 0],
  triple_target_grey: [0, 3.7, 0],
  vortex_target: [0, 2.9, 0],
}
export const TARGET_AIM_OFFSET = Object.fromEntries(
  Object.entries(TARGET_AIM_OFFSET_BASE).map(([id, [x, y, z]]) => [
    id,
    [x * TARGET_SCALE, y * TARGET_SCALE, z * TARGET_SCALE],
  ]),
)

// World-space point systems/afk.js's auto-fire aims at, per target id.
export const TARGET_AIM_POINT = Object.fromEntries(
  TARGET_PROPS.map((t) => {
    const offset = TARGET_AIM_OFFSET[t.id]
    return [t.id, [t.position[0] + offset[0], t.position[1] + offset[1], t.position[2] + offset[2]]]
  }),
)

// id -> TARGET_PROPS entry, for systems/afk.js's proximity scan.
export const TARGET_BY_ID = new Map(TARGET_PROPS.map((t) => [t.id, t]))
