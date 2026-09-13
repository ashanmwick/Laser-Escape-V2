import * as THREE from 'three'

// Recreates hex_power_pad.glb's material — a MeshStandardMaterial carrying
// two baked PNGs (hexpad_albedo / hexpad_emissive, see propModel.js's
// convertMaterial) — as GLSL instead of sampled bitmaps, via
// MeshLambertMaterial.onBeforeCompile (Tech.md §7: Lambert only). Colors and
// geometry below were hand-measured off the source PNGs by decoding their
// pixels directly (no image library in this project):
//  - a nested-hexagon "target" ring: background #b8bad1, two #db656f rings
//    with a #b8bad1 gap between them, dark #4d0000 fill at the center
//  - a radial #ff0f0d glow inside that fill, fading to #4d0000 at its edge
//  - an unrelated 18-times-repeating dash trim across the bottom ~6% of v
//    (the prop's side-bevel faces, sharing the same UV atlas): #656673
//    dashes over #b8bad1, with a flat #9395a7 band below them
// All colors below are already sRGB->linear converted (three's working
// color space), matching what sampling the (sRGB-tagged) source textures
// would have produced.
//
// hpT is the per-pixel "hex radius": exactly 1.0 on the outer hex edge at
// every angle, found by scaling the circumradius (0.3271, in the 0..1 UV
// square) by a regular hexagon's edge/vertex ratio
// (cos30°/cos(theta mod 60° − 30°)) — so every ring boundary below is just a
// threshold on hpT rather than its own distance field. The hex is centered
// at uv (0.5, 0.419): the atlas leaves headroom under it for the trim strip.
//
// uRecolor/uTargetColor (owned/equipped state, set from HexPowerPadProp.jsx)
// only ever get mixed into the ring/fill/glow branches below — the plate
// background, the ring gap, and the trim strip are never touched, so buying
// or equipping a pad recolors just its red ring pattern, not the whole prop.
const PATTERN_GLSL = `
  vec2 hpUv = vMapUv;
  vec3 hpAlbedo = vec3(0.4793, 0.4910, 0.6376);
  vec3 hpGlow = vec3(0.0);
  if (hpUv.y > 0.96387) {
    hpAlbedo = vec3(0.2918, 0.3005, 0.3864);
  } else if (hpUv.y > 0.93652) {
    float hpM = mod(hpUv.x, 0.055556) / 0.055556;
    hpAlbedo = hpM < 0.46 ? vec3(0.1301, 0.1329, 0.1714) : vec3(0.4793, 0.4910, 0.6376);
  } else {
    vec2 hpP = hpUv - vec2(0.5, 0.419);
    float hpTheta = mod(atan(hpP.y, hpP.x), 1.0471975512);
    float hpEdge = 0.8660254038 / cos(hpTheta - 0.5235987756);
    float hpT = length(hpP) / (0.3271 * hpEdge);
    vec3 hpRingColor = mix(vec3(0.7084, 0.1301, 0.1590), uTargetColor, uRecolor);
    vec3 hpFillColor = mix(vec3(0.0742, 0.0, 0.0), uTargetColor * 0.08, uRecolor);
    vec3 hpGlowColor = mix(vec3(1.0, 0.0048, 0.0040), uTargetColor, uRecolor);
    if (hpT < 0.5821) {
      float hpFall = pow(1.0 - clamp(hpT / 0.5821, 0.0, 1.0), 1.5);
      hpAlbedo = hpFillColor;
      hpGlow = mix(hpFillColor, hpGlowColor, hpFall);
    } else if (hpT < 0.7642) {
      hpAlbedo = hpRingColor;
      hpGlow = hpGlowColor;
    } else if (hpT < 0.8597) {
      hpAlbedo = vec3(0.4793, 0.4910, 0.6376);
    } else if (hpT < 1.0) {
      hpAlbedo = hpRingColor;
      hpGlow = hpGlowColor;
    }
  }
`

// Exists only so three defines USE_MAP (and thus declares/populates
// `vMapUv`) at compile time — see onBeforeCompile below. Never sampled.
const DUMMY_MAP = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
DUMMY_MAP.needsUpdate = true

// HexPowerPadProp.jsx needs one independently recolorable material per
// placed pad (its own buy/equip state), so this is a factory, not a shared
// singleton. uRecolor/uTargetColor live in a plain object created up front
// and merged into shader.uniforms on first compile — HexPowerPadProp's
// applyColor() runs synchronously right after the material is built, before
// any render has triggered onBeforeCompile, so it mutates these objects
// directly rather than shader.uniforms itself.
export function createHexPowerPadMaterial() {
  const uniforms = {
    uRecolor: { value: 0 },
    uTargetColor: { value: new THREE.Color(0xffffff) },
  }

  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 3.5, // KHR_materials_emissive_strength on the source glTF material
    map: DUMMY_MAP,
  })

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uRecolor;\nuniform vec3 uTargetColor;'
      )
      .replace('#include <map_fragment>', `${PATTERN_GLSL}\n  diffuseColor.rgb *= hpAlbedo;`)
      .replace('#include <emissivemap_fragment>', '  totalEmissiveRadiance *= hpGlow;')
  }

  material.userData.hexPadUniforms = uniforms
  return material
}
