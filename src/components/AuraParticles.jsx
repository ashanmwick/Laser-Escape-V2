import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { firePool, smokePool, auraClock } from '../systems/auraParticles.js'
import {
  AURA_PARTICLE_VERTEX_SHADER,
  AURA_FIRE_FRAGMENT_SHADER,
  AURA_SMOKE_FRAGMENT_SHADER,
} from '../systems/auraParticleShader.js'
import {
  FIRE_FADE_IN,
  FIRE_FADE_OUT_START,
  FIRE_SIZE_GROWTH,
  FIRE_SWAY_AMOUNT,
  SMOKE_FADE_IN,
  SMOKE_FADE_OUT_START,
  SMOKE_SIZE_GROWTH,
  SMOKE_SWAY_AMOUNT,
  SMOKE_TINT_WEIGHT,
} from '../data/auraParticles.js'
import { useGameStore } from '../store/useGameStore.js'
import { AURA_TIERS } from '../data/aura.js'

const SMOKE_BASE_COLOR = new THREE.Color('#3c3c3c')

// Builds one pool's static (never-changing) BufferGeometry, wrapping the
// typed arrays systems/auraParticles.js writes spawns into directly — no
// copy, so a spawn there needs only `attribute.needsUpdate = true` here to
// reach the GPU.
function buildGeometry(pool) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(pool.offset, 3))
  geometry.setAttribute('aBirth', new THREE.BufferAttribute(pool.birth, 1))
  geometry.setAttribute('aLifetime', new THREE.BufferAttribute(pool.lifetime, 1))
  geometry.setAttribute('aRise', new THREE.BufferAttribute(pool.rise, 1))
  geometry.setAttribute('aSway', new THREE.BufferAttribute(pool.sway, 2))
  geometry.setAttribute('aWind', new THREE.BufferAttribute(pool.wind, 2))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(pool.particleSize, 1))
  return geometry
}

// Presentation only: two GPU-animated THREE.Points clouds driven by
// systems/auraParticles.js's typed-array pools and systems/
// auraParticleShader.js's shared vertex shader (see that file for why this
// is one draw call per pool with no per-particle JS work, unlike
// components/LaserParticles.jsx's InstancedMesh, which has to loop and
// compose a matrix per instance every frame since it has no shader of its
// own to hand that off to).
export default function AuraParticles() {
  const fireRef = useRef(null)
  const smokeRef = useRef(null)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  const coreHex = useGameStore((s) => AURA_TIERS[s.equippedAura]?.colorCore ?? null)
  const edgeHex = useGameStore((s) => AURA_TIERS[s.equippedAura]?.colorEdge ?? null)

  const fireGeometry = useMemo(() => buildGeometry(firePool), [])
  const smokeGeometry = useMemo(() => buildGeometry(smokePool), [])

  const fireMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: AURA_PARTICLE_VERTEX_SHADER,
        fragmentShader: AURA_FIRE_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uPixelScale: { value: 1 },
          uFadeIn: { value: FIRE_FADE_IN },
          uFadeOutStart: { value: FIRE_FADE_OUT_START },
          uSizeGrowth: { value: FIRE_SIZE_GROWTH },
          uSwayAmount: { value: FIRE_SWAY_AMOUNT },
          uCoreColor: { value: new THREE.Color('#ffffff') },
          uEdgeColor: { value: new THREE.Color('#ffffff') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  )
  const smokeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: AURA_PARTICLE_VERTEX_SHADER,
        fragmentShader: AURA_SMOKE_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uPixelScale: { value: 1 },
          uFadeIn: { value: SMOKE_FADE_IN },
          uFadeOutStart: { value: SMOKE_FADE_OUT_START },
          uSizeGrowth: { value: SMOKE_SIZE_GROWTH },
          uSwayAmount: { value: SMOKE_SWAY_AMOUNT },
          uColor: { value: SMOKE_BASE_COLOR.clone() },
        },
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  useEffect(() => {
    if (coreHex) fireMaterial.uniforms.uCoreColor.value.set(coreHex)
    if (edgeHex) {
      fireMaterial.uniforms.uEdgeColor.value.set(edgeHex)
      // Smoke stays mostly neutral grey — just a hint of the aura's own
      // color so it still reads as belonging to that tier (e.g. Void's
      // smoke leans purple-black, Frost's leans icy) without turning the
      // smoke itself into a colored effect.
      smokeMaterial.uniforms.uColor.value.copy(SMOKE_BASE_COLOR).lerp(fireMaterial.uniforms.uEdgeColor.value, SMOKE_TINT_WEIGHT)
    }
  }, [coreHex, edgeHex, fireMaterial, smokeMaterial])

  // Standard perspective point-size-attenuation scale (mirrors THREE's own
  // size_vertex shader chunk): gl_PointSize = size * scale / -mvPosition.z.
  useEffect(() => {
    if (!camera.isPerspectiveCamera) return
    const dpr = gl.getPixelRatio()
    const fovRad = (camera.fov * Math.PI) / 180
    const pixelScale = (size.height * dpr) / (2 * Math.tan(fovRad / 2))
    fireMaterial.uniforms.uPixelScale.value = pixelScale
    smokeMaterial.uniforms.uPixelScale.value = pixelScale
  }, [camera, gl, size, fireMaterial, smokeMaterial])

  useEffect(
    () => () => {
      fireGeometry.dispose()
      smokeGeometry.dispose()
      fireMaterial.dispose()
      smokeMaterial.dispose()
    },
    [fireGeometry, smokeGeometry, fireMaterial, smokeMaterial],
  )

  useFrame(() => {
    const t = auraClock.elapsed
    fireMaterial.uniforms.uTime.value = t
    smokeMaterial.uniforms.uTime.value = t

    // Cheap either way (a few hundred floats), but only worth uploading when
    // systems/auraParticles.js actually wrote new spawns this frame.
    const fireAttrs = fireGeometry.attributes
    fireAttrs.position.needsUpdate = true
    fireAttrs.aBirth.needsUpdate = true
    fireAttrs.aLifetime.needsUpdate = true
    fireAttrs.aRise.needsUpdate = true
    fireAttrs.aSway.needsUpdate = true
    fireAttrs.aWind.needsUpdate = true
    fireAttrs.aSize.needsUpdate = true

    const smokeAttrs = smokeGeometry.attributes
    smokeAttrs.position.needsUpdate = true
    smokeAttrs.aBirth.needsUpdate = true
    smokeAttrs.aLifetime.needsUpdate = true
    smokeAttrs.aRise.needsUpdate = true
    smokeAttrs.aSway.needsUpdate = true
    smokeAttrs.aWind.needsUpdate = true
    smokeAttrs.aSize.needsUpdate = true
  })

  return (
    <>
      <points
        ref={fireRef}
        geometry={fireGeometry}
        material={fireMaterial}
        frustumCulled={false}
        userData={{ laserIgnore: true }}
      />
      <points
        ref={smokeRef}
        geometry={smokeGeometry}
        material={smokeMaterial}
        frustumCulled={false}
        userData={{ laserIgnore: true }}
      />
    </>
  )
}
