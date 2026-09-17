// Shared decay curve for the "just got hit" red emissive pulse (components/
// Player.jsx for the local avatar, components/RemotePlayers.jsx for
// remotes). Both time it off a single hitFlashAt timestamp (performance.now()
// of the last hp decrease) so the two call sites can't drift apart.
import { HIT_FLASH_DURATION_MS } from '../data/playerHealth.js'

// 0 once expired or never hit, ramping linearly down from 1 (the strike
// instant) to 0 over HIT_FLASH_DURATION_MS.
export function hitFlashFraction(hitFlashAt, now) {
  if (!hitFlashAt) return 0
  const t = (now - hitFlashAt) / HIT_FLASH_DURATION_MS
  return t >= 1 ? 0 : 1 - t
}
