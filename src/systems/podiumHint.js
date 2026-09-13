// Podium proximity hint (Tech.md §5.1 style: framework-free, mutable
// singleton, stepped once per frame from GameLoop). Mirrors the
// proximity-scan shape of systems/afk.js and systems/hexPowerPad.js, but
// carries no interaction — it only publishes the hint text the HUD should
// show (components/hud/Hud.jsx polls podiumHintState.text) while the player
// is near the podium and still on the ground. Once the player climbs onto
// the prop the hint has served its purpose and the text clears.
import { player } from './playerState.js'
import {
  PODIUM_STAGE_TARGET_POSITION,
  PODIUM_STAGE_TARGET_AABBS,
  PODIUM_STAGE_TARGET_HINT_TEXT,
  PODIUM_STAGE_HINT_RANGE,
  PODIUM_STAGE_ON_MIN_Y,
} from '../data/podiumStage.js'

export const podiumHintState = {
  text: null, // hint to show this frame, or null when on/away from every podium
}

// A podium's overall XZ footprint — the union of all its per-box AABBs
// (steps + tiers). Used to tell "standing on the prop" from "near it".
function footprintOf(aabbs) {
  const f = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
  for (const b of aabbs) {
    if (b.min.x < f.minX) f.minX = b.min.x
    if (b.max.x > f.maxX) f.maxX = b.max.x
    if (b.min.z < f.minZ) f.minZ = b.min.z
    if (b.max.z > f.maxZ) f.maxZ = b.max.z
  }
  return f
}

// One entry per podium instance, built once at module load.
const PODIUMS = [
  {
    pos: PODIUM_STAGE_TARGET_POSITION,
    footprint: footprintOf(PODIUM_STAGE_TARGET_AABBS),
    text: PODIUM_STAGE_TARGET_HINT_TEXT,
  },
]

function isOnPodium(p, f) {
  return (
    p.y >= PODIUM_STAGE_ON_MIN_Y &&
    p.x >= f.minX &&
    p.x <= f.maxX &&
    p.z >= f.minZ &&
    p.z <= f.maxZ
  )
}

export function step() {
  const p = player.position
  let text = null
  for (const podium of PODIUMS) {
    const dx = p.x - podium.pos[0]
    const dz = p.z - podium.pos[2]
    if (dx * dx + dz * dz > PODIUM_STAGE_HINT_RANGE * PODIUM_STAGE_HINT_RANGE) continue
    if (isOnPodium(p, podium.footprint)) continue
    text = podium.text
    break
  }
  podiumHintState.text = text
}
