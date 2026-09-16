import { useCallback, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { player } from '../systems/playerState.js'
import { health as playerHealthState } from '../systems/playerHealth.js'
import PlayerAvatar from './PlayerAvatar.jsx'
import { MATERIAL_PBR } from '../data/materials.js'

// Presentation only: read the player singleton, draw the character. The group
// origin sits at the capsule base (feet), matching playerState's convention —
// the Bloxity rig uses the same origin, so both mount unchanged.
export default function Player() {
  const ref = useRef()
  const [hasAvatar, setHasAvatar] = useState(false)

  // Stable identity: PlayerAvatar's effect depends on this.
  const onAvatarReady = useCallback((ready) => setHasAvatar(ready), [])

  useFrame(() => {
    const g = ref.current
    if (!g) return
    g.position.set(player.position.x, player.position.y, player.position.z)
    g.rotation.y = player.facing
    // Hide the standing body the instant we're dead — systems/ragdoll.js has
    // already burst its own boxes at this same position/facing (systems/
    // playerHealth.js's applyRemoteHealth), so a frozen standee underneath
    // them would read as a rendering glitch, not a death.
    g.visible = !playerHealthState.dead
  })

  // The capsule is the fallback, not dead code: it is what renders while the
  // default rig loads, or when the avatar CDN is unreachable and a load fails.
  const { radius, height } = player.dims
  const cylinder = height - radius * 2

  return (
    <group ref={ref} userData={{ laserIgnore: true }}>
      <group visible={!hasAvatar}>
        <mesh position-y={height / 2} castShadow>
          <capsuleGeometry args={[radius, cylinder, 4, 12]} />
          <meshStandardMaterial color="#d9564b" {...MATERIAL_PBR.FLAT_PLACEHOLDER} />
        </mesh>
        {/* nub marking the facing direction */}
        <mesh position={[0, height * 0.62, radius]} castShadow>
          <boxGeometry args={[0.14, 0.14, 0.28]} />
          <meshStandardMaterial color="#ffd36b" {...MATERIAL_PBR.FLAT_PLACEHOLDER} />
        </mesh>
      </group>
      <PlayerAvatar onReady={onAvatarReady} />
    </group>
  )
}
