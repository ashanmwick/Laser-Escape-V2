import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'

const LABEL_HEIGHT = 3.5 // metres above the panel's placement position
const CUP_URL = '/ui/xp_cup.png'
const CUP_SIZE = 0.95 // metres (xp_cup.png is 64x64, square)

// One shared texture for all 25 labels — a single 64x64 PNG, loaded once and
// kept for the session like the prop-model cache (Tech.md §7: no per-instance
// GPU allocation, no re-download).
let cupTexture
function getCupTexture() {
  if (!cupTexture) {
    cupTexture = new THREE.TextureLoader().load(CUP_URL)
    cupTexture.colorSpace = THREE.SRGBColorSpace
    cupTexture.anisotropy = 4
  }
  return cupTexture
}

// Gentle idle float: a few detuned sine waves per axis, each sign seeded with
// its own phase/frequency so the 25 cups drift independently and never look
// synced. Hand-rolled rather than drei's <Float> (Tech.md §1: drei stays
// limited to <Text> + <Billboard>).
function FloatingCup({ position }) {
  const cup = useMemo(getCupTexture, [])
  const ref = useRef()
  const s = useRef({
    t: Math.random() * 100, // random phase offset
    sway: 0.45 + Math.random() * 0.35, // horizontal drift speed
    bob: 0.65 + Math.random() * 0.4, // vertical bob speed
    tilt: 0.3 + Math.random() * 0.3, // rock speed
  }).current

  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return
    s.t += delta
    // two detuned sines per translation axis so the path never cleanly loops
    mesh.position.x =
      position[0] + Math.sin(s.t * s.sway) * 0.11 + Math.sin(s.t * s.sway * 2.7) * 0.03
    mesh.position.y =
      position[1] + Math.sin(s.t * s.bob) * 0.09 + Math.sin(s.t * s.bob * 2.3) * 0.03
    mesh.rotation.z = Math.sin(s.t * s.tilt) * 0.14
  })

  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[CUP_SIZE, CUP_SIZE]} />
      <meshBasicMaterial map={cup} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

// In-world signage over one `glow_floor_panel` (Tech.md §1: drei's SDF <Text>
// + <Billboard> are used for exactly this), same idea as HexPowerPadLabel:
// the flat Wins the panel grants on contact (data/glowFloorPanel.js
// GLOW_FLOOR_PANEL_WINS) in big yellow, black-outlined text, a smaller white
// "Return" caption beneath, and the xp_cup icon under both, floating gently.
// Billboarded so it reads from any approach.
export default function GlowFloorPanelLabel({ position, wins }) {
  return (
    <Billboard position={[position[0], position[1] + LABEL_HEIGHT, position[2]]}>
      <Text
        fontSize={0.9}
        fontWeight="bold"
        letterSpacing={-0.02}
        color="#ffd21e"
        outlineWidth={0.09}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`+${wins} Wins`}
      </Text>
      <Text
        position={[0, -0.72, 0]}
        fontSize={0.42}
        fontWeight="bold"
        color="#ffffff"
        outlineWidth={0.05}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        Return
      </Text>
      <FloatingCup position={[0, -0.72 - 0.32 - CUP_SIZE / 2, 0]} />
    </Billboard>
  )
}
