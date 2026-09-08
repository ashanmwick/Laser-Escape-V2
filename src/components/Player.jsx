import { useCallback, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { player } from '../systems/playerState.js'
import PlayerAvatar from './PlayerAvatar.jsx'

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
  })

  // The capsule is the fallback, not dead code: it is what renders while the
  // default rig loads, or when the avatar CDN is unreachable and a load fails.
  const { radius, height } = player.dims
  const cylinder = height - radius * 2

  return (
    <group ref={ref}>
      <group visible={!hasAvatar}>
        <mesh position-y={height / 2}>
          <capsuleGeometry args={[radius, cylinder, 4, 12]} />
          <meshLambertMaterial color="#d9564b" />
        </mesh>
        {/* nub marking the facing direction */}
        <mesh position={[0, height * 0.62, radius]}>
          <boxGeometry args={[0.14, 0.14, 0.28]} />
          <meshLambertMaterial color="#ffd36b" />
        </mesh>
      </group>
      <PlayerAvatar onReady={onAvatarReady} />
    </group>
  )
}
