// Data for the 9 distinct objects in collection `Targets` (Tech.md §4): each
// is its own mesh + material (unlike hex_power_pad's 15 duplicates of one
// mesh — data/hexPowerPad.js — or power_podium's shared pair —
// data/podium.js), so this table holds one glTF url and one placement per
// object rather than a single shared url.
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
const TARGETS = [
  { id: 'grand_gold_multi_target', location: [11.827247619628906, -21.319271087646484, 5.127264022827148] },
  { id: 'target_blue', location: [21.169179916381836, -21.508007049560547, 5.127264022827148] },
  { id: 'target_grey', location: [20.82526969909668, -14.4826021194458, 1.443403720855713] },
  { id: 'target_red', location: [13.280399322509766, -14.409980773925781, 1.443403720855713] },
  { id: 'target_tan', location: [6.423081874847412, -14.25895881652832, 1.443403720855713] },
  { id: 'target_yellow', location: [16.842227935791016, -14.410845756530762, 1.443403720855713] },
  { id: 'triple_target_gold', location: [16.673744201660156, -21.421863555908203, 5.127264022827148] },
  { id: 'triple_target_grey', location: [9.838366508483887, -14.381477355957031, 1.443403720855713] },
  { id: 'vortex_target', location: [6.753562927246094, -21.04584503173828, 5.127264022827148] },
]

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own convention
// (same remap as data/hexPowerPad.js / data/podium.js): three.x = blender.x,
// three.y = blender.z, three.z = -blender.y. None of these nine carry
// rotation in the .blend, so — like hex_power_pad — no per-instance yaw is
// needed; each object's own scale (3.038213014602661, uniform across all
// nine) is baked into its exported glTF node and left alone.
function toThree([bx, by, bz]) {
  return [bx, bz, -by]
}

export const TARGET_PROPS = TARGETS.map((t) => ({
  id: t.id,
  url: `/models/${t.id}.glb`,
  position: toThree(t.location),
}))

// Local-space (X, Z centred on the pivot — measured true for all nine glTFs)
// offset from each target's placement position up to its "top area" — the
// point systems/afk.js's auto-fire aims at. Measured from each glTF's own
// POSITION accessor bounds (already carrying the baked ~3.038 scale, so
// these are world-scale metres): full mesh height ranges 3.42–4.62m; each
// entry below is ~85% of that, landing on the upper body rather than the
// very tip. Tune per id here — purely visual, no gameplay effect beyond
// where the beam is aimed.
export const TARGET_AIM_OFFSET = {
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

// World-space point systems/afk.js's auto-fire aims at, per target id.
export const TARGET_AIM_POINT = Object.fromEntries(
  TARGET_PROPS.map((t) => {
    const offset = TARGET_AIM_OFFSET[t.id]
    return [t.id, [t.position[0] + offset[0], t.position[1] + offset[1], t.position[2] + offset[2]]]
  }),
)

// id -> TARGET_PROPS entry, for systems/afk.js's proximity scan.
export const TARGET_BY_ID = new Map(TARGET_PROPS.map((t) => [t.id, t]))
