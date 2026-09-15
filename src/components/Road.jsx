import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  ROAD_WAYPOINTS,
  ROAD_SPUR_HUB_LEFT_WAYPOINTS,
  ROAD_SPUR_HUB_RIGHT_WAYPOINTS,
  ROAD_SPUR_TARGET_LEFT_WAYPOINTS,
  ROAD_SPUR_TARGET_RIGHT_WAYPOINTS,
  ROAD_WIDTH,
  ROAD_Y_OFFSET,
  ROAD_BRICK_SIZE,
  ROAD_COLOR,
  ROAD_GROUT_COLOR,
} from '../data/road.js'
import { MATERIAL_PBR } from '../data/materials.js'

// Yellow studded (LEGO/Bloxity-style) road over the spawn hub (Tech.md §3:
// level layout is code, not a Blender file). Same technique as Ground.jsx's
// floor — a bevelled stud grid baked into a two-tone checker, the pattern a
// reference project's world uses uniformly for grass/dirt/path/floor
// materials (see Tech.md's amendment note) — reused here for the road with
// its own ROAD_COLOR/ROAD_GROUT_COLOR tones standing in for that project's
// tan "path" palette, at half the stud density of Ground.jsx's (the road's
// cell is half the size, so studs stay the same ~0.5m world pitch on both):
// a canvas-generated tile texture on a MeshStandardMaterial, one draw call —
// the whole route is a single merged BufferGeometry rather than one mesh per
// segment (Tech.md §7: "everything static and unique is merged into one
// geometry per material").

const CELLS_PER_TILE = 2 // canvas covers a 2x2-cell checker repeat
const STUDS_PER_CELL = 2 // studs per cell, each stud on a ROAD_BRICK_SIZE/2 = 0.5m pitch
const TILE_WORLD_SIZE = CELLS_PER_TILE * ROAD_BRICK_SIZE

// Lighten (amount > 0) or darken (amount < 0) a hex colour; returns a CSS colour.
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const gComponent = (n >> 8) & 255
  const b = n & 255
  const f = (c) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount))
  return `rgb(${f(r)},${f(gComponent)},${f(b)})`
}

