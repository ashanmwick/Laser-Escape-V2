import PodiumProp from './PodiumProp.jsx'
import PodiumSign from './PodiumSign.jsx'
import {
  POWER_PODIUM_POSITION,
  POWER_PODIUM_TRANSFORM,
  POWER_PODIUM_SIGN_TEXT,
} from '../data/podium.js'

// The `power_podium` object (collection `power_stand`). See PodiumProp.jsx
// and data/podium.js for the shared loader and per-instance transform;
// PodiumSign.jsx captions its baked sign panel.
export default function PowerPodium() {
  return (
    <>
      <PodiumProp position={POWER_PODIUM_POSITION} rotationY={POWER_PODIUM_TRANSFORM.yaw} />
      <PodiumSign
        position={POWER_PODIUM_POSITION}
        rotationY={POWER_PODIUM_TRANSFORM.yaw}
        text={POWER_PODIUM_SIGN_TEXT}
      />
    </>
  )
}
