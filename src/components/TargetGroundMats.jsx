import TargetGroundMat from './TargetGroundMat.jsx'
import { TARGET_PROPS } from '../data/targets.js'

// One ground mat under every object in collection `Targets` — same size,
// thickness and offsets for all nine (data/targetGroundMat.js), each its
// own independently-tunable color palette (same file's
// TARGET_GROUND_MAT_COLORS, keyed by target id).
export default function TargetGroundMats() {
  return (
    <>
      {TARGET_PROPS.map((t) => (
        <TargetGroundMat key={t.id} id={t.id} position={t.position} />
      ))}
    </>
  )
}
