import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { sunPosition, sunTarget } from '../systems/shadowSun.js'

// Presentation only: copies systems/shadowSun.js's simulated position/target
// onto the real directionalLight + its target Object3D each frame. Mirrors
// Player.jsx (component) / playerState.js (system)'s split — the "where
// should the light be" math lives in the system, this just writes it into
// three.js objects.
//
// Shadow frustum is a tight ±45-unit ortho box around the light's target
// (i.e. around the player), not the whole level — the level is ~1820m wide,
// far bigger than any single shadow map could cover crisply, so the frustum
// recenters on the player every frame instead (Tech.md §7). castShadow is
// gated by graphics_quality at the call site (see App.jsx); this component
// itself is unconditional — when shadows are off for the current tier,
// <Canvas shadows={false}> makes the shadow-map machinery a no-op regardless
// of what's set here.
export default function ShadowSun({ castShadow }) {
  const lightRef = useRef(null)
  const targetRef = useRef(null)

  // R3F's `target` prop only binds on mount from whatever targetRef.current
  // is *at that render* — since both refs attach after the same commit,
  // setting `light.target` imperatively here (once, after both exist) is the
  // reliable way to wire them, rather than relying on prop timing.
  useEffect(() => {
    const light = lightRef.current
    const target = targetRef.current
    if (!light || !target) return
    light.target = target
    target.updateMatrixWorld()
  }, [])

  useFrame(() => {
    const light = lightRef.current
    const target = targetRef.current
    if (!light || !target) return
    light.position.set(sunPosition.x, sunPosition.y, sunPosition.z)
    target.position.set(sunTarget.x, sunTarget.y, sunTarget.z)
    target.updateMatrixWorld()
  })

  return (
    <>
      <directionalLight
        ref={lightRef}
        intensity={1.8}
        castShadow={castShadow}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <object3D ref={targetRef} />
    </>
  )
}
