import WallProp from './WallProp.jsx'
import { WALL_PROPS } from '../data/wallProps.js'
import { useGameStore } from '../store/useGameStore.js'

// The 10 objects in collection `wall` — each its own glTF (data/wallProps.js),
// placed once. See WallProp.jsx and data/wallProps.js for the shared loader
// and per-object transform. A wall stops rendering once systems/wallHealth.js
// drains its health to 0 and records it in destroyedWalls (its collider is
// dropped separately, by systems/collision.js).
export default function WallProps() {
  const destroyed = useGameStore((s) => s.destroyedWalls)

  return (
    <>
      {WALL_PROPS.filter((w) => !destroyed.has(w.id)).map((w) => (
        <WallProp key={w.id} id={w.id} url={w.url} position={w.position} rotationY={w.rotationY} />
      ))}
    </>
  )
}
