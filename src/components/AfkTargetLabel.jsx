import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

const BAR_WIDTH = 1.7
const BAR_HEIGHT = 0.44

// 90-degree (left-to-right) gradient for the bar: fully transparent at the
// left/right edges, ramping to 50%-opacity blue at the centre. Baked once into
// a 1px-tall canvas texture and shared by every label (the bar is identical on
// each target). meshBasicMaterial samples this as colour + alpha, so the
// plane's top/bottom edges stay hard while its sides melt into the scene.
const BAR_GRADIENT_TEXTURE = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0)
  grad.addColorStop(0, 'rgba(31, 111, 235, 0)') // #1f6feb, transparent
  grad.addColorStop(0.5, 'rgba(31, 111, 235, 1)') // #1f6feb at 50%
  grad.addColorStop(1, 'rgba(31, 111, 235, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
})()

// In-world signage for one AFK target (Tech.md §1: drei's SDF <Text> +
// <Billboard>, same as HexPowerPadLabel.jsx). A blue bar carrying the AFK
// Power multiplier ("xN") in white, and the player Rebirth needed to AFK
// here in yellow above it. `position` is already the world point to float at
// — Targets.jsx offsets it above each target's aim point (data/afk.js
// AFK_LABEL_HEIGHT). Always faces the camera so it reads from any angle.
export default function AfkTargetLabel({ position, power, rebirthRequired }) {
  return (
    <Billboard position={position} scale={2}>
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
        fontSize={0.26}
        color="#ffffff"
        outlineWidth={0.02}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`${power} Power`}
      </Text>
      <Text
        position={[0, BAR_HEIGHT / 2 + 0.2, 0]}
        fontSize={0.20}
        color="#ffd21e"
        outlineWidth={0.018}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`Rebirth ${rebirthRequired} Required`}
      </Text>
    </Billboard>
  )
}
