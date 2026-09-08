import PodiumProp from './PodiumProp.jsx'
import PodiumSign from './PodiumSign.jsx'
import {
  TARGET_PODIUM_POSITION,
  TARGET_PODIUM_TRANSFORM,
  TARGET_PODIUM_SIGN_TEXT,
} from '../data/podium.js'

// The `target_podium` object (collection `power_stand`) — a duplicate of
// power_podium in the .blend (same mesh/material, different transform,
// independently turned to face power_podium's stairs — see
// data/podium.js's TARGET_PODIUM_TRANSFORM.yaw). See PodiumProp.jsx and
// data/podium.js for the shared loader and per-instance transform;
// PodiumSign.jsx captions its baked sign panel.
export default function TargetPodium() {
  return (
    <>
      <PodiumProp position={TARGET_PODIUM_POSITION} rotationY={TARGET_PODIUM_TRANSFORM.yaw} />
      <PodiumSign
        position={TARGET_PODIUM_POSITION}
        rotationY={TARGET_PODIUM_TRANSFORM.yaw}
        text={TARGET_PODIUM_SIGN_TEXT}
      />
    </>
  )
}
