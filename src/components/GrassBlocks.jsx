import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  GRASS_BLOCK_COLORS,
  GRASS_BLOCK_DIRT_BANDS,
  GRASS_BLOCK_DIRT_GRID,
  GRASS_BLOCK_INSTANCES,
  GRASS_BLOCK_SHAPE,
  GRASS_BLOCK_SPECKLE,
} from '../data/grassBlocks.js'

// The 160 `grass_block_dirt.NNN` objects (collection `grass_block_new`,
// data/grassBlocks.js) — a lane border, so this is the largest repeat count
// of any prop in the game. Code-generated (Tech.md §7 — nothing here is
// downloaded), the same move as components/PodiumStage.jsx retiring the
// Blender-authored power_podium/target_podium: every tunable number (shape,
// colour, tile density) lives in data/grassBlocks.js, this file just builds
// geometry and canvas textures from it.
//
// Two boxes (dirt body, grass cap) sharing one InstancedMesh transform, drawn
// as two InstancedMesh calls — one per material, same 2-draw-call budget the
// retired glTF cost via propModel.js's loadPropParts (Tech.md §7 caps
// busiest-view draw calls at 60; 160 scene-graph clones at 2 materials each
// would spend 320 of that on their own).
const scratchMatrix = new THREE.Matrix4()
const scratchPosition = new THREE.Vector3()
const scratchQuaternion = new THREE.Quaternion()
const scratchScale = new THREE.Vector3()
const scratchColor = new THREE.Color()
const Y_AXIS = new THREE.Vector3(0, 1, 0)

const X = 0
const Y = 1
const Z = 2

// One quad, UV-mapped 0..1 across its own face: the Y-axis side of a face
// normalizes against [y0, y1] (that box's own height range), the X/Z side
// against [-half, half] — a plain per-face unwrap, not a per-metre one
// (see data/grassBlocks.js GRASS_BLOCK_SPECKLE's own comment on why: this
// prop's instances vary 11x-86x in scale, so tile count is tied to the UV
// unit square rather than world metres). `color`, when given, pushes a
// per-vertex colour (sRGB hex -> the renderer's linear working space) —
// used by the banded dirt body, skipped by the single-tone grass cap.
function quad(o, corners, uvAxes, half, y0, y1, color) {
  const base = o.positions.length / 3
  const [uAxis, vAxis] = uvAxes
  const norm = (axis, v) => (axis === Y ? (v - y0) / (y1 - y0) : (v / half + 1) / 2)
  if (color) scratchColor.setStyle(color)
  for (const c of corners) {
    o.positions.push(c[0], c[1], c[2])
    o.uvs.push(norm(uAxis, c[uAxis]), norm(vAxis, c[vAxis]))
    if (color) o.colors.push(scratchColor.r, scratchColor.g, scratchColor.b)
  }
  o.indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
}

function box(o, half, y0, y1, color) {
  const a = -half
  const b = half
  quad(o, [[a, y1, b], [b, y1, b], [b, y1, a], [a, y1, a]], [X, Z], half, y0, y1, color) // +Y
  quad(o, [[a, y0, a], [b, y0, a], [b, y0, b], [a, y0, b]], [X, Z], half, y0, y1, color) // -Y
  quad(o, [[a, y0, b], [b, y0, b], [b, y1, b], [a, y1, b]], [X, Y], half, y0, y1, color) // +Z
  quad(o, [[b, y0, a], [a, y0, a], [a, y1, a], [b, y1, a]], [X, Y], half, y0, y1, color) // -Z
  quad(o, [[b, y0, b], [b, y0, a], [b, y1, a], [b, y1, b]], [Z, Y], half, y0, y1, color) // +X
  quad(o, [[a, y0, a], [a, y0, b], [a, y1, b], [a, y1, a]], [Z, Y], half, y0, y1, color) // -X
}

function makeBoxGeometry(half, y0, y1) {
  const o = { positions: [], uvs: [], indices: [] }
  box(o, half, y0, y1)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(o.positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(o.uvs, 2))
  geo.setIndex(o.indices)
  geo.computeVertexNormals()
  return geo
}

// The dirt body: one closed box per band (data/grassBlocks.js
// GRASS_BLOCK_DIRT_BANDS), stacked bottom-up. Shared horizontal faces sit
// back to back inside the solid — backface-culled, never drawn — same as
// BuildingBlocks.jsx's makeBlockGeometry. Each band's own box() call
// normalizes its V axis to its own 0..1 height range, so the dot-grid
// texture below tiles identically across all three regardless of band
// height.
function makeBandedBoxGeometry(half, bands) {
  const o = { positions: [], uvs: [], colors: [], indices: [] }
  for (const band of bands) box(o, half, band.y0, band.y1, band.color)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(o.positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(o.uvs, 2))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(o.colors, 3))
  geo.setIndex(o.indices)
  geo.computeVertexNormals()
  return geo
}

