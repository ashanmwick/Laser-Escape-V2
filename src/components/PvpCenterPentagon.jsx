import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Billboard, Text } from '@react-three/drei'
import { MATERIAL_PBR } from '../data/materials.js'
import { makeStudTexture, shade } from '../systems/studTexture.js'
import {
  PVP_CENTER_PENTAGON_ROTATION_Y,
  PVP_CENTER_PENTAGON_CELL,
  PVP_CENTER_PENTAGON_TIERS,
  PVP_CENTER_CYLINDER_RADIUS,
  PVP_CENTER_CYLINDER_INNER_RADIUS,
  PVP_CENTER_CYLINDER_HEIGHT,
  PVP_CENTER_CYLINDER_COLOR,
  PVP_CENTER_CYLINDER_POSITION,
  PVP_CENTER_SUMMIT_DISC_RADIUS,
  PVP_CENTER_SUMMIT_DISC_HEIGHT,
  PVP_CENTER_SUMMIT_DISC_COLOR,
  PVP_CENTER_SUMMIT_DISC_POSITION,
  PVP_CENTER_SUMMIT_DISC_OPACITY,
  PVP_CENTER_SIGN,
  PVP_CENTER_SIGN_POSITION,
} from '../data/pvpCenterPentagon.js'

const PENTAGON_SIDES = 5
const ROUND_SIDES = 24 // smooth-looking circle for the summit disc — no collider to keep aligned with, unlike the pentagon tiers

// One prism slab (a pentagon at `sides` = 5, or a near-circular disc at a
// much higher `sides` — the summit disc below): recolored stud checker on
// the top cap and the `sides` side faces (own texture per surface — see the
// header note below for why), plain shaded fill on the underside.
// `position` is this slab's own centre, so stacking one on another (below)
// is just "next slab's centre y = previous slab's top y".
function PentagonSlab({ radius, height, color, position, rotationY, sides = PENTAGON_SIDES }) {
  const diameter = radius * 2
  // Regular N-gon's true edge-to-edge perimeter (not the circumscribed
  // circle's 2*pi*r, which overstates a low-N flat-face wrap — ~7% for a
  // pentagon, under 1% at the summit disc's 24 sides).
  const perimeter = 2 * radius * sides * Math.sin(Math.PI / sides)

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
      <cylinderGeometry args={[radius, radius, height, sides]} />
      <meshStandardMaterial attach="material-0" map={sideTexture} {...MATERIAL_PBR.GROUND} />
      <meshStandardMaterial attach="material-1" map={topTexture} {...MATERIAL_PBR.GROUND} />
      <meshStandardMaterial attach="material-2" color={bottomColor} {...MATERIAL_PBR.GROUND} />
    </mesh>
  )
}

// The summit cap: a hollow cylinder shell, an outer wall with a narrower one
// hollowed out of its middle ("a shell inside a shell" — data/
// pvpCenterPentagon.js's header note on PVP_CENTER_CYLINDER_INNER_RADIUS).
// CylinderGeometry has no hole option, so this is built from a 2D Shape
// (an outer circle with an inner circle as its `hole`) run through
// ExtrudeGeometry — three.js core, still nothing to download (Tech.md §7).
// ExtrudeGeometry extrudes a flat shape along its own local Z, and only
// gives 2 material groups, not CylinderGeometry's 3: group 0 is the "lid"
// faces (top AND bottom caps together — the shape-with-hole triangulated at
// both ends), group 1 is every side wall (outer AND inner, both at once).
// So the underside quietly reuses the same textured material as the top
// (nobody sees it to notice), and the inner wall reuses the outer wall's
// texture tuning (their radii are only 1m apart, so the texel-density
// mismatch is negligible) — coarser than PentagonSlab's per-surface
// materials, but dictated by the geometry type, not a shortcut taken here.
function RingShell({ outerRadius, innerRadius, height, color, position }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)
    const hole = new THREE.Path()
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
    shape.holes.push(hole)

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 64, // smooth true circle, independent of the 24-gon collider (data/pvpCenterPentagon.js)
    })
    // ExtrudeGeometry extrudes the flat shape (drawn in local X/Y) along its
    // own local Z, from 0 to `height` — translate then rotate onto three.js's
    // Y-up convention (matching every other prop's "position = centre"), the
    // same two-step data/pvpBlocks.js-style remap idea, just for a geometry
    // built directly instead of read off transforms.
    geo.translate(0, 0, -height / 2)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [outerRadius, innerRadius, height])
  useEffect(() => () => geometry.dispose(), [geometry])

  const outerPerimeter = 2 * Math.PI * outerRadius
  const topTexture = useMemo(
    () =>
      makeStudTexture({
        light: color,
        dark: color,
        repeatX: (outerRadius * 2) / (PVP_CENTER_PENTAGON_CELL * 2),
        repeatY: (outerRadius * 2) / (PVP_CENTER_PENTAGON_CELL * 2),
        studShadow: false,
        plateBevel: false,
      }),
    [color, outerRadius],
  )
  const sideTexture = useMemo(
    () =>
      makeStudTexture({
        light: color,
        dark: color,
        repeatX: outerPerimeter / (PVP_CENTER_PENTAGON_CELL * 2),
        repeatY: height / (PVP_CENTER_PENTAGON_CELL * 2),
        studShadow: false,
        plateBevel: false,
      }),
    [color, outerPerimeter, height],
  )
  useEffect(() => () => topTexture.dispose(), [topTexture])
  useEffect(() => () => sideTexture.dispose(), [sideTexture])

  return (
    // laserIgnore: this shell has no movement collider either (walk-through
    // by design, header comment above) — a laser must pass through it the
    // same way a player's body does, or it silently blocks PVP shots fired
    // across the King of the Hill summit it rings.
    <mesh geometry={geometry} position={position} castShadow receiveShadow userData={{ laserIgnore: true }}>
      <meshStandardMaterial attach="material-0" map={topTexture} {...MATERIAL_PBR.GROUND} />
      <meshStandardMaterial attach="material-1" map={sideTexture} {...MATERIAL_PBR.GROUND} />
    </mesh>
  )
}

