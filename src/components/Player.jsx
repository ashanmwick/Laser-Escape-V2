import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { player, PLAYER_RADIUS, PLAYER_HEIGHT } from '../systems/playerState.js'

// Presentation only: read the player singleton, draw a capsule. The group origin
// sits at the capsule base (feet), matching playerState's convention.
export default function Player() {
  const ref = useRef()
  const cylinder = PLAYER_HEIGHT - PLAYER_RADIUS * 2

  useFrame(() => {
    const g = ref.current
    if (!g) return
    g.position.set(player.position.x, player.position.y, player.position.z)
    g.rotation.y = player.facing
  })

  return (
    <group ref={ref}>
      <mesh position-y={PLAYER_HEIGHT / 2}>
        <capsuleGeometry args={[PLAYER_RADIUS, cylinder, 4, 12]} />
        <meshLambertMaterial color="#d9564b" />
      </mesh>
      {/* nub marking the facing direction */}
      <mesh position={[0, PLAYER_HEIGHT * 0.62, PLAYER_RADIUS]}>
        <boxGeometry args={[0.14, 0.14, 0.28]} />
        <meshLambertMaterial color="#ffd36b" />
      </mesh>
    </group>
  )
}
