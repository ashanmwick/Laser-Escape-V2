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

// The building block (Tech.md §6 prop set). Presentation only: every number it
// draws comes from src/data/blocks.js, and the collider reads the same table.
//
// One geometry, one MeshLambertMaterial, one InstancedMesh — the whole field of
// blocks is a single draw call (Tech.md §7). Bands are vertex colours rather
// than materials, which is exactly what makes that possible.

// --- geometry ---------------------------------------------------------------
// Quads are wound CCW seen from outside. UVs are laid out in metres and the
// texture's `repeat` sets the dot density, so a band's dots never stretch with
// its height and a scaled instance carries its speckle with it.
const scratchColor = new THREE.Color()

function quad(o, corners, uvAxes, color) {
  const base = o.positions.length / 3
  scratchColor.setStyle(color) // sRGB hex -> the renderer's linear working space
  const [uAxis, vAxis] = uvAxes
  for (const c of corners) {
    o.positions.push(c[0], c[1], c[2])
    o.uvs.push(c[uAxis], c[vAxis])
    o.colors.push(scratchColor.r, scratchColor.g, scratchColor.b)
  }
  o.indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
}

const X = 0
const Y = 1
const Z = 2

function box(o, half, y0, y1, top, side, bottom) {
  const a = -half
  const b = half
  quad(o, [[a, y1, b], [b, y1, b], [b, y1, a], [a, y1, a]], [X, Z], top) // +Y
  quad(o, [[a, y0, a], [b, y0, a], [b, y0, b], [a, y0, b]], [X, Z], bottom) // -Y
  quad(o, [[a, y0, b], [b, y0, b], [b, y1, b], [a, y1, b]], [X, Y], side) // +Z
  quad(o, [[b, y0, a], [a, y0, a], [a, y1, a], [b, y1, a]], [X, Y], side) // -Z
  quad(o, [[b, y0, b], [b, y0, a], [b, y1, a], [b, y1, b]], [Z, Y], side) // +X
  quad(o, [[a, y0, a], [a, y0, b], [a, y1, b], [a, y1, a]], [Z, Y], side) // -X
}

function makeBlockGeometry() {
  const o = { positions: [], uvs: [], colors: [], indices: [] }

  // Each stratum is its own closed box. Their shared horizontal faces sit back
  // to back inside the solid, so they are backface-culled rather than z-fighting
  // — and no interior face is ever drawn.
  for (const band of DIRT_BANDS) {
    box(o, BLOCK_SIZE / 2, band.y0, band.y1, band.color, band.color, band.color)
  }
  box(
    o,
    BLOCK_SIZE / 2 + CAP_OVERHANG,
    GRASS_CAP.y0,
    GRASS_CAP.y1,
    GRASS_CAP.top,
    GRASS_CAP.side,
    GRASS_CAP.bottom,
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
function makeSpeckleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SPECKLE.size
  const g = canvas.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, SPECKLE.size, SPECKLE.size)

  // A grid of slightly darker pixels, multiplied over whatever band colour the
  // vertex colours supply underneath.
  g.fillStyle = `rgba(0, 0, 0, ${SPECKLE.alpha})`
  const inset = Math.floor((SPECKLE.cell - SPECKLE.dot) / 2)
  for (let y = 0; y < SPECKLE.size; y += SPECKLE.cell) {
    for (let x = 0; x < SPECKLE.size; x += SPECKLE.cell) {
      g.fillRect(x + inset, y + inset, SPECKLE.dot, SPECKLE.dot)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(SPECKLE.tilesPerMetre, SPECKLE.tilesPerMetre)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 1 // Tech.md §7
  // Crisp texels up close, mipmapped on the way out — the pixel grid is the
  // look, so magnifying it must not blur it.
  tex.magFilter = THREE.NearestFilter
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
    () => new THREE.MeshLambertMaterial({ map: texture, vertexColors: true }),
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
    />
  )
}

