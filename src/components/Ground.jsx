// Flat ground plane + a reference grid. MeshLambertMaterial only (Tech.md §7).
export default function Ground() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[200, 200]} />
        <meshLambertMaterial color="#3a4152" />
      </mesh>
      <gridHelper args={[200, 100, '#5b6377', '#2b3040']} position-y={0.01} />
    </group>
  )
}
