import { HUB_AABBS } from '../data/hub.js'

// Visual boxes for the collider's static AABBs. Presentation only — the data
// lives in src/data/hub.js.
export default function Obstacles() {
  return (
    <group>
      {HUB_AABBS.map((b, i) => {
        const sx = b.max.x - b.min.x
        const sy = b.max.y - b.min.y
        const sz = b.max.z - b.min.z
        return (
          <mesh
            key={i}
            position={[b.min.x + sx / 2, b.min.y + sy / 2, b.min.z + sz / 2]}
          >
            <boxGeometry args={[sx, sy, sz]} />
            <meshLambertMaterial color="#4a5165" />
          </mesh>
        )
      })}
    </group>
  )
}
