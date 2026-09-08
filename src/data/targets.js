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
