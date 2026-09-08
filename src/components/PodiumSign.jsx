import { Text } from '@react-three/drei'
import { PODIUM_SIGN } from '../data/podium.js'

// The text on one podium's sign panel (see data/podium.js PODIUM_SIGN and the
// `power_podium_signface_mat` quad it describes). One component, both
// instances — same as PodiumProp.jsx. The outer <group> takes the *same*
// `position` + rotation-y as PodiumProp's mount group, so the text tracks each
// podium's placement and yaw; the inner <Text> carries only the on-panel local
// offset and its facing yaw. Not billboarded: a sign fixed to the prop, read
// from one side. All tunable numbers live in data/podium.js (Tech.md §4).
export default function PodiumSign({ position, rotationY = 0, text }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Text
        position={PODIUM_SIGN.localPos}
        rotation={[0, PODIUM_SIGN.faceYaw, 0]}
        fontSize={PODIUM_SIGN.fontSize}
        maxWidth={PODIUM_SIGN.maxWidth}
        color={PODIUM_SIGN.color}
        outlineWidth={PODIUM_SIGN.outlineWidth}
        outlineColor={PODIUM_SIGN.outlineColor}
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
      >
        {text}
      </Text>
    </group>
  )
}
