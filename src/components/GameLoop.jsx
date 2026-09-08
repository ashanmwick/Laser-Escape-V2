import { useThree, useFrame } from '@react-three/fiber'
import { tick } from '../systems/timeScale.js'
import { step } from '../systems/playerMovement.js'
import { update as updateCamera } from '../systems/cameraOrbit.js'
import { step as stepAction } from '../systems/actionTracker.js'
import { step as stepLaser } from '../systems/laser.js'
import { step as stepLaserParticles } from '../systems/laserParticles.js'
import { step as stepWallHealth } from '../systems/wallHealth.js'
import { getAabbs } from '../systems/collision.js'
import { notifyFirstFrame } from '../systems/bloxity.js'

// The single simulation tick. Rendered before the view components so its
// useFrame subscribes first and runs first each frame. Reads systems directly;
// never calls setState (Tech.md §5.4).
export default function GameLoop() {
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)

  useFrame(() => {
    const dt = tick()
    step(dt, getAabbs())
    updateCamera(camera, dt)
    stepAction(dt)
    stepLaser(camera, scene)
    stepWallHealth(dt)
    stepLaserParticles(dt)
    // The game is interactive as soon as a frame is on screen, with or without
    // a signed-in avatar; dismiss the portal loading screen here. No-ops after
    // the first call.
    notifyFirstFrame()
  })

  return null
}
