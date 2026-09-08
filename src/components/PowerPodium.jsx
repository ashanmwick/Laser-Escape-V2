import PodiumProp from './PodiumProp.jsx'
import { POWER_PODIUM_POSITION, POWER_PODIUM_TRANSFORM } from '../data/podium.js'

// The `power_podium` object (collection `power_stand`). See PodiumProp.jsx
// and data/podium.js for the shared loader and per-instance transform.
export default function PowerPodium() {
  return <PodiumProp position={POWER_PODIUM_POSITION} rotationY={POWER_PODIUM_TRANSFORM.yaw} />
}
