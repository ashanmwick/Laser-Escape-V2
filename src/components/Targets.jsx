import TargetProp from './TargetProp.jsx'
import { TARGET_PROPS } from '../data/targets.js'

// The 9 objects in collection `Targets` — each its own glTF (data/targets.js),
// placed once. See TargetProp.jsx and data/targets.js for the shared loader
// and per-object transform.
export default function Targets() {
  return (
    <>
      {TARGET_PROPS.map((t) => (
        <TargetProp key={t.id} url={t.url} position={t.position} />
      ))}
    </>
  )
}
