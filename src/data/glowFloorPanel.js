// Data for the 8 `glow_floor_panel[.NNN]` prop instances (Tech.md §4),
// collection `WinPanel` in the .blend — Tech.md §3/§6's "win pad", one per
// wall along the lane. All 8 are exact duplicates (same 12-tri mesh, same
// albedo/emissive textures — verified by pixel hash) differing only in
// placement, so — same pattern as hex_power_pad (data/hexPowerPad.js) — only
// the base object was exported, reused per instance via propModel.js's url
// cache.
//
// The source material (`glow_floor_panel_mat`) was authored with Eevee
// blend_method HASHED despite nothing feeding its Alpha input (verified via
// the node graph — Alpha stays the default constant 1, only Base Color and
// Emission Color are linked to textures), which would have exported an
// unnecessary glTF alphaMode:BLEND. Set to OPAQUE for the export only, then
// restored to HASHED immediately after — leaving the .blend untouched — same
// as-authored-for-Eevee/restore-after pattern data/targets.js documents for
// the unlinked normal map. The emissive+map case is already the one
// propModel.js's convertMaterial builds as Lambert with both channels, so no
// loader change was needed.
export const GLOW_FLOOR_PANEL_MODEL_URL = '/models/glow_floor_panel.glb'

// Blender world locations (collection `WinPanel`), read directly off each of
// the 8 objects. None carry rotation, so — like hex_power_pad — no
// per-instance yaw is needed. Scale (2.757075548171997, shared by all 8) is
// baked into the exported glTF node and left alone. Kept as exact
// as-authored transforms (no zFit) per the import instruction.
const BLENDER_LOCATIONS = [
  [90.46635437011719, -20.847389221191406, -0.13497599959373474],
  [150.47401428222656, -20.847389221191406, -0.13497599959373474],
  [214.010009765625, -20.847389221191406, -0.13497599959373474],
  [278.8433837890625, -20.847389221191406, -0.13497599959373474],
  [340.5712585449219, -20.847389221191406, -0.13497599959373474],
  [407.2044677734375, -20.847389221191406, -0.13497599959373474],
  [466.42767333984375, -20.847389221191406, -0.13497599959373474],
  [531.6871948242188, -20.847389221191406, -0.13497599959373474],
]

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own convention
// (verified against the exported node's translation, same as
// data/hexPowerPad.js / data/podium.js): three.x = blender.x,
// three.y = blender.z, three.z = -blender.y.
function toThree([bx, by, bz]) {
  return [bx, bz, -by]
}

export const GLOW_FLOOR_PANEL_POSITIONS = BLENDER_LOCATIONS.map(toThree)
