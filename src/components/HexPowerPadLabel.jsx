import { Billboard, Text } from '@react-three/drei'

const BAR_WIDTH = 1.5
const BAR_HEIGHT = 0.42
const LABEL_HEIGHT = 1.35 // metres above the pad's placement position

// In-world signage (Tech.md §1: drei is used for exactly this — SDF <Text>
// and <Billboard>) showing one pad's laser tier at a glance: a red bar
// carrying its Power gain in white outlined text, and the cumulative Wins
// needed to buy it in yellow outlined text above the bar. Always faces the
// camera (Billboard) so it reads the same from any approach angle.
export default function HexPowerPadLabel({ position, power, winsRequired }) {
  return (
    <Billboard position={[position[0], position[1] + LABEL_HEIGHT, position[2]]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[BAR_WIDTH, BAR_HEIGHT]} />
        <meshBasicMaterial color="#d21f1f" toneMapped={false} />
      </mesh>
      <Text
        fontSize={0.24}
        color="#ffffff"
        outlineWidth={0.02}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`+${power} Power`}
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
        {`${winsRequired} Wins Required`}
      </Text>
    </Billboard>
  )
}
