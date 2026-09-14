import { Canvas, useLoader } from '@react-three/fiber'
import { TextureLoader, EquirectangularReflectionMapping, SRGBColorSpace } from 'three'
import GameLoop from './components/GameLoop.jsx'
import BuildingBlocks from './components/BuildingBlocks.jsx'
import GrassBlocks from './components/GrassBlocks.jsx'
import GrassBlockCubes from './components/GrassBlockCubes.jsx'
import Ground from './components/Ground.jsx'
import Road from './components/Road.jsx'
import Obstacles from './components/Obstacles.jsx'
import PodiumStage from './components/PodiumStage.jsx'
import MerchantShop from './components/MerchantShop.jsx'
import WoodCrateStack from './components/WoodCrateStack.jsx'
import PvpWall from './components/PvpWall.jsx'
import HexPowerPads from './components/HexPowerPads.jsx'
import Targets from './components/Targets.jsx'
import GlowFloorPanels from './components/GlowFloorPanels.jsx'
import WallProps from './components/WallProps.jsx'
import WallDebris from './components/WallDebris.jsx'
import WallHealthBars from './components/WallHealthBars.jsx'
import Player from './components/Player.jsx'
import RemotePlayers from './components/RemotePlayers.jsx'
import Laser from './components/Laser.jsx'
import LaserParticles from './components/LaserParticles.jsx'
import Hud from './components/hud/Hud.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import { QUALITY_DPR } from './data/bloxity.js'
import {
  PODIUM_STAGE_HUB_TRANSFORM,
  PODIUM_STAGE_TARGET_TRANSFORM,
  PODIUM_STAGE_TARGET_PROFILE,
  TARGET_SIGN_TEXT,
} from './data/podiumStage.js'
import { PVP_DIRT_INSTANCES, PVP_CUBE_INSTANCES } from './data/pvpBlocks.js'
import { WOOD_CRATE_TRANSFORMS } from './data/woodCrate.js'
import { settings } from './systems/settingsState.js'
import { useSettings } from './components/hud/hooks.js'

// Equirectangular sky (CC0, Poly Haven "Syferfontein 18d Clear Pure Sky")
// used as the scene background instead of a flat color.
function SkyBackground() {
  const texture = useLoader(TextureLoader, '/textures/sky.jpg')
  texture.mapping = EquirectangularReflectionMapping
  texture.colorSpace = SRGBColorSpace
  return <primitive attach="background" object={texture} />
}

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
        camera={{ fov: 55, near: 0.1, far: 200, position: [0, 6, 12] }}
      >
        <SkyBackground />
        {/* One hemisphere + one directional light, shadows off (Tech.md §7).
           Tuned for bright midday: strong sky fill + warm ground bounce so
           nothing reads as shadowed. */}
        <hemisphereLight args={['#eaf3ff', '#b7a98f', 2.2]} />
        <directionalLight position={[8, 14, 6]} intensity={2.4} />

        <GameLoop />
        <Ground />
        <Road />
        <BuildingBlocks />
        <GrassBlocks />
        <GrassBlockCubes />
        <GrassBlocks instances={PVP_DIRT_INSTANCES} />
        <GrassBlockCubes instances={PVP_CUBE_INSTANCES} />
        <PvpWall />
        <Obstacles />
        <PodiumStage transform={PODIUM_STAGE_HUB_TRANSFORM} />
        <PodiumStage
          transform={PODIUM_STAGE_TARGET_TRANSFORM}
          signText={TARGET_SIGN_TEXT}
          profile={PODIUM_STAGE_TARGET_PROFILE}
        />
        <MerchantShop />
        {WOOD_CRATE_TRANSFORMS.map((t, i) => (
          <WoodCrateStack key={i} transform={t} />
        ))}
        <HexPowerPads />
        <Targets />
        <GlowFloorPanels />
        <WallProps />
        <WallDebris />
        <WallHealthBars />
        <Player />
        <RemotePlayers />
        <Laser />
        <LaserParticles />
      </Canvas>
      <Hud />
      <LoadingScreen />
    </>
  )
}
