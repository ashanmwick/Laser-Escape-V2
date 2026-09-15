import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

const BAR_WIDTH = 1.5
const BAR_HEIGHT = 0.42
const LABEL_HEIGHT = 3.5 // metres above the pad's placement position
const STRIP_SIZE = 0.95 // metres, square — the diagonal beam runs corner to corner

// 90-degree (left-to-right) gradient for the bar: fully transparent at the
// left/right edges, ramping to 50%-opacity red at the centre. Baked once into
// a 1px-tall canvas texture and shared by all 15 labels (the bar is identical
// on every pad). meshBasicMaterial samples this as colour + alpha, so the
// plane's top/bottom edges stay hard while its sides melt into the scene.
const BAR_GRADIENT_TEXTURE = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0)
  grad.addColorStop(0, 'rgba(210, 31, 31, 0)') // #d21f1f, transparent
  grad.addColorStop(0.5, 'rgba(210, 31, 31, 1)') // #d21f1f at 50%
  grad.addColorStop(1, 'rgba(210, 31, 31, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
})()

// Diagonal neon laser-beam strip baked once into a shared square canvas
// texture, transparent background, white-on-transparent so every pad can
// tint it to its own `beamColor` via meshBasicMaterial.color (same
// share-one-texture trick as BAR_GRADIENT_TEXTURE, just baked white instead
// of a fixed colour since this one varies per pad). Three stacked strokes
// (soft wide glow, bright mid glow, hard thin core) build the beam. The
// starburst flares at each end are separate animated sprites (see
// STARBURST_TEXTURE / LensFlareStarburst below) so they can flicker instead
// of sitting baked-static into this texture.
const LASER_STRIP_TEXTURE = (() => {
  const SIZE = 256
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')

  const PAD = SIZE * 0.16
  const start = { x: PAD, y: PAD }
  const end = { x: SIZE - PAD, y: SIZE - PAD }

  function strokeGlow(width, blur, alpha) {
    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`
    ctx.lineWidth = width
    ctx.shadowColor = 'rgba(255,255,255,1)'
    ctx.shadowBlur = blur
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
    ctx.restore()
  }

  strokeGlow(SIZE * 0.11, SIZE * 0.09, 0.35) // outer soft glow
  strokeGlow(SIZE * 0.045, SIZE * 0.05, 0.85) // mid glow
  strokeGlow(SIZE * 0.016, SIZE * 0.02, 1) // hard bright core

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
})()

// Fraction of STRIP_SIZE from centre to each beam endpoint, matching the
// padded diagonal (PAD = SIZE * 0.16 in the texture above -> 0.5 - 0.16).
const STARBURST_OFFSET = 0.34 * STRIP_SIZE

// A single four-point starburst (two perpendicular tapered spikes plus a
// core dot), centred and baked once into a small shared texture, white-on-
// transparent so it can be tinted per pad and driven by an animated
// opacity/scale to fake camera lens-flare flicker instead of sitting static.
const STARBURST_TEXTURE = (() => {
  const SIZE = 128
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  const cx = SIZE / 2
  const cy = SIZE / 2

  ctx.save()
  ctx.translate(cx, cy)
  ctx.shadowColor = 'rgba(255,255,255,1)'
  ctx.shadowBlur = SIZE * 0.1
  ctx.fillStyle = 'rgba(255,255,255,1)'
  const long = SIZE * 0.42
  const short = SIZE * 0.035
  for (let i = 0; i < 2; i++) {
    ctx.save()
    ctx.rotate((i * Math.PI) / 2) // 0deg then 90deg -> four points (N/S/E/W)
    ctx.beginPath()
    ctx.moveTo(-long, 0)
    ctx.lineTo(0, -short)
    ctx.lineTo(long, 0)
    ctx.lineTo(0, short)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(0, 0, SIZE * 0.06, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
})()

// Cheap, allocation-free flicker: three non-harmonic sine waves summed
// together read as an irregular camera-flare twinkle instead of a smooth,
// obviously-looping pulse. `seed` staggers pads/ends so they don't flicker
// in lockstep.
function flickerAt(t, seed) {
  const raw =
    0.62 +
    0.22 * Math.sin(t * 5.3 + seed) +
    0.14 * Math.sin(t * 11.7 + seed * 2.7) +
    0.09 * Math.sin(t * 23.9 + seed * 4.1)
  return Math.min(1, Math.max(0, raw))
}

// One flickering lens-flare sprite, positioned at a beam endpoint (local
// coordinates in the parent strip mesh's un-rotated space, so it lines up
// with that mesh's diagonal regardless of its own rotation prop).
function LensFlareStarburst({ position, color }) {
  const materialRef = useRef(null)
  const meshRef = useRef(null)
  const seed = useMemo(() => Math.random() * 1000, [])

  useFrame(({ clock }) => {
    const flicker = flickerAt(clock.elapsedTime, seed)
    if (materialRef.current) materialRef.current.opacity = 0.35 + 0.65 * flicker
    const scale = 0.75 + 0.4 * flicker
    if (meshRef.current) meshRef.current.scale.setScalar(scale)
  })

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[STRIP_SIZE * 0.6, STRIP_SIZE * 0.6]} />
      <meshBasicMaterial
        ref={materialRef}
        map={STARBURST_TEXTURE}
        color={color}
        transparent
        opacity={1}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Abbreviates large winsRequired values (1000 -> "1K", 2500000 -> "2.5M") so
// the top-tier pads' labels stay a single short token instead of a long run
// of digits. Values under 1000 render as-is.
function formatWinsRequired(wins) {
  if (wins >= 1_000_000) {
    return `${parseFloat((wins / 1_000_000).toFixed(1))}M`
  }
  if (wins >= 1_000) {
    return `${parseFloat((wins / 1_000).toFixed(1))}K`
  }
  return `${wins}`
}

// In-world signage (Tech.md §1: drei is used for exactly this — SDF <Text>
// and <Billboard>) showing one pad's laser tier at a glance: a red bar (edges
// fading to transparent, see BAR_GRADIENT_TEXTURE) carrying its
// Power-per-Action gain in white outlined text, the cumulative Wins needed to
// buy it in yellow outlined text above the bar, and a diagonal neon laser
// strip (LASER_STRIP_TEXTURE, tinted to `beamColor`) beneath it. Always faces
// the camera (Billboard) so it reads the same from any approach angle.
export default function HexPowerPadLabel({ position, powerPerAction, winsRequired, beamColor }) {
  return (
    <Billboard position={[position[0], position[1] + LABEL_HEIGHT, position[2]]} scale={2}>
      <mesh position={[0, BAR_HEIGHT / 2 + 0.2, -0.01]}>
        <planeGeometry args={[BAR_WIDTH, BAR_HEIGHT]} />
        <meshBasicMaterial
          map={BAR_GRADIENT_TEXTURE}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Text
        position={[0, BAR_HEIGHT / 2 + 0.2, 0]}
        fontSize={0.3}
        fontWeight="bold"
        color="#ffffff"
        outlineWidth={0.02}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`+${powerPerAction} Power`}
      </Text>
      <Text
        fontSize={0.21}
        fontWeight="bold"
        color="#ffd21e"
        outlineWidth={0.018}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`${formatWinsRequired(winsRequired)} Wins Required`}
      </Text>
      <mesh
        position={[0, -(BAR_HEIGHT / 2 + 0.15 + STRIP_SIZE / 2), -0.01]}
        rotation={[0, 0, Math.PI + Math.PI / 2]}
      >
        <planeGeometry args={[STRIP_SIZE, STRIP_SIZE]} />
        <meshBasicMaterial
          map={LASER_STRIP_TEXTURE}
          color={beamColor}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
        <LensFlareStarburst position={[-STARBURST_OFFSET, STARBURST_OFFSET, 0.001]} color={beamColor} />
        <LensFlareStarburst position={[STARBURST_OFFSET, -STARBURST_OFFSET, 0.001]} color={beamColor} />
      </mesh>
    </Billboard>
  )
}