// The summit disc's glass look: same recipe as PvpWall.jsx's panel (data/
// pvpWall.js's PVP_WALL_MATERIAL) — an alpha-blended, low-roughness
// MeshStandardMaterial (MATERIAL_PBR.GLASS), no texture map at all (a
// stud-textured surface reads as a solid plastic plate no matter how low
// its opacity goes, not glass), DoubleSide so the underside doesn't
// disappear at a glancing angle, depthWrite off so overlapping transparent
// surfaces (this disc sits inside RingShell's hollow bore) don't fight over
// draw order, and no cast shadow for the same reason PvpWall.jsx's panel
// skips it: a hard-edged shadow from something meant to be see-through
// reads as an opaque silhouette.
function GlassDisc({ radius, height, color, position, sides, opacity }) {
  return (
    // laserIgnore: no movement collider either (walk-through by design, see
    // this component's own header comment) — same reasoning as RingShell
    // above. Without this, this 20m-tall glass tube silently swallowed any
    // PVP shot fired across the summit it surrounds.
    <mesh position={position} receiveShadow userData={{ laserIgnore: true }}>
      <cylinderGeometry args={[radius, radius, height, sides]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        {...MATERIAL_PBR.GLASS}
      />
    </mesh>
  )
}

// Floats inside the glass shell/disc (data/pvpCenterPentagon.js's
// PVP_CENTER_SIGN/PVP_CENTER_SIGN_POSITION), always turned to face the
// player (drei's <Billboard>, Tech.md §1) — same two-tier "big colored
// title, smaller white caption" idea as GlowFloorPanelLabel.jsx's "+N Wins"/
// "Return" pair, just with both lines fixed strings instead of data-driven.
function SummitSign() {
  return (
    <Billboard position={PVP_CENTER_SIGN_POSITION}>
      <Text
        fontSize={PVP_CENTER_SIGN.titleSize}
        fontWeight="bold"
        color={PVP_CENTER_SIGN.titleColor}
        outlineWidth={0.09}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {PVP_CENTER_SIGN.title}
      </Text>
      <Text
        position={[0, -PVP_CENTER_SIGN.subtitleGap, 0]}
        fontSize={PVP_CENTER_SIGN.subtitleSize}
        fontWeight="bold"
        color={PVP_CENTER_SIGN.subtitleColor}
        outlineWidth={0.05}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {PVP_CENTER_SIGN.subtitle}
      </Text>
    </Billboard>
  )
}

// A stack of pentagon-prism slabs marking the middle of the Pvp zone (data/
// pvpCenterPentagon.js documents how the stack's X/Z position was derived,
// and generates PVP_CENTER_PENTAGON_TIERS — a wide purple base tier, then
// alternating purple/yellow tiers on top of each other, each 0.98x the
// radius and 0.85x the height of the tier below it, each already carrying
// its own stacked `position`), topped with a hollow cylinder shell (RingShell
// above) and one more disc — this one glass (GlassDisc) — at the exact same
// spot, both resting flush on the topmost tier. All of it no Blender source,
// fully code-generated the same way as TargetGroundMat.jsx. The
// pentagon tiers are solid, climbable ground — data/pvpCenterPentagon.js's
// PVP_CENTER_PENTAGON_POLYGONS (one per tier) is registered into data/hub.js's
// HUB_POLYGONS, the convex-polygon collider list systems/playerMovement.js
// scans alongside its box list — but the summit shell and disc are both
// walk-through by design: neither's data has any entry in data/hub.js's
// collider lists (HUB_AABBS/HUB_POLYGONS/HUB_RINGS), same precedent as
// data/pvpWall.js's glass panel.
//
// "Same material as Ground, own color": Ground.jsx's floor look is a
// bevelled-stud checker CanvasTexture (systems/studTexture.js) under a
// MeshStandardMaterial at MATERIAL_PBR.GROUND — matching roughness/metalness
// alone renders as a flat, untextured color, so PentagonSlab/RingShell
// repaint that same texture with light/dark shades derived from each
// slab's own color (same shade() helper Ground.jsx's own texture uses for
// its bevel tints).
//
// Each pentagon tier gets its own top-cap and side textures, not one shared
// across the whole geometry (or across tiers): a single map tuned for one
// surface and reused on another with a different aspect ratio reads
// "distorted" — each tier's side band is a thin ring wrapped around a much
// larger perimeter, while its top cap's UV spans only its own diameter.
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
      <RingShell
        outerRadius={PVP_CENTER_CYLINDER_RADIUS}
        innerRadius={PVP_CENTER_CYLINDER_INNER_RADIUS}
        height={PVP_CENTER_CYLINDER_HEIGHT}
        color={PVP_CENTER_CYLINDER_COLOR}
        position={PVP_CENTER_CYLINDER_POSITION}
      />
      <GlassDisc
        radius={PVP_CENTER_SUMMIT_DISC_RADIUS}
        height={PVP_CENTER_SUMMIT_DISC_HEIGHT}
        color={PVP_CENTER_SUMMIT_DISC_COLOR}
        position={PVP_CENTER_SUMMIT_DISC_POSITION}
        sides={ROUND_SIDES}
        opacity={PVP_CENTER_SUMMIT_DISC_OPACITY}
      />
      <SummitSign />
    </>
  )
}
