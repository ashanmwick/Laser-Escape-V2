import { useThree, useFrame } from '@react-three/fiber'
import { tick } from '../systems/timeScale.js'
import { step } from '../systems/playerMovement.js'
import { update as updateCamera } from '../systems/cameraOrbit.js'
import { HUB_AABBS } from '../data/hub.js'
import { notifyFirstFrame } from '../systems/bloxity.js'

// The single simulation tick. Rendered before the view components so its
// useFrame subscribes first and runs first each frame. Reads systems directly;
// never calls setState (Tech.md §5.4).
export default function GameLoop() {
  const camera = useThree((s) => s.camera)

  useFrame(() => {
    const dt = tick()
    step(dt, HUB_AABBS)
    updateCamera(camera, dt)
    // The game is interactive as soon as a frame is on screen, with or without
    // a signed-in avatar; dismiss the portal loading screen here. No-ops after
    // the first call.
    notifyFirstFrame()
  })

  return null
}
