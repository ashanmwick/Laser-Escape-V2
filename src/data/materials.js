// PBR roughness/metalness convention, by surface type (Tech.md §4/§7: every
// tunable number lives in data/). Added when the engine moved from flat
// MeshLambertMaterial to MeshStandardMaterial for a richer, more reflective
// look (modeled on a reference project's approach — see Tech.md's amendment
// note near the top of the file). MeshBasicMaterial (unlit glow/HUD/decal
// elements) is unaffected and stays out of this table entirely.
//
// roughness: 0 = mirror-smooth, 1 = fully matte. metalness: 0 = dielectric
// (plastic/wood/stone/glass), 1 = metal. Values are starting points, tuned
// visually against the scene's new key light + fake env map, not derived
// from any measured reference.
export const MATERIAL_PBR = {
  GROUND: { roughness: 0.9, metalness: 0 }, // ground, road, dirt, grass, building blocks
  WOOD: { roughness: 0.75, metalness: 0 }, // podium stage, wood crates
  FLAT_PLACEHOLDER: { roughness: 0.8, metalness: 0 }, // obstacles, player/remote-player fallback capsules, wall debris
  GLASS: { roughness: 0.1, metalness: 0 }, // PvpWall panel
  HEX_POWER_PAD: { roughness: 0.45, metalness: 0.15 }, // hex power pad plate
  CRYSTAL: { roughness: 0.2, metalness: 0 }, // merchant shop "crystal" buckets
  AVATAR_DEFAULT: { roughness: 0.7, metalness: 0 }, // fallback when a source glTF material carries no roughness/metalness
  PROP_DEFAULT: { roughness: 0.7, metalness: 0 }, // fallback for propModel.js's generic conversion branch
}
