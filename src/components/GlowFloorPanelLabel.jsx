import { Billboard, Text } from '@react-three/drei'

const LABEL_HEIGHT = 3 // metres above the panel's placement position

// In-world signage over one `glow_floor_panel` (Tech.md §1: drei's SDF <Text>
// + <Billboard> are used for exactly this), same idea as HexPowerPadLabel:
// the flat Wins the panel grants on contact (data/glowFloorPanel.js
// GLOW_FLOOR_PANEL_WINS) in big yellow, black-outlined text, with a smaller
// white "Return" caption beneath. Billboarded so it reads from any approach.
export default function GlowFloorPanelLabel({ position, wins }) {
  return (
    <Billboard position={[position[0], position[1] + LABEL_HEIGHT, position[2]]}>
      <Text
        fontSize={0.9}
        color="#ffd21e"
        outlineWidth={0.07}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`+${wins}`}
      </Text>
      <Text
        position={[0, -0.72, 0]}
        fontSize={0.34}
        color="#ffffff"
        outlineWidth={0.03}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        Return
      </Text>
    </Billboard>
  )
}
