import WallProp from './WallProp.jsx'
import { WALL_PROPS } from '../data/wallProps.js'
import { useGameStore } from '../store/useGameStore.js'

// The 63 objects in collection `wall` — one per Blender object (data/wallProps.js),
// each its own destructible wall. A stacked material's panels each mount their
// own WallProp off the shared per-type glTF. See WallProp.jsx and
// data/wallProps.js for the loader and per-object transform. A wall stops
// rendering once systems/wallHealth.js drains its health to 0 and records it in
// destroyedWalls (its collider is dropped separately, by systems/collision.js).
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