// A small seeded PRNG (mulberry32) so the dirt and grass textures come out
// looking the same on every load rather than reshuffling on each mount.
function makeRng(seed) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Irregular soft blobs over a flat fill — the retired glTF's two bakes were
// exactly this (a base tone plus lighter random patches), not a regular
// pattern, so this draws ellipses at random rather than BuildingBlocks.jsx's
// dot grid. `tileCount` ({x, y}) is the texture's own repeat per axis — how
// many times this one canvas tiles across a face's 0..1 UV range along U and
// V independently, itself independently tunable per material since dirt and
// grass are already two separate textures.
function makeSpeckleTexture(baseColor, speckleColor, tileCount, seed) {
  const { canvasSize, blobCount, blobAlpha, blobMinRadius, blobMaxRadius } = GRASS_BLOCK_SPECKLE
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = canvasSize
  const g = canvas.getContext('2d')
  g.fillStyle = baseColor
  g.fillRect(0, 0, canvasSize, canvasSize)

  const rand = makeRng(seed)
  g.fillStyle = speckleColor
  g.globalAlpha = blobAlpha
  for (let i = 0; i < blobCount; i++) {
    const x = rand() * canvasSize
    const y = rand() * canvasSize
    const rx = blobMinRadius + rand() * (blobMaxRadius - blobMinRadius)
    const ry = rx * (0.6 + rand() * 0.6)
    const rot = rand() * Math.PI
    g.beginPath()
    g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
    g.fill()
  }
  g.globalAlpha = 1

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(tileCount.x, tileCount.y)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// The dirt body's texture: a regular grid of darker pixels multiplied over
// whatever band colour the vertex colours supply underneath — same technique
// as BuildingBlocks.jsx's makeSpeckleTexture, opaque so it needs no alpha
// blending, and reused across all three bands since only the vertex colour
// underneath changes.
function makeGridTexture(grid) {
  const { canvasSize, cell, dot, alpha, tileCount } = grid
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = canvasSize
  const g = canvas.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, canvasSize, canvasSize)

  g.fillStyle = `rgba(0, 0, 0, ${alpha})`
  const inset = Math.floor((cell - dot) / 2)
  for (let y = 0; y < canvasSize; y += cell) {
    for (let x = 0; x < canvasSize; x += cell) {
      g.fillRect(x + inset, y + inset, dot, dot)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(tileCount.x, tileCount.y)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.magFilter = THREE.NearestFilter
  return tex
}

// `instances` defaults to the main lane border (GRASS_BLOCK_INSTANCES) but
// accepts any list shaped the same way, so a second placement of the same
// shape/material (e.g. data/pvpBlocks.js's PVP_DIRT_INSTANCES) can mount a
// second <GrassBlocks> without duplicating the geometry/texture-build code.
export default function GrassBlocks({ instances = GRASS_BLOCK_INSTANCES }) {
  const dirtMeshRef = useRef(null)
  const capMeshRef = useRef(null)

  const dirtGeometry = useMemo(
    () => makeBandedBoxGeometry(GRASS_BLOCK_SHAPE.dirtHalf, GRASS_BLOCK_DIRT_BANDS),
    [],
  )
  const capGeometry = useMemo(
    () => makeBoxGeometry(GRASS_BLOCK_SHAPE.capHalf, GRASS_BLOCK_SHAPE.capY0, GRASS_BLOCK_SHAPE.capY1),
    [],
  )
  const dirtTexture = useMemo(() => makeGridTexture(GRASS_BLOCK_DIRT_GRID), [])
  const grassTexture = useMemo(
    () =>
      makeSpeckleTexture(
        GRASS_BLOCK_COLORS.grassBase,
        GRASS_BLOCK_COLORS.grassSpeckle,
        GRASS_BLOCK_SPECKLE.grassTileCount,
        2,
      ),
    [],
  )
  const dirtMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ map: dirtTexture, vertexColors: true }),
    [dirtTexture],
  )
  const grassMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ map: grassTexture }),
    [grassTexture],
  )

  // Instances are static: written once, never touched by the frame loop
  // (Tech.md §7). Both meshes share the same transform list — the dirt body
  // and grass cap are the same 160 placements, just two different draws.
  useLayoutEffect(() => {
    for (const mesh of [dirtMeshRef.current, capMeshRef.current]) {
      if (!mesh) continue
      for (let i = 0; i < instances.length; i++) {
        const b = instances[i]
        scratchPosition.set(b.position[0], b.position[1], b.position[2])
        scratchQuaternion.setFromAxisAngle(Y_AXIS, b.rotationY)
        scratchScale.set(b.scale[0], b.scale[1], b.scale[2])
        scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale)
        mesh.setMatrixAt(i, scratchMatrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }, [instances])

  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(
    () => () => {
      dirtGeometry.dispose()
      capGeometry.dispose()
      dirtMaterial.dispose()
      grassMaterial.dispose()
      dirtTexture.dispose()
      grassTexture.dispose()
    },
    [dirtGeometry, capGeometry, dirtMaterial, grassMaterial, dirtTexture, grassTexture],
  )

  return (
    <>
      <instancedMesh
        ref={dirtMeshRef}
        args={[dirtGeometry, dirtMaterial, instances.length]}
        matrixAutoUpdate={false}
      />
      <instancedMesh
        ref={capMeshRef}
        args={[capGeometry, grassMaterial, instances.length]}
        matrixAutoUpdate={false}
      />
    </>
  )
}
