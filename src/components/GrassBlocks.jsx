import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  GRASS_BLOCK_COLORS,
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
const Y_AXIS = new THREE.Vector3(0, 1, 0)

const X = 0
const Y = 1
const Z = 2

// One quad, UV-mapped 0..1 across its own face: the Y-axis side of a face
// normalizes against [y0, y1] (that box's own height range), the X/Z side
// against [-half, half] — a plain per-face unwrap, not a per-metre one
// (see data/grassBlocks.js GRASS_BLOCK_SPECKLE's own comment on why: this
// prop's instances vary 11x-86x in scale, so tile count is tied to the UV
// unit square rather than world metres).
function quad(o, corners, uvAxes, half, y0, y1) {
  const base = o.positions.length / 3
  const [uAxis, vAxis] = uvAxes
  const norm = (axis, v) => (axis === Y ? (v - y0) / (y1 - y0) : (v / half + 1) / 2)
  for (const c of corners) {
    o.positions.push(c[0], c[1], c[2])
    o.uvs.push(norm(uAxis, c[uAxis]), norm(vAxis, c[vAxis]))
  }
  o.indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
}

function box(o, half, y0, y1) {
  const a = -half
  const b = half
  quad(o, [[a, y1, b], [b, y1, b], [b, y1, a], [a, y1, a]], [X, Z], half, y0, y1) // +Y
  quad(o, [[a, y0, a], [b, y0, a], [b, y0, b], [a, y0, b]], [X, Z], half, y0, y1) // -Y
  quad(o, [[a, y0, b], [b, y0, b], [b, y1, b], [a, y1, b]], [X, Y], half, y0, y1) // +Z
  quad(o, [[b, y0, a], [a, y0, a], [a, y1, a], [b, y1, a]], [X, Y], half, y0, y1) // -Z
  quad(o, [[b, y0, b], [b, y0, a], [b, y1, a], [b, y1, b]], [Z, Y], half, y0, y1) // +X
  quad(o, [[a, y0, a], [a, y0, b], [a, y1, b], [a, y1, a]], [Z, Y], half, y0, y1) // -X
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

export default function GrassBlocks() {
  const dirtMeshRef = useRef(null)
  const capMeshRef = useRef(null)

  const dirtGeometry = useMemo(
    () => makeBoxGeometry(GRASS_BLOCK_SHAPE.dirtHalf, GRASS_BLOCK_SHAPE.dirtY0, GRASS_BLOCK_SHAPE.dirtY1),
    [],
  )
  const capGeometry = useMemo(
    () => makeBoxGeometry(GRASS_BLOCK_SHAPE.capHalf, GRASS_BLOCK_SHAPE.capY0, GRASS_BLOCK_SHAPE.capY1),
    [],
  )
  const dirtTexture = useMemo(
    () =>
      makeSpeckleTexture(
        GRASS_BLOCK_COLORS.dirtBase,
        GRASS_BLOCK_COLORS.dirtSpeckle,
        GRASS_BLOCK_SPECKLE.dirtTileCount,
        1,
      ),
    [],
  )
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
    () => new THREE.MeshLambertMaterial({ map: dirtTexture }),
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
      for (let i = 0; i < GRASS_BLOCK_INSTANCES.length; i++) {
        const b = GRASS_BLOCK_INSTANCES[i]
        scratchPosition.set(b.position[0], b.position[1], b.position[2])
        scratchQuaternion.setFromAxisAngle(Y_AXIS, b.rotationY)
        scratchScale.set(b.scale[0], b.scale[1], b.scale[2])
        scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale)
        mesh.setMatrixAt(i, scratchMatrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }, [])

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
        args={[dirtGeometry, dirtMaterial, GRASS_BLOCK_INSTANCES.length]}
        matrixAutoUpdate={false}
      />
      <instancedMesh
        ref={capMeshRef}
        args={[capGeometry, grassMaterial, GRASS_BLOCK_INSTANCES.length]}
        matrixAutoUpdate={false}
      />
    </>
  )
}
