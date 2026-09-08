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
  [6.013635635375977, 11.534214973449707, 1.6172031164169312],
  [9.509613037109375, 11.534214973449707, 1.6172031164169312],
  [13.16979694366455, 11.534214973449707, 1.6172031164169312],
  [17.18240737915039, 11.534214973449707, 1.6172031164169312],
  [21.076248168945312, 11.534214973449707, 1.6172031164169312],
  [21.076248168945312, 16.12332534790039, 3.398143768310547],
  [17.18240737915039, 16.12332534790039, 3.398143768310547],
  [13.16979694366455, 16.12332534790039, 3.398143768310547],
  [9.509613037109375, 16.12332534790039, 3.398143768310547],
  [6.013635635375977, 16.12332534790039, 3.398143768310547],
  [6.013635635375977, 19.660818099975586, 5.158815383911133],
  [9.509613037109375, 19.660818099975586, 5.158815383911133],
  [13.16979694366455, 19.660818099975586, 5.158815383911133],
  [17.18240737915039, 19.660818099975586, 5.158815383911133],
  [21.076248168945312, 19.660818099975586, 5.158815383911133],
]

// Blender Z-up -> three.js Y-up, matching the glTF exporter's own convention
// (verified against each exported node's translation, same as data/podium.js):
// three.x = blender.x, three.y = blender.z, three.z = -blender.y.
function toThree([bx, by, bz]) {
  return [bx, bz, -by]
}

export const HEX_POWER_PAD_POSITIONS = BLENDER_LOCATIONS.map(toThree)
