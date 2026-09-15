import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  BLOCK_PLACEMENTS,
  BLOCK_SIZE,
  CAP_OVERHANG,
  DIRT_BANDS,
  GRASS_CAP,
  SPECKLE,
} from '../data/blocks.js'
import { MATERIAL_PBR } from '../data/materials.js'

// The building block (Tech.md §6 prop set). Presentation only: every number it
// draws comes from src/data/blocks.js, and the collider reads the same table.
//
// One geometry, one MeshStandardMaterial, one InstancedMesh — the whole field
// of blocks is a single draw call (Tech.md §7). Bands are vertex colours
// rather than materials, which is exactly what makes that possible.

// --- geometry ---------------------------------------------------------------
// Quads are wound CCW seen from outside. UVs are laid out in metres and the
// texture's `repeat` sets the dot density, so a band's dots never stretch with
// its height and a scaled instance carries its speckle with it.
const scratchColor = new THREE.Color()

function quad(o, corners, uvAxes, color, uvScale) {
  const base = o.positions.length / 3
  scratchColor.setStyle(color) // sRGB hex -> the renderer's linear working space
  const [uAxis, vAxis] = uvAxes
  for (const c of corners) {
    o.positions.push(c[0], c[1], c[2])
    o.uvs.push(c[uAxis] * uvScale, c[vAxis] * uvScale)
    o.colors.push(scratchColor.r, scratchColor.g, scratchColor.b)
  }
  o.indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
}

const X = 0
const Y = 1
const Z = 2

// uvScale bakes the speckle tile density into the UVs themselves (rather than
// the shared texture's `repeat`), so dirt bands and the grass cap can tile at
// different rates without needing separate textures or materials.
function box(o, half, y0, y1, top, side, bottom, uvScale) {
  const a = -half
  const b = half
  quad(o, [[a, y1, b], [b, y1, b], [b, y1, a], [a, y1, a]], [X, Z], top, uvScale) // +Y
  quad(o, [[a, y0, a], [b, y0, a], [b, y0, b], [a, y0, b]], [X, Z], bottom, uvScale) // -Y
  quad(o, [[a, y0, b], [b, y0, b], [b, y1, b], [a, y1, b]], [X, Y], side, uvScale) // +Z
  quad(o, [[b, y0, a], [a, y0, a], [a, y1, a], [b, y1, a]], [X, Y], side, uvScale) // -Z
  quad(o, [[b, y0, b], [b, y0, a], [b, y1, a], [b, y1, b]], [Z, Y], side, uvScale) // +X
  quad(o, [[a, y0, a], [a, y0, b], [a, y1, b], [a, y1, a]], [Z, Y], side, uvScale) // -X
}

function makeBlockGeometry() {
  const o = { positions: [], uvs: [], colors: [], indices: [] }

  // Each stratum is its own closed box. Their shared horizontal faces sit back
  // to back inside the solid, so they are backface-culled rather than z-fighting
  // — and no interior face is ever drawn.
  for (const band of DIRT_BANDS) {
    box(
      o,
      BLOCK_SIZE / 2,
      band.y0,
      band.y1,
      band.color,
      band.color,
      band.color,
      SPECKLE.dirtTilesPerMetre,
    )
  }
  box(
    o,
    BLOCK_SIZE / 2 + CAP_OVERHANG,
    GRASS_CAP.y0,
    GRASS_CAP.y1,
    GRASS_CAP.top,
    GRASS_CAP.side,
    GRASS_CAP.bottom,
    SPECKLE.grassTilesPerMetre,
  )

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(o.positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(o.uvs, 2))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(o.colors, 3))
  geo.setIndex(o.indices)
  // Corners are unshared, so this resolves to flat per-face normals.
  geo.computeVertexNormals()
  return geo
}

// --- speckle ----------------------------------------------------------------
// A grid of small stud-shaped bumps (a soft contact-shadow disc plus a dark
// rim on the shadowed side), multiplied over whatever band colour the vertex
// colours supply underneath — the same bevel trick Ground.jsx's/Road.jsx's
// studs use, but shading-only: this texture *multiplies* over the dirt/grass
// bands' own vertex colour rather than owning it outright (one texture
// serves every band, dirt and grass cap alike, at their own independent
// uvScale), so it can only darken — white is the ceiling, there is no
// brighter-than-white highlight stroke to fake the lit side of the bump.
// Same shading-only adaptation as GrassBlocks.jsx's own dirt-body texture.
function makeSpeckleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SPECKLE.size
  const g = canvas.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, SPECKLE.size, SPECKLE.size)

  const r = SPECKLE.dot / 2
  for (let y = 0; y < SPECKLE.size; y += SPECKLE.cell) {
    for (let x = 0; x < SPECKLE.size; x += SPECKLE.cell) {
      const cx = x + SPECKLE.cell / 2
      const cy = y + SPECKLE.cell / 2
      g.fillStyle = `rgba(0, 0, 0, ${SPECKLE.alpha * 0.5})`
      g.beginPath()
      g.arc(cx, cy, r, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = `rgba(0, 0, 0, ${SPECKLE.alpha})`
      g.lineWidth = Math.max(1, r * 0.35)
      g.beginPath()
      g.arc(cx, cy, r * 0.85, Math.PI * 0.05, Math.PI * 0.6)
      g.stroke()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  // Tile density is baked into each band's UVs (see box()/quad() in
  // makeBlockGeometry), so this texture itself just wraps at its native scale.
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 1 // Tech.md §7
  // Smooth (not nearest) filtering: the old flat dot wanted crisp pixel
  // edges, but these are soft circular bumps, and nearest-filtering a 64px
  // canvas shared across dirt (5 tiles/m) and grass (2 tiles/m) at whatever
  // distance the third-person camera sits would alias badly.
  return tex
}

// --- component --------------------------------------------------------------
const scratchMatrix = new THREE.Matrix4()
const scratchPosition = new THREE.Vector3()
const scratchQuaternion = new THREE.Quaternion()
const scratchScale = new THREE.Vector3()

export default function BuildingBlocks() {
  const meshRef = useRef(null)
  const geometry = useMemo(makeBlockGeometry, [])
  const texture = useMemo(makeSpeckleTexture, [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        vertexColors: true,
        ...MATERIAL_PBR.GROUND,
      }),
    [texture],
  )

  // Instances are static: written once, never touched by the frame loop.
  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < BLOCK_PLACEMENTS.length; i++) {
      const b = BLOCK_PLACEMENTS[i]
      scratchPosition.set(b.x, b.y, b.z)
      scratchScale.set(b.sx ?? b.scale ?? 1, b.sy ?? b.scale ?? 1, b.sz ?? b.scale ?? 1)
      scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale)
      mesh.setMatrixAt(i, scratchMatrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [])

  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      texture.dispose()
    },
    [geometry, material, texture],
  )

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, BLOCK_PLACEMENTS.length]}
      matrixAutoUpdate={false}
      receiveShadow
    />
  )
}

