import { useEffect, useMemo } from 'react'
import { MATERIAL_PBR } from '../data/materials.js'
import { makeStudTexture, shade } from '../systems/studTexture.js'
import {
  PVP_CENTER_PENTAGON_ROTATION_Y,
  PVP_CENTER_PENTAGON_CELL,
  PVP_CENTER_PENTAGON_TIERS,
} from '../data/pvpCenterPentagon.js'

const SIDES = 5

// One pentagon-prism slab: recolored stud checker on the top cap and the 5
// side faces (own texture per surface — see the header note below for why),
// plain shaded fill on the underside. `position` is this slab's own centre,
// so stacking one on another (below) is just "next slab's centre y =
// previous slab's top y".
function PentagonSlab({ radius, height, color, position, rotationY }) {
  const diameter = radius * 2
  // Regular pentagon's true edge-to-edge perimeter (not the circumscribed
  // circle's 2*pi*r, which overstates a 5-flat-face wrap by ~7%).
  const perimeter = 2 * radius * SIDES * Math.sin(Math.PI / SIDES)

  // Same value for light and dark, plus plateBevel off: makeStudTexture's
  // 2x2 checker cells all paint identically and get no per-cell edge strip,
  // so neither the checkerboard alternation nor its seam lines show — just
  // one continuous studded plate (the per-stud highlight stays).
  const topTexture = useMemo(
    () =>
      makeStudTexture({
        light: color,
        dark: color,
        repeatX: diameter / (PVP_CENTER_PENTAGON_CELL * 2),
        repeatY: diameter / (PVP_CENTER_PENTAGON_CELL * 2),
        studShadow: false,
        plateBevel: false,
      }),
    [color, diameter],
  )
  const sideTexture = useMemo(
    () =>
      makeStudTexture({
        light: color,
        dark: color,
        repeatX: perimeter / (PVP_CENTER_PENTAGON_CELL * 2),
        repeatY: height / (PVP_CENTER_PENTAGON_CELL * 2),
        studShadow: false,
        plateBevel: false,
      }),
    [color, perimeter, height],
  )
  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(() => () => topTexture.dispose(), [topTexture])
  useEffect(() => () => sideTexture.dispose(), [sideTexture])

  const bottomColor = shade(color, -0.25)

  return (
    <mesh position={position} rotation-y={rotationY} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, SIDES]} />
      <meshStandardMaterial attach="material-0" map={sideTexture} {...MATERIAL_PBR.GROUND} />
      <meshStandardMaterial attach="material-1" map={topTexture} {...MATERIAL_PBR.GROUND} />
      <meshStandardMaterial attach="material-2" color={bottomColor} {...MATERIAL_PBR.GROUND} />
    </mesh>
  )
}

// A stack of pentagon-prism slabs marking the middle of the Pvp zone (data/
// pvpCenterPentagon.js documents how the stack's X/Z position was derived,
// and generates PVP_CENTER_PENTAGON_TIERS — a wide purple base tier, then
// alternating purple/yellow tiers on top of each other, each 0.98x the
// radius and 0.85x the height of the tier below it, each already carrying
// its own stacked `position`). All tiers are CylinderGeometry with 5 radial
// segments (a pentagonal prism); no Blender source, fully code-generated the
// same way as TargetGroundMat.jsx. Solid, climbable ground, not just a
// decorative mesh: data/pvpCenterPentagon.js's PVP_CENTER_PENTAGON_AABBS
// (one box per tier) is registered into data/hub.js's HUB_AABBS, the same
// static collider list every other hub prop scans against.
//
// "Same material as Ground, own color": Ground.jsx's floor look is a
// bevelled-stud checker CanvasTexture (systems/studTexture.js) under a
// MeshStandardMaterial at MATERIAL_PBR.GROUND — matching roughness/metalness
// alone renders as a flat, untextured color, so PentagonSlab repaints that
// same texture with light/dark shades derived from each tier's own color
// (same shade() helper Ground.jsx's own texture uses for its bevel tints).
//
// Each tier gets its own top-cap and side textures, not one shared across
// the whole geometry (or across tiers): a single map tuned for one surface
// and reused on another with a different aspect ratio reads "distorted" —
// each tier's side band is a thin ring wrapped around a much larger
// perimeter, while its top cap's UV spans only its own diameter.
export default function PvpCenterPentagon() {
  return (
    <>
      {PVP_CENTER_PENTAGON_TIERS.map((tier, i) => (
        <PentagonSlab
          key={i}
          radius={tier.radius}
          height={tier.height}
          color={tier.color}
          position={tier.position}
          rotationY={PVP_CENTER_PENTAGON_ROTATION_Y}
        />
      ))}
    </>
  )
}
