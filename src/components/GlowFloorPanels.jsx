import GlowFloorPanelProp from './GlowFloorPanelProp.jsx'
import GlowFloorPanelLabel from './GlowFloorPanelLabel.jsx'
import { GLOW_FLOOR_PANEL_POSITIONS, GLOW_FLOOR_PANEL_WINS } from '../data/glowFloorPanel.js'

// The 8 `glow_floor_panel[.NNN]` objects (collection `WinPanel`) — one glTF
// (data/glowFloorPanel.js), placed 8 times. See GlowFloorPanelProp.jsx and
// data/glowFloorPanel.js for the shared loader and per-instance positions.
// Each panel also gets a floating "+Wins / Return" label
// (GlowFloorPanelLabel.jsx) from the same index's GLOW_FLOOR_PANEL_WINS entry;
// systems/glowFloorPanel.js awards those Wins when the player steps onto it.
export default function GlowFloorPanels() {
  return (
    <>
      {GLOW_FLOOR_PANEL_POSITIONS.map((position, i) => (
        <GlowFloorPanelProp key={i} position={position} />
      ))}
      {GLOW_FLOOR_PANEL_POSITIONS.map((position, i) => (
        <GlowFloorPanelLabel key={i} position={position} wins={GLOW_FLOOR_PANEL_WINS[i]} />
      ))}
    </>
  )
}
