import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  ROAD_WAYPOINTS,
  ROAD_WIDTH,
  ROAD_Y_OFFSET,
  ROAD_BRICK_SIZE,
  ROAD_COLOR,
  ROAD_GROUT_COLOR,
} from '../data/road.js'

// Yellow brick/tile road over the spawn hub (Tech.md §3: level layout is
// code, not a Blender file). Mirrors Ground.jsx's technique: a canvas-
// generated tile texture on a MeshLambertMaterial, one draw call — the whole
// route is a single merged BufferGeometry rather than one mesh per segment
// (Tech.md §7: "everything static and unique is merged into one geometry
// per material").

const BRICKS_PER_TILE = 2 // canvas covers a 2x2-brick running-bond repeat
const TILE_WORLD_SIZE = BRICKS_PER_TILE * ROAD_BRICK_SIZE

function makeBrickTexture() {
  const pxPerBrick = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = pxPerBrick * BRICKS_PER_TILE
  const g = canvas.getContext('2d')

  g.fillStyle = ROAD_GROUT_COLOR
  g.fillRect(0, 0, canvas.width, canvas.height)

  // Running-bond brick rows, alternate rows offset by half a brick so the
  // pattern reads as bricks rather than a plain grid.
  g.fillStyle = ROAD_COLOR
  const inset = 3
  for (let row = 0; row < BRICKS_PER_TILE; row++) {
    const y = row * pxPerBrick
    const offset = row % 2 === 0 ? 0 : pxPerBrick / 2
    for (let col = -1; col < BRICKS_PER_TILE; col++) {
      const x = col * pxPerBrick + offset
      g.fillRect(x + inset, y + inset, pxPerBrick - inset * 2, pxPerBrick - inset * 2)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1 / TILE_WORLD_SIZE, 1 / TILE_WORLD_SIZE)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// One flat ribbon quad per waypoint segment, merged into a single
// BufferGeometry (Tech.md §7). UVs are laid out in metres along/across each
// segment (same convention as BuildingBlocks.jsx's quad()), so the
// texture's own `repeat` — not per-vertex UV scaling — is what sets tile
// density: segments of different lengths stay tiled consistently and the
// joints between them need no miter geometry.
function buildRoadGeometry() {
  const positions = []
  const uvs = []
  const indices = []
  const halfWidth = ROAD_WIDTH / 2

  for (let i = 0; i < ROAD_WAYPOINTS.length - 1; i++) {
    const a = ROAD_WAYPOINTS[i]
    const b = ROAD_WAYPOINTS[i + 1]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const length = Math.hypot(dx, dz)
    if (length < 1e-6) continue
    const ux = dx / length
    const uz = dz / length
    const px = -uz * halfWidth
    const pz = ux * halfWidth

    const base = positions.length / 3
    positions.push(a.x + px, 0, a.z + pz) // left0
    positions.push(a.x - px, 0, a.z - pz) // right0
    positions.push(b.x - px, 0, b.z - pz) // right1
    positions.push(b.x + px, 0, b.z + pz) // left1

    uvs.push(0, 0, ROAD_WIDTH, 0, ROAD_WIDTH, length, 0, length)
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export default function Road() {
  const texture = useMemo(makeBrickTexture, [])
  const geometry = useMemo(buildRoadGeometry, [])

  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(() => () => texture.dispose(), [texture])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh position={[0, ROAD_Y_OFFSET, 0]} geometry={geometry}>
      {/* DoubleSide: the road is only ever seen from above, but this frees the
         segment winding from having to be hand-verified per direction. */}
      <meshLambertMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  )
}
