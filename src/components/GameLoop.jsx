import { useThree, useFrame } from '@react-three/fiber'
import { tick } from '../systems/timeScale.js'
import { step } from '../systems/playerMovement.js'
import { update as updateCamera } from '../systems/cameraOrbit.js'
import { HUB_AABBS } from '../data/hub.js'

// The single simulation tick. Rendered before the view components so its
// useFrame subscribes first and runs first each frame. Reads systems directly;
// never calls setState (Tech.md §5.4).
export default function GameLoop() {
  const camera = useThree((s) => s.camera)

  useFrame(() => {
    const dt = tick()
    step(dt, HUB_AABBS)
    updateCamera(camera, dt)
  })

  return null
}
