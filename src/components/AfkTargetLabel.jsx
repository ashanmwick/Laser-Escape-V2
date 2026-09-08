import { Billboard, Text } from '@react-three/drei'

const BAR_WIDTH = 1.7
const BAR_HEIGHT = 0.44

// In-world signage for one AFK target (Tech.md §1: drei's SDF <Text> +
// <Billboard>, same as HexPowerPadLabel.jsx). A blue bar carrying the AFK
// Power multiplier ("xN") in white, and the player Rebirth needed to AFK
// here in yellow above it. `position` is already the world point to float at
// — Targets.jsx offsets it above each target's aim point (data/afk.js
// AFK_LABEL_HEIGHT). Always faces the camera so it reads from any angle.
export default function AfkTargetLabel({ position, power, rebirthRequired }) {
  return (
    <Billboard position={position}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[BAR_WIDTH, BAR_HEIGHT]} />
        <meshBasicMaterial color="#1f6feb" toneMapped={false} />
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
        fontSize={0.17}
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
