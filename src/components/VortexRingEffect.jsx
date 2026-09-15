import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { makeVortexRingTexture } from '../systems/vortexRingTexture.js'
import {
  VORTEX_RING_POSITION,
  VORTEX_RING_LAYERS,
  VORTEX_RING_RADIAL_SEGMENTS,
  VORTEX_RING_TUBULAR_SEGMENTS,
  VORTEX_BLACK_HOLE_RADIUS,
  VORTEX_BLACK_HOLE_COLOR,
  VORTEX_BLACK_HOLE_DEPTH_OFFSET,
  VORTEX_PHOTON_RING_RADIUS,
  VORTEX_PHOTON_RING_TUBE,
  VORTEX_PHOTON_RING_COLOR,
  VORTEX_PHOTON_RING_OPACITY,
  VORTEX_PHOTON_RING_SCROLL_SPEED,
} from '../data/vortexRingEffect.js'

// Black-hole look — the second of the two vortex looks VortexEffectCycle.jsx
// alternates on vortex_target. Three parts, all mounted inside one
// <Billboard> (data/vortexRingEffect.js) so the whole thing always faces the
// player, same as VortexEffect.jsx's disc:
//  - an opaque black void (the event horizon's shadow) — the one non-additive
//    layer here, since a real black hole blocks light rather than adding to
//    it; sits at a small negative local Z so the accretion-disk layers'
//    donut holes reveal it without depth-fighting it.
//  - a thin, near-white "photon ring" blazing right at that void's edge.
//  - 4 accretion-disk bands (VORTEX_RING_LAYERS) fading hot-near-white to
//    cool deep purple with distance, each independently spun by scrolling
//    its own noise texture along U (native map.offset.x — no custom
//    ShaderMaterial needed, keeping every layer Lambert/Basic per Tech.md
//    §7) and pulsed in scale as a stand-in for a per-vertex sine warp.
// Unlit MeshBasicMaterial + AdditiveBlending + depthWrite=false on every
// layer but the void — same trick Laser.jsx's glow cylinder / VortexEffect.jsx
// use instead of postprocessing bloom.
//
// `opacityRef` (optional, from VortexEffectCycle.jsx) is a mutable 0..1
// multiplier read every frame, so crossfading with VortexEffect.jsx's disc
// never remounts either side — only each layer's own base opacity scales.
// The black void itself fades the same way (its alpha, not additive
// strength) so it never appears as a hole into the game world once faded
// out.
export default function VortexRingEffect({ opacityRef }) {
  const voidRef = useRef(null)
  const photonRef = useRef(null)
  const meshRefs = useRef([])
  const photonTexture = useMemo(() => makeVortexRingTexture(0), [])
  const textures = useMemo(
    () => VORTEX_RING_LAYERS.map((_, i) => makeVortexRingTexture(i + 1)),
    []
  )
  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(
    () => () => {
      photonTexture.dispose()
      textures.forEach((t) => t.dispose())
    },
    [photonTexture, textures]
  )

  useFrame(({ clock }, delta) => {
    const multiplier = opacityRef?.current ?? 1
    const t = clock.elapsedTime

    if (voidRef.current) voidRef.current.material.opacity = multiplier
    if (photonRef.current) {
      photonTexture.offset.x += VORTEX_PHOTON_RING_SCROLL_SPEED * delta
      photonRef.current.material.opacity = VORTEX_PHOTON_RING_OPACITY * multiplier
    }

    VORTEX_RING_LAYERS.forEach((layer, i) => {
      const mesh = meshRefs.current[i]
      if (!mesh) return
      textures[i].offset.x += layer.scrollSpeed * delta
      const pulse = 1 + Math.sin(t * layer.pulseSpeed + layer.pulsePhase) * layer.pulseAmp
      mesh.scale.setScalar(pulse)
      mesh.material.opacity = layer.opacity * multiplier
    })
  })

  return (
    <Billboard position={VORTEX_RING_POSITION}>
      <mesh ref={voidRef} position={[0, 0, VORTEX_BLACK_HOLE_DEPTH_OFFSET]}>
        <circleGeometry args={[VORTEX_BLACK_HOLE_RADIUS, 48]} />
        <meshBasicMaterial color={VORTEX_BLACK_HOLE_COLOR} transparent depthWrite={false} />
      </mesh>
      <mesh ref={photonRef}>
        <torusGeometry
          args={[
            VORTEX_PHOTON_RING_RADIUS,
            VORTEX_PHOTON_RING_TUBE,
            VORTEX_RING_RADIAL_SEGMENTS,
            VORTEX_RING_TUBULAR_SEGMENTS,
          ]}
        />
        <meshBasicMaterial
          map={photonTexture}
          color={VORTEX_PHOTON_RING_COLOR}
          transparent
          opacity={VORTEX_PHOTON_RING_OPACITY}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {VORTEX_RING_LAYERS.map((layer, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
          rotation={[0, 0, layer.rotationOffset]}
        >
          <torusGeometry
            args={[
              layer.radius,
              layer.tube,
              VORTEX_RING_RADIAL_SEGMENTS,
              VORTEX_RING_TUBULAR_SEGMENTS,
            ]}
          />
          <meshBasicMaterial
            map={textures[i]}
            color={layer.color}
            transparent
            opacity={layer.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </Billboard>
  )
}
