import WallProp from './WallProp.jsx'
import { WALL_PROPS } from '../data/wallProps.js'

// The 10 objects in collection `wall` — each its own glTF (data/wallProps.js),
// placed once. See WallProp.jsx and data/wallProps.js for the shared loader
// and per-object transform.
export default function WallProps() {
  return (
    <>
      {WALL_PROPS.map((w) => (
        <WallProp key={w.id} url={w.url} position={w.position} rotationY={w.rotationY} />
      ))}
    </>
  )
}
