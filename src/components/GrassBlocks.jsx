import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  GRASS_BLOCK_COLORS,
  GRASS_BLOCK_DIRT_BANDS,
  GRASS_BLOCK_INSTANCES,
  GRASS_BLOCK_SHAPE,
  GRASS_BLOCK_STUD,
} from '../data/grassBlocks.js'
import { MATERIAL_PBR } from '../data/materials.js'

// The 160 `grass_block_dirt.NNN` objects (collection `grass_block_new`,
// data/grassBlocks.js) — a lane border, so this is the largest repeat count
// of any prop in the game. Code-generated (Tech.md §7 — nothing here is
// downloaded), the same move as components/PodiumStage.jsx retiring the
// Blender-authored power_podium/target_podium: every tunable number (shape,
// colour, tile density) lives in data/grassBlocks.js, this file just builds
// geometry and canvas textures from it.
//
// Four boxes (three dirt bands, one grass cap) sharing one InstancedMesh
// transform, drawn as four InstancedMesh calls — one per material. Each
// band is a true two-tone stud checker owning its own colour outright
// (a reference project's own material shape — see Tech.md's amendment
// note), not one shared texture *multiplied* over a vertex colour, which is
// why banding now costs four draw calls instead of two: a checker can't be
// vertex-tinted per band the way a modulation texture could. Still well
// inside Tech.md §7's <60 busiest-view cap.
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
// (see data/grassBlocks.js GRASS_BLOCK_STUD's own comment on why: this
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

// One closed box, UV-mapped 0..1 per face — used for the grass cap and, now
// that each dirt band owns its colour via its own stud checker rather than
// a vertex tint, for every dirt band too (components/GrassBlocks.jsx maps
// GRASS_BLOCK_DIRT_BANDS to one of these each, instead of the old single
// banded/vertex-coloured geometry).
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

// The full bevelled two-tone stud checker — same recipe as Ground.jsx's
// floor / Road.jsx's road, and now every surface in this file (the grass cap
// and each of the three dirt bands): each owns its colour outright rather
// than modulating a vertex colour underneath, the same NAMED-material shape
// a reference project's world uses (GRASS_BLOCK_STUD's own comment has the
// full rationale on tileCount). `tileCount` ({x, y}) is the texture's own
// repeat per axis — how many times this one canvas tiles across a face's
// 0..1 UV range along U and V independently, tunable per surface since each
// gets its own texture instance.
function makeStudTexture(baseColor, altColor, tileCount) {
  const { canvasSize, cellsPerTile, studsPerCell } = GRASS_BLOCK_STUD
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = canvasSize
  const g = canvas.getContext('2d')
  const cellPx = canvasSize / cellsPerTile
  const pitch = cellPx / studsPerCell
  const bevel = Math.max(1, cellPx / 20)

  for (let cy = 0; cy < cellsPerTile; cy++) {
    for (let cx = 0; cx < cellsPerTile; cx++) {
      const base = (cx + cy) % 2 === 0 ? baseColor : altColor
      const x0 = cx * cellPx
      const y0 = cy * cellPx

      g.fillStyle = base
      g.fillRect(x0, y0, cellPx, cellPx)
      // Plate bevel: lit top-left, shaded bottom-right.
      g.fillStyle = shade(base, 0.1)
      g.fillRect(x0, y0, cellPx, bevel)
      g.fillRect(x0, y0, bevel, cellPx)
      g.fillStyle = shade(base, -0.14)
      g.fillRect(x0, y0 + cellPx - bevel, cellPx, bevel)
      g.fillRect(x0 + cellPx - bevel, y0, bevel, cellPx)

      for (let sy = 0; sy < studsPerCell; sy++) {
        for (let sx = 0; sx < studsPerCell; sx++) {
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
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(tileCount.x, tileCount.y)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// `instances` defaults to the main lane border (GRASS_BLOCK_INSTANCES) but
// accepts any list shaped the same way, so a second placement of the same
// shape/material (e.g. data/pvpBlocks.js's PVP_DIRT_INSTANCES) can mount a
// second <GrassBlocks> without duplicating the geometry/texture-build code.
export default function GrassBlocks({ instances = GRASS_BLOCK_INSTANCES }) {
  const capMeshRef = useRef(null)
  const bandMeshRefs = useRef([])

  const bandGeometries = useMemo(
    () =>
      GRASS_BLOCK_DIRT_BANDS.map((band) =>
        makeBoxGeometry(GRASS_BLOCK_SHAPE.dirtHalf, band.y0, band.y1),
      ),
    [],
  )
  const capGeometry = useMemo(
    () => makeBoxGeometry(GRASS_BLOCK_SHAPE.capHalf, GRASS_BLOCK_SHAPE.capY0, GRASS_BLOCK_SHAPE.capY1),
    [],
  )
  const bandTextures = useMemo(
    () =>
      GRASS_BLOCK_DIRT_BANDS.map((band) =>
        makeStudTexture(band.stud[0], band.stud[1], GRASS_BLOCK_STUD.dirtTileCount),
      ),
    [],
  )
  const grassTexture = useMemo(
    () =>
      makeStudTexture(
        GRASS_BLOCK_COLORS.grassBase,
        GRASS_BLOCK_COLORS.grassSpeckle,
        GRASS_BLOCK_STUD.grassTileCount,
      ),
    [],
  )
  const bandMaterials = useMemo(
    () =>
      bandTextures.map(
        (texture) => new THREE.MeshStandardMaterial({ map: texture, ...MATERIAL_PBR.GROUND }),
      ),
    [bandTextures],
  )
  const grassMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ map: grassTexture, ...MATERIAL_PBR.GROUND }),
    [grassTexture],
  )

  // Instances are static: written once, never touched by the frame loop
  // (Tech.md §7). Every mesh shares the same transform list — the three
  // dirt bands and the grass cap are the same 160 placements, just four
  // different draws.
  useLayoutEffect(() => {
    for (const mesh of [capMeshRef.current, ...bandMeshRefs.current]) {
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
      for (const g of bandGeometries) g.dispose()
      capGeometry.dispose()
      for (const m of bandMaterials) m.dispose()
      grassMaterial.dispose()
      for (const t of bandTextures) t.dispose()
      grassTexture.dispose()
    },
    [bandGeometries, capGeometry, bandMaterials, grassMaterial, bandTextures, grassTexture],
  )

  return (
    <>
      {bandGeometries.map((geometry, i) => (
        <instancedMesh
          key={i}
          ref={(el) => (bandMeshRefs.current[i] = el)}
          args={[geometry, bandMaterials[i], instances.length]}
          matrixAutoUpdate={false}
          receiveShadow
        />
      ))}
      <instancedMesh
        ref={capMeshRef}
        args={[capGeometry, grassMaterial, instances.length]}
        matrixAutoUpdate={false}
        receiveShadow
      />
    </>
  )
}
