import { useEffect, useMemo } from 'react'
import { MATERIAL_PBR } from '../data/materials.js'
import { makeStudTexture } from '../systems/studTexture.js'

// Ground plane — a green studded (LEGO/Bloxity-style) floor authored in code
// (Tech.md §3: level layout is code, not a Blender file). Look and transform
// both track the Blender reference object `ground_plane_checker_green` /
// material `ground_checker_green`: a two-tone green checker, now with a
// bevelled stud grid baked into each cell (the technique a reference
// project's world uses for its own floor/grass/dirt materials — see
// Tech.md's amendment note), drawn to a CanvasTexture so it costs nothing to
// download (Tech.md §7) and stays one draw call on a MeshStandardMaterial.
// Position matches the reference's location (727.326, 0, 0 in Blender Z-up;
// rotation 0; object origin at the plane's geometric centre) so the code
// floor sits exactly where the reference does. The reference carries an
// unapplied object scale of (2.027, 1, 1) on X — width/depth below are its
// world-space dimensions in metres, which already bake that scale in.
const GROUND_WIDTH = 1820.7913818359375 // Blender world X (dimensions.x)
const GROUND_DEPTH = 137.60633850097656 // Blender world Y (dimensions.y)
const GROUND_POSITION = [727.3260498046875, 0, 0] // Blender Z-up -> three Y-up
const CELL = 2 // metres per checker cell (matches the old grid pitch)
const STUDS_PER_CELL = 4 // studs per cell, each stud on a CELL/STUDS_PER_CELL = 0.5m pitch
// Darkened off the originally-authored '#54a739'/'#84ce54' (first pass
// '#45892f'/'#6ca945' at -18% still read too bright, so this is a second,
// steeper cut — roughly -39% off the original): the ground is a large,
// nearly-horizontal plane facing almost straight up into both the
// hemisphere light's sky term and ShadowSun's elevated key light, so it
// catches far more direct light (high N·L) than a vertical wall face at the
// same roughness/metalness ever does — walls read fine at MATERIAL_PBR.
// GROUND's shared tuning, but the ground plane alone was clipping toward
// white. Fixed here (this file's own albedo), not in the shared PBR preset,
// since every other MATERIAL_PBR.GROUND surface (Road.jsx, BuildingBlocks,
// GrassBlocks) is unaffected and shouldn't be darkened along with it.
const DARK = '#346723'
const LIGHT = '#517f34'

function makeGroundTexture() {
  return makeStudTexture({
    light: LIGHT,
    dark: DARK,
    studsPerCell: STUDS_PER_CELL,
    repeatX: GROUND_WIDTH / (CELL * 2),
    repeatY: GROUND_DEPTH / (CELL * 2),
  })
}

export default function Ground() {
  const texture = useMemo(makeGroundTexture, [])
  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={GROUND_POSITION} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[GROUND_WIDTH, GROUND_DEPTH]} />
      <meshStandardMaterial map={texture} {...MATERIAL_PBR.GROUND} />
    </mesh>
  )
}
