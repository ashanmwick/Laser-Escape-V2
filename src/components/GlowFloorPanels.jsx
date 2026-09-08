import GlowFloorPanelProp from './GlowFloorPanelProp.jsx'
import { GLOW_FLOOR_PANEL_POSITIONS } from '../data/glowFloorPanel.js'

// The 8 `glow_floor_panel[.NNN]` objects (collection `WinPanel`) — one glTF
// (data/glowFloorPanel.js), placed 8 times. See GlowFloorPanelProp.jsx and
// data/glowFloorPanel.js for the shared loader and per-instance positions.
export default function GlowFloorPanels() {
  return (
    <>
      {GLOW_FLOOR_PANEL_POSITIONS.map((position, i) => (
        <GlowFloorPanelProp key={i} position={position} />
      ))}
    </>
  )
}
