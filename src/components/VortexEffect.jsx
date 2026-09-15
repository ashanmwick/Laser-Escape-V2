import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { makeVortexTexture } from '../systems/vortexTexture.js'
import {
  VORTEX_EFFECT_POSITION,
  VORTEX_EFFECT_RADIUS,
  VORTEX_EFFECT_SCALE_OUTER,
  VORTEX_EFFECT_CORE_RADIUS,
  VORTEX_EFFECT_CORE_COLOR,
  VORTEX_EFFECT_CORE_OPACITY,
  VORTEX_EFFECT_DEPTH_OFFSET_CORE,
  VORTEX_EFFECT_DEPTH_OFFSET_INNER,
  VORTEX_EFFECT_DEPTH_OFFSET_OUTER,
  VORTEX_EFFECT_OPACITY_INNER,
  VORTEX_EFFECT_OPACITY_OUTER,
  VORTEX_EFFECT_SPEED_INNER,
  VORTEX_EFFECT_SPEED_OUTER,
  VORTEX_EFFECT_COLOR,
} from '../data/vortexEffect.js'

// Glowing purple vortex disc mounted on vortex_target itself
// (data/vortexEffect.js) — wrapped in drei's <Billboard> (same trick
// AfkTargetLabel.jsx/HexPowerPadLabel.jsx use) so it always turns to face
// the player instead of lying flat on the ground. Two circle layers spin
// around their own local Z (the Billboard's camera-facing axis) at
// different speeds/opacities so they drift apart into a parallax swirl
// instead of reading as one flat disc, plus a small near-white core flare
// that doesn't rotate — the "light" cue, faked the same way Laser.jsx's
// sprite core fakes one instead of an actual THREE.Light (Tech.md §7).
// Unlit MeshBasicMaterial + AdditiveBlending + depthWrite=false throughout.
//
// `opacityRef` (optional, from VortexEffectCycle.jsx) is a mutable 0..1
// multiplier read every frame rather than a prop, so the crossfade between
// this look and VortexRingEffect.jsx's rings never triggers a re-render or
// remount — only each layer's own base opacity is scaled down.
export default function VortexEffect({ opacityRef }) {
  const coreRef = useRef(null)
  const innerRef = useRef(null)
  const outerRef = useRef(null)
  const texture = useMemo(() => makeVortexTexture(), [])
  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(() => () => texture.dispose(), [texture])

  useFrame((_, delta) => {
    const multiplier = opacityRef?.current ?? 1
    if (innerRef.current) innerRef.current.rotation.z += VORTEX_EFFECT_SPEED_INNER * delta
    if (outerRef.current) outerRef.current.rotation.z += VORTEX_EFFECT_SPEED_OUTER * delta
    if (coreRef.current) coreRef.current.material.opacity = VORTEX_EFFECT_CORE_OPACITY * multiplier
    if (innerRef.current) innerRef.current.material.opacity = VORTEX_EFFECT_OPACITY_INNER * multiplier
    if (outerRef.current) outerRef.current.material.opacity = VORTEX_EFFECT_OPACITY_OUTER * multiplier
  })

  return (
    <Billboard position={VORTEX_EFFECT_POSITION}>
      <mesh ref={coreRef} position={[0, 0, VORTEX_EFFECT_DEPTH_OFFSET_CORE]}>
        <circleGeometry args={[VORTEX_EFFECT_CORE_RADIUS, 32]} />
        <meshBasicMaterial
          map={texture}
          color={VORTEX_EFFECT_CORE_COLOR}
          transparent
          opacity={VORTEX_EFFECT_CORE_OPACITY}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={innerRef} position={[0, 0, VORTEX_EFFECT_DEPTH_OFFSET_INNER]}>
        <circleGeometry args={[VORTEX_EFFECT_RADIUS, 48]} />
        <meshBasicMaterial
          map={texture}
          color={VORTEX_EFFECT_COLOR}
          transparent
          opacity={VORTEX_EFFECT_OPACITY_INNER}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh
        ref={outerRef}
        position={[0, 0, VORTEX_EFFECT_DEPTH_OFFSET_OUTER]}
        scale={[VORTEX_EFFECT_SCALE_OUTER, VORTEX_EFFECT_SCALE_OUTER, 1]}
      >
        <circleGeometry args={[VORTEX_EFFECT_RADIUS, 48]} />
        <meshBasicMaterial
          map={texture}
          color={VORTEX_EFFECT_COLOR}
          transparent
          opacity={VORTEX_EFFECT_OPACITY_OUTER}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </Billboard>
  )
}
