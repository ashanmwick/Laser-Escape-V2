// Data for the 15 `hex_power_pad.NNN` prop instances (Tech.md §4), collection
// `PowerPad` in the .blend. All 15 are duplicates of one Blender mesh/material
// set (hex_power_pad.001) differing only in placement — same pattern as
// power_podium/target_podium (data/podium.js): one glTF exported from just
// the first object, reused per instance via propModel.js's url cache.
export const HEX_POWER_PAD_MODEL_URL = '/models/hex_power_pad.glb'

// Blender world locations (collection `PowerPad`), read directly off each of
// the 15 objects. None of them carry rotation, so — unlike target_podium —
// no per-instance yaw is needed. ground_plane sits at Blender z=0, so these
// z's need no zFit correction either: the rise across the three rows
// (1.617 / 3.398 / 5.159) is a deliberate staircase of pads, not a modelling
// offset to flatten out. Scale (0.8031226396560669, shared by all 15) is
// baked into the exported glTF node and left alone, exactly as podium's is.
const BLENDER_LOCATIONS = [
  [6.013635635375977, 12, 0.1],
  [9.509613037109375, 12, 0.1],
  [13.16979694366455, 12, 0.1],
  [17.18240737915039, 12, 0.1],
  [21.076248168945312, 12, 0.1],
  [21.076248168945312, 16, 2.8],
  [17.18240737915039, 16, 2.8],
  [13.16979694366455, 16, 2.8],
  [9.509613037109375, 16, 2.8],
  [6.013635635375977, 16, 2.8],
  [6.013635635375977, 21, 5.3],
  [9.509613037109375, 21, 5.3],
  [13.16979694366455, 21, 5.3],
  [17.18240737915039, 21, 5.3],
  [21.076248168945312, 21, 5.3],
]

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own convention
// (verified against each exported node's translation, same as data/podium.js):
// three.x = blender.x, three.y = blender.z, three.z = -blender.y.
function toThree([bx, by, bz]) {
  return [bx, bz, -by]
}

export const HEX_POWER_PAD_POSITIONS = BLENDER_LOCATIONS.map(toThree)

// Metres from a pad's placement position within which the buy/equip prompt
// appears and E is allowed to act on it — same idea as data/afk.js's
// AFK_RANGE, sized smaller since pads sit ~3.5m apart in a grid and each
// prompt should only ever address the one pad the player is standing at.
export const HEX_POWER_PAD_RANGE = 2.5

// Laser tier unlocked by each pad, in hex_power_pad.001-015 order (index 0 =
// .001). `powerPerAction` becomes the player's powerPerAction on equip
// (store/useGameStore.js equipHexPad); `winsRequired` gates buyHexPad — the
// player's wins must have reached it, and that amount is spent on purchase.
// `beamColor` tints that pad's label laser strip (HexPowerPadLabel.jsx) —
// a cool-to-hot progression so the strip reads as escalating power at a
// glance across the 15 tiers, same idea as a laser's `beamColor` in
// lasers.js.
export const HEX_POWER_PAD_TIERS = [
  { powerPerAction: 1, winsRequired: 0, beamColor: '#4fd6ff' },
  { powerPerAction: 2, winsRequired: 1, beamColor: '#38bdf8' },
  { powerPerAction: 5, winsRequired: 5, beamColor: '#22d3ee' },
  { powerPerAction: 10, winsRequired: 25, beamColor: '#34d399' },
  { powerPerAction: 25, winsRequired: 100, beamColor: '#a3e635' },
  { powerPerAction: 50, winsRequired: 250, beamColor: '#facc15' },
  { powerPerAction: 100, winsRequired: 750, beamColor: '#fb923c' },
  { powerPerAction: 150, winsRequired: 2500, beamColor: '#f97316' },
  { powerPerAction: 250, winsRequired: 7500, beamColor: '#f43f5e' },
  { powerPerAction: 400, winsRequired: 25000, beamColor: '#ec4899' },
  { powerPerAction: 700, winsRequired: 50000, beamColor: '#d946ef' },
  { powerPerAction: 1000, winsRequired: 100000, beamColor: '#a855f7' },
  { powerPerAction: 1500, winsRequired: 250000, beamColor: '#8b5cf6' },
  { powerPerAction: 2500, winsRequired: 750000, beamColor: '#6366f1' },
  { powerPerAction: 3500, winsRequired: 2500000, beamColor: '#ff2b2b' },
]

// Recolor targets for HexPowerPadProp.jsx's per-instance material clones.
// Not-owned stays whatever red the material was authored with in Blender —
// no override needed for that state.
export const HEX_POWER_PAD_OWNED_COLOR = '#ffffff'
export const HEX_POWER_PAD_EQUIPPED_COLOR = '#22c55e'
