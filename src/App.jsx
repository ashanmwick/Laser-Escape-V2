import { Canvas } from '@react-three/fiber'
import GameLoop from './components/GameLoop.jsx'
import BuildingBlocks from './components/BuildingBlocks.jsx'
import Ground from './components/Ground.jsx'
import Obstacles from './components/Obstacles.jsx'
import Player from './components/Player.jsx'
import Hud from './components/hud/Hud.jsx'
import { QUALITY_DPR } from './data/bloxity.js'
import { settings } from './systems/settingsState.js'
import { useSettings } from './components/hud/hooks.js'

// <Canvas> + DOM overlay siblings (Tech.md §2, §5.4).
export default function App() {
  // graphics_quality caps the device pixel ratio. This is a *user-elected*
  // tier applied on change — not the frame-time-driven resolution scaling
  // Tech.md §7 rejects — and it stays inside the [1, 1.5] clamp.
  useSettings()
  const dprCap = QUALITY_DPR[settings.graphics_quality] ?? QUALITY_DPR.High

  return (
    <>
      <Canvas
        dpr={[1, dprCap]}
        shadows={false}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 55, near: 0.1, far: 500, position: [0, 6, 12] }}
      >
        <color attach="background" args={['#afd3ff']} />
        {/* One hemisphere + one directional light, shadows off (Tech.md §7).
           Tuned for bright midday: strong sky fill + warm ground bounce so
           nothing reads as shadowed. */}
        <hemisphereLight args={['#eaf3ff', '#b7a98f', 2.2]} />
        <directionalLight position={[8, 14, 6]} intensity={2.4} />

        <GameLoop />
        <Ground />
        <BuildingBlocks />
        <Obstacles />
        <Player />
      </Canvas>
      <Hud />
    </>
  )
}
