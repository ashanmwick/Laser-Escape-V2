import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

const BAR_WIDTH = 1.5
const BAR_HEIGHT = 0.42
const LABEL_HEIGHT = 1.35 // metres above the pad's placement position

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

// In-world signage (Tech.md §1: drei is used for exactly this — SDF <Text>
// and <Billboard>) showing one pad's laser tier at a glance: a red bar (edges
// fading to transparent, see BAR_GRADIENT_TEXTURE) carrying its
// Power-per-Action gain in white outlined text, and the cumulative Wins needed
// to buy it in yellow outlined text above the bar. Always faces the camera
// (Billboard) so it reads the same from any approach angle.
export default function HexPowerPadLabel({ position, powerPerAction, winsRequired }) {
  return (
    <Billboard position={[position[0], position[1] + LABEL_HEIGHT, position[2]]} scale={2}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[BAR_WIDTH, BAR_HEIGHT]} />
        <meshBasicMaterial
          map={BAR_GRADIENT_TEXTURE}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Text
        fontSize={0.24}
        color="#ffffff"
        outlineWidth={0.02}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`+${powerPerAction} Power`}
      </Text>
      <Text
        position={[0, BAR_HEIGHT / 2 + 0.2, 0]}
        fontSize={0.18}
        color="#ffd21e"
        outlineWidth={0.018}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`${winsRequired} Wins Required`}
      </Text>
    </Billboard>
  )
}
