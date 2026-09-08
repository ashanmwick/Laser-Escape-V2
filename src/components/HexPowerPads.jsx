import HexPowerPadProp from './HexPowerPadProp.jsx'
import { HEX_POWER_PAD_POSITIONS } from '../data/hexPowerPad.js'

// The 15 `hex_power_pad.NNN` objects (collection `PowerPad`) — one glTF
// (data/hexPowerPad.js), placed 15 times. See HexPowerPadProp.jsx and
// data/hexPowerPad.js for the shared loader and per-instance positions.
export default function HexPowerPads() {
  return (
    <>
      {HEX_POWER_PAD_POSITIONS.map((position, i) => (
        <HexPowerPadProp key={i} position={position} />
      ))}
    </>
  )
}
