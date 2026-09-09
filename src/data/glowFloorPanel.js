// Data for the 25 `glow_floor_panel[.NNN]` prop instances (Tech.md §4),
// collection `WinPanel` in the .blend — Tech.md §3/§6's "win pad", one per
// wall along the lane (data/wallProps.js is also 25). All 25 are exact
// duplicates (same 12-tri mesh, identical object bound box
// [-1.2..1.2, -0.9..0.9, 0..0.5629], zero rotation, uniform scale
// 2.757075548) differing only in placement — so, same pattern as
// hex_power_pad (data/hexPowerPad.js), only the base object was exported and
// is reused per instance via propModel.js's url cache.
//
// Re-synced from the .blend: the collection grew 8 -> 25 (17 panels added,
// `glow_floor_panel.008` .. `.024`). The first 8 locations are unchanged from
// the original import and left byte-for-byte. The base `glow_floor_panel`
// mesh and its material were verified unchanged against the committed
// `glow_floor_panel.glb` (POSITION count 48, same vert coords / UVs, same
// node graph), so no re-export was run — this is a placement-only sync.
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
// loader change was needed — that conversion is the whole "optimize the
// material to suit the game" step (Tech.md §7: no MeshStandardMaterial).
export const GLOW_FLOOR_PANEL_MODEL_URL = '/models/glow_floor_panel.glb'

// Blender world locations (collection `WinPanel`), read directly off each of
// the 25 objects. Every panel shares y = -20.847389221191406 and
// z = -0.13497599959373474; only x steps along the lane (~55-65 units apart,
// paced to data/wallProps.js's walls). None carry rotation, so — like
// hex_power_pad — no per-instance yaw is needed. Scale (2.757075548171997,
// shared by all 25) is baked into the exported glTF node and left alone.
// Kept as exact as-authored transforms (no zFit) per the import instruction.
const BLENDER_LOCATIONS = [
  [90.46635437011719, -20.847389221191406, -0.13497599959373474],
  [150.47401428222656, -20.847389221191406, -0.13497599959373474],
  [214.010009765625, -20.847389221191406, -0.13497599959373474],
  [278.8433837890625, -20.847389221191406, -0.13497599959373474],
  [340.5712585449219, -20.847389221191406, -0.13497599959373474],
  [407.2044677734375, -20.847389221191406, -0.13497599959373474],
  [466.42767333984375, -20.847389221191406, -0.13497599959373474],
  [531.6871948242188, -20.847389221191406, -0.13497599959373474],
  [589.3590698242188, -20.847389221191406, -0.13497599959373474],
  [655.269775390625, -20.847389221191406, -0.13497599959373474],
  [717.8849487304688, -20.847389221191406, -0.13497599959373474],
  [781.27001953125, -20.847389221191406, -0.13497599959373474],
  [841.823486328125, -20.847389221191406, -0.13497599959373474],
  [904.939697265625, -20.847389221191406, -0.13497599959373474],
  [964.6048583984375, -20.847389221191406, -0.13497599959373474],
  [1024.7398681640625, -20.847389221191406, -0.13497599959373474],
  [1085.8446044921875, -20.847389221191406, -0.13497599959373474],
  [1146.9493408203125, -20.847389221191406, -0.13497599959373474],
  [1211.79443359375, -20.847389221191406, -0.13497599959373474],
  [1275.0687255859375, -20.847389221191406, -0.13497599959373474],
  [1333.597412109375, -20.847389221191406, -0.13497599959373474],
  [1400.167236328125, -20.847389221191406, -0.13497599959373474],
  [1457.1800537109375, -20.847389221191406, -0.13497599959373474],
  [1520.454345703125, -20.847389221191406, -0.13497599959373474],
  [1581.4217529296875, -20.847389221191406, -0.13497599959373474],
]

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own convention
// (verified against the exported node's translation, same as
// data/hexPowerPad.js / data/podium.js): three.x = blender.x,
// three.y = blender.z, three.z = -blender.y.
function toThree([bx, by, bz]) {
  return [bx, bz, -by]
}

export const GLOW_FLOOR_PANEL_POSITIONS = BLENDER_LOCATIONS.map(toThree)

// Flat Wins granted the moment the player steps onto each panel, in
// glow_floor_panel[.NNN] order (index 0 = the base object, index 24 =
// glow_floor_panel.024 behind the last wall). Same curve the original 8 used
// — 1, 10, then +50 per panel — extended through the 17 new pads, which
// tracks data/wallHealth.js's own linear +50-per-stage wall strength. Wins
// are a threshold currency, never spent — see store/useGameStore.js
// buyHexPad — so this just adds to the running total (store awardWins,
// driven once-per-entry by systems/glowFloorPanel.js).
export const GLOW_FLOOR_PANEL_WINS = [
  1, 10, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550,
  600, 650, 700, 750, 800, 850, 900, 950, 1000, 1050, 1100, 1150,
]

// Horizontal (X/Z) distance from a panel's placement position within which
// the player counts as standing on it — the trigger radius for the Wins
// award and for showing its floating label as "reached". Panels sit ~55-65
// Blender units apart along the lane, so there is no risk of two zones
// overlapping; sized to roughly the scaled panel footprint plus a little
// slack. Tune here if the panel mesh size changes.
export const GLOW_FLOOR_PANEL_RANGE = 3.5
