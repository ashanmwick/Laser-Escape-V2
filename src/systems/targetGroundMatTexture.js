// Paints one target ground mat's checker+stud bitmap to a CanvasTexture —
// the same trick Ground.jsx's own checker floor uses, so it costs nothing
// to download and stays one draw call (Tech.md §7). Grid layout and the
// bevel tint live in data/targetGroundMat.js (shared by every target); the
// three fill colors (border/blockA/blockB) are passed in per call, so
// components/TargetGroundMat.jsx can paint a distinct texture per target
// from data/targetGroundMat.js's TARGET_GROUND_MAT_COLORS.
import * as THREE from 'three'
import {
  TARGET_GROUND_MAT_GRID as GRID,
  TARGET_GROUND_MAT_STUD_HIGHLIGHT as STUD_HIGHLIGHT,
  TARGET_GROUND_MAT_STUD_SHADOW as STUD_SHADOW,
} from '../data/targetGroundMat.js'

const STUD_PX = 48 // px per stud in the source bitmap

function paintStud(g, cx, cy, r, baseColor) {
  g.fillStyle = baseColor
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fill()

  // bevel: a bright arc top-left, a dark arc bottom-right — reads as a
  // raised cylindrical nub even though the material is unlit.
  g.lineWidth = r * 0.35
  g.strokeStyle = STUD_HIGHLIGHT
  g.beginPath()
  g.arc(cx, cy, r * 0.8, Math.PI * 0.75, Math.PI * 1.65)
  g.stroke()
  g.strokeStyle = STUD_SHADOW
  g.beginPath()
  g.arc(cx, cy, r * 0.8, -Math.PI * 0.25, Math.PI * 0.55)
  g.stroke()

  // flat top disc, slightly inset, so the bevel reads as a rim rather than
  // covering the whole stud.
  g.fillStyle = baseColor
  g.beginPath()
  g.arc(cx, cy, r * 0.72, 0, Math.PI * 2)
  g.fill()
}

function blockColorAt(sx, sy, colors) {
  const bx = Math.floor((sx - GRID.borderStuds) / GRID.blockStuds)
  const by = Math.floor((sy - GRID.borderStuds) / GRID.blockStuds)
  return (bx + by) % 2 === 0 ? colors.blockA : colors.blockB
}

// `colors` = { border, blockA, blockB } (data/targetGroundMat.js
// TARGET_GROUND_MAT_COLORS[id]). Returns a fresh CanvasTexture every call —
// each target mounts its own, so there is no shared singleton to cache
// (unlike systems/podiumStageAtlas.js, which several instances can share).
export function makeTargetGroundMatTexture(colors) {
  const w = GRID.studsX * STUD_PX
  const h = GRID.studsY * STUD_PX
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const g = canvas.getContext('2d')

  // base fill: the border color everywhere, so the border studs never need
  // their own separate fillRect pass.
  g.fillStyle = colors.border
  g.fillRect(0, 0, w, h)

  // checker blocks, interior only (outside borderStuds on every side).
  for (let sy = GRID.borderStuds; sy < GRID.studsY - GRID.borderStuds; sy++) {
    for (let sx = GRID.borderStuds; sx < GRID.studsX - GRID.borderStuds; sx++) {
      g.fillStyle = blockColorAt(sx, sy, colors)
      g.fillRect(sx * STUD_PX, sy * STUD_PX, STUD_PX, STUD_PX)
    }
  }

  // studs, one per cell, tinted from whatever's under it.
  const studR = STUD_PX * 0.36
  for (let sy = 0; sy < GRID.studsY; sy++) {
    for (let sx = 0; sx < GRID.studsX; sx++) {
      const onBorder =
        sx < GRID.borderStuds ||
        sx >= GRID.studsX - GRID.borderStuds ||
        sy < GRID.borderStuds ||
        sy >= GRID.studsY - GRID.borderStuds
      const base = onBorder ? colors.border : blockColorAt(sx, sy, colors)
      paintStud(g, sx * STUD_PX + STUD_PX / 2, sy * STUD_PX + STUD_PX / 2, studR, base)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.name = 'target_ground_mat'
  return tex
}
