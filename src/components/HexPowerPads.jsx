import HexPowerPadProp from './HexPowerPadProp.jsx'
import HexPowerPadLabel from './HexPowerPadLabel.jsx'
import { HEX_POWER_PAD_POSITIONS, HEX_POWER_PAD_TIERS } from '../data/hexPowerPad.js'

// The 15 `hex_power_pad.NNN` objects (collection `PowerPad`) — one glTF
// (data/hexPowerPad.js), placed 15 times. See HexPowerPadProp.jsx and
// data/hexPowerPad.js for the shared loader and per-instance positions.
// Each pad also gets a floating Power/Wins-Required label
// (HexPowerPadLabel.jsx) from the same index's HEX_POWER_PAD_TIERS entry.
export default function HexPowerPads() {
  return (
    <>
      {HEX_POWER_PAD_POSITIONS.map((position, i) => (
        <HexPowerPadProp key={i} index={i} position={position} />
      ))}
      {HEX_POWER_PAD_POSITIONS.map((position, i) => (
        <HexPowerPadLabel
          key={i}
          position={position}
          powerPerAction={HEX_POWER_PAD_TIERS[i].powerPerAction}
          winsRequired={HEX_POWER_PAD_TIERS[i].winsRequired}
        />
      ))}
    </>
  )
}
