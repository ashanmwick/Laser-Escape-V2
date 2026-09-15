import { useMemo } from 'react'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

const LABEL_GAP = 0.44 // vertical spacing between the Power and Rebirth-required lines

const DEFAULT_POWER_COLOR_TOP = '#ffffff'
const DEFAULT_POWER_COLOR_BOTTOM = '#ff0090'
const DEFAULT_REBIRTH_COLOR_TOP = '#ffffff'
const DEFAULT_REBIRTH_COLOR_BOTTOM = '#9b30ff'

// Builds a vertical gradient texture: `colorTop` at the top of the text,
// `colorBottom` at the bottom (a linear blend, so the true midpoint is a
// 50/50 mix of the two). Troika's SDF text shader already normalizes the
// mesh's `uv` to the text block's own bounding box (0 at the bottom edge, 1
// at the top), so handing a texture like this to the Text's material as
// `map` is enough to gradient-tint the glyph fill — no custom shader needed.
function createLabelGradientTexture(colorTop, colorBottom) {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, colorTop)
  grad.addColorStop(1, colorBottom)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// In-world signage for one AFK target (Tech.md §1: drei's SDF <Text> +
// <Billboard>, same as HexPowerPadLabel.jsx). The AFK Power multiplier
// ("xN Power") and the player Rebirth needed to AFK here, each with its own
// independently customizable gradient — `powerColorTop`/`powerColorBottom`
// for the Power line, `rebirthColorTop`/`rebirthColorBottom` for the
// Rebirth-required line (data/afk.js AFK_TARGET_CONFIG, plumbed through
// Targets.jsx). `position` is already the world point to float at —
// Targets.jsx offsets it above each target's aim point (data/afk.js
// AFK_LABEL_HEIGHT). Always faces the camera so it reads from any angle.
export default function AfkTargetLabel({
  position,
  power,
  rebirthRequired,
  powerColorTop = DEFAULT_POWER_COLOR_TOP,
  powerColorBottom = DEFAULT_POWER_COLOR_BOTTOM,
  rebirthColorTop = DEFAULT_REBIRTH_COLOR_TOP,
  rebirthColorBottom = DEFAULT_REBIRTH_COLOR_BOTTOM,
}) {
  const powerGradientTexture = useMemo(
    () => createLabelGradientTexture(powerColorTop, powerColorBottom),
    [powerColorTop, powerColorBottom]
  )
  const rebirthGradientTexture = useMemo(
    () => createLabelGradientTexture(rebirthColorTop, rebirthColorBottom),
    [rebirthColorTop, rebirthColorBottom]
  )

  return (
    <Billboard position={position} scale={2}>
      <Text
        position={[0, LABEL_GAP / 2 + 0.2, 0]}
        fontSize={0.4}
        fontWeight="bold"
        outlineWidth={0.02}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`${power} Power`}
        <meshBasicMaterial
          map={powerGradientTexture}
          side={THREE.DoubleSide}
          transparent
          toneMapped={false}
        />
      </Text>
      <Text
        fontSize={0.20}
        fontWeight="bold"
        outlineWidth={0.018}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`Rebirth ${rebirthRequired} Required`}
        <meshBasicMaterial
          map={rebirthGradientTexture}
          side={THREE.DoubleSide}
          transparent
          toneMapped={false}
        />
      </Text>
    </Billboard>
  )
}
