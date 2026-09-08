import { Canvas } from '@react-three/fiber'
import GameLoop from './components/GameLoop.jsx'
import Ground from './components/Ground.jsx'
import Obstacles from './components/Obstacles.jsx'
import Player from './components/Player.jsx'
import Hud from './components/hud/Hud.jsx'

// <Canvas> + DOM overlay siblings (Tech.md §2, §5.4).
export default function App() {
  return (
    <>
      <Canvas
        dpr={[1, 1.5]}
        shadows={false}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 55, near: 0.1, far: 500, position: [0, 6, 12] }}
      >
        <color attach="background" args={['#0b0d12']} />
        {/* One hemisphere + one directional light, shadows off (Tech.md §7). */}
        <hemisphereLight args={['#cfd6e6', '#20242e', 0.9]} />
        <directionalLight position={[8, 14, 6]} intensity={1.1} />

        <GameLoop />
        <Ground />
        <Obstacles />
        <Player />
      </Canvas>
      <Hud />
    </>
  )
}