function disc(ctx, x, y, r, fill) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function makeStudTexture() {
  const cellPx = 64 // px per cell in the source bitmap
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = cellPx * CELLS_PER_TILE
  const g = canvas.getContext('2d')
  const pitch = cellPx / STUDS_PER_CELL
  const bevel = Math.max(2, cellPx / 40)

  for (const [cx, cy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const base = (cx + cy) % 2 === 0 ? ROAD_COLOR : ROAD_GROUT_COLOR
    const x0 = cx * cellPx
    const y0 = cy * cellPx

    g.fillStyle = base
    g.fillRect(x0, y0, cellPx, cellPx)
    // Plate bevel: lit top-left, shaded bottom-right — same trick as the
    // studs themselves, so the cell reads as a raised plate.
    g.fillStyle = shade(base, 0.1)
    g.fillRect(x0, y0, cellPx, bevel)
    g.fillRect(x0, y0, bevel, cellPx)
    g.fillStyle = shade(base, -0.14)
    g.fillRect(x0, y0 + cellPx - bevel, cellPx, bevel)
    g.fillRect(x0 + cellPx - bevel, y0, bevel, cellPx)

    for (let sy = 0; sy < STUDS_PER_CELL; sy++) {
      for (let sx = 0; sx < STUDS_PER_CELL; sx++) {
        const x = x0 + (sx + 0.5) * pitch
        const y = y0 + (sy + 0.5) * pitch
        const r = pitch * 0.3
        disc(g, x + pitch * 0.05, y + pitch * 0.08, r * 1.05, 'rgba(0,0,0,0.28)')
        disc(g, x, y, r, shade(base, 0.05))
        g.lineWidth = pitch * 0.07
        g.strokeStyle = 'rgba(255,255,255,0.45)'
        g.beginPath()
        g.arc(x, y, r * 0.78, Math.PI, Math.PI * 1.55)
        g.stroke()
        g.strokeStyle = 'rgba(0,0,0,0.18)'
        g.beginPath()
        g.arc(x, y, r * 0.85, Math.PI * 0.05, Math.PI * 0.6)
        g.stroke()
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1 / TILE_WORLD_SIZE, 1 / TILE_WORLD_SIZE)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// A waypoint's `color` re-tints the baked texture by its ratio to the
// default ROAD_COLOR (see data/road.js), so an unset color multiplies the
// texture by white (1,1,1) — a no-op — and today's uniform look is
// reproduced exactly.
const DEFAULT_COLOR = new THREE.Color(ROAD_COLOR)
function tintFor(waypoint) {
  const c = new THREE.Color(waypoint.color ?? ROAD_COLOR)
  return [c.r / DEFAULT_COLOR.r, c.g / DEFAULT_COLOR.g, c.b / DEFAULT_COLOR.b]
}

// One flat ribbon quad per waypoint segment, merged into a single
// BufferGeometry (Tech.md §7). UVs are laid out in metres along/across each
// segment (same convention as BuildingBlocks.jsx's quad()), so the
// texture's own `repeat` — not per-vertex UV scaling — is what sets tile
// density: segments of different lengths stay tiled consistently and the
// joints between them need no miter geometry. Each end of a segment uses
// its own waypoint's width, so the quad tapers when neighbouring waypoints
// disagree; per-vertex color carries each waypoint's tint, lerped by the
// GPU across the segment.
//
// Appends one polyline's worth of segments (ROAD_WAYPOINTS, or one of the
// ROAD_SPUR_*_WAYPOINTS exports) into the shared buffers — kept as its own
// path rather than concatenated with others so a spur never draws a stray
// segment jumping back to the main road's next waypoint.
function addPolyline(waypoints, positions, uvs, colors, indices) {
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i]
    const b = waypoints[i + 1]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const length = Math.hypot(dx, dz)
    if (length < 1e-6) continue
    const ux = dx / length
    const uz = dz / length
    const widthA = a.width ?? ROAD_WIDTH
    const widthB = b.width ?? ROAD_WIDTH
    const paX = (-uz * widthA) / 2
    const paZ = (ux * widthA) / 2
    const pbX = (-uz * widthB) / 2
    const pbZ = (ux * widthB) / 2
    const tintA = tintFor(a)
    const tintB = tintFor(b)

    const base = positions.length / 3
    positions.push(a.x + paX, 0, a.z + paZ) // left0
    positions.push(a.x - paX, 0, a.z - paZ) // right0
    positions.push(b.x - pbX, 0, b.z - pbZ) // right1
    positions.push(b.x + pbX, 0, b.z + pbZ) // left1

    uvs.push(0, 0, widthA, 0, widthB, length, 0, length)
    colors.push(...tintA, ...tintA, ...tintB, ...tintB)
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
}

function buildRoadGeometry() {
  const positions = []
  const uvs = []
  const colors = []
  const indices = []

  addPolyline(ROAD_WAYPOINTS, positions, uvs, colors, indices)
  addPolyline(ROAD_SPUR_HUB_LEFT_WAYPOINTS, positions, uvs, colors, indices)
  addPolyline(ROAD_SPUR_HUB_RIGHT_WAYPOINTS, positions, uvs, colors, indices)
  addPolyline(ROAD_SPUR_TARGET_LEFT_WAYPOINTS, positions, uvs, colors, indices)
  addPolyline(ROAD_SPUR_TARGET_RIGHT_WAYPOINTS, positions, uvs, colors, indices)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export default function Road() {
  const texture = useMemo(makeStudTexture, [])
  const geometry = useMemo(buildRoadGeometry, [])

  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(() => () => texture.dispose(), [texture])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh position={[0, ROAD_Y_OFFSET, 0]} geometry={geometry} receiveShadow>
      {/* DoubleSide: the road is only ever seen from above, but this frees the
         segment winding from having to be hand-verified per direction. */}
      <meshStandardMaterial
        map={texture}
        vertexColors
        side={THREE.DoubleSide}
        {...MATERIAL_PBR.GROUND}
      />
    </mesh>
  )
}
