import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { MATERIAL_PBR } from '../data/materials.js'

// Ground plane — a green studded (LEGO/Bloxity-style) floor authored in code
// (Tech.md §3: level layout is code, not a Blender file). Look and transform
// both track the Blender reference object `ground_plane_checker_green` /
// material `ground_checker_green`: a two-tone green checker, now with a
// bevelled stud grid baked into each cell (the technique a reference
// project's world uses for its own floor/grass/dirt materials — see
// Tech.md's amendment note), drawn to a CanvasTexture so it costs nothing to
// download (Tech.md §7) and stays one draw call on a MeshStandardMaterial.
// Position matches the reference's location (727.326, 0, 0 in Blender Z-up;
// rotation 0; object origin at the plane's geometric centre) so the code
// floor sits exactly where the reference does. The reference carries an
// unapplied object scale of (2.027, 1, 1) on X — width/depth below are its
// world-space dimensions in metres, which already bake that scale in.
const GROUND_WIDTH = 1820.7913818359375 // Blender world X (dimensions.x)
const GROUND_DEPTH = 137.60633850097656 // Blender world Y (dimensions.y)
const GROUND_POSITION = [727.3260498046875, 0, 0] // Blender Z-up -> three Y-up
const CELL = 2 // metres per checker cell (matches the old grid pitch)
const STUDS_PER_CELL = 4 // studs per cell, each stud on a CELL/STUDS_PER_CELL = 0.5m pitch
const DARK = '#54a739'
const LIGHT = '#84ce54'

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
  const cellPx = 128 // px per checker cell in the source bitmap
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = cellPx * 2
  const g = canvas.getContext('2d')
  const pitch = cellPx / STUDS_PER_CELL
  const bevel = Math.max(2, cellPx / 40)

  for (const [cx, cy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const base = (cx + cy) % 2 === 0 ? LIGHT : DARK
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
  tex.repeat.set(GROUND_WIDTH / (CELL * 2), GROUND_DEPTH / (CELL * 2))
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export default function Ground() {
  const texture = useMemo(makeStudTexture, [])
  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={GROUND_POSITION} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[GROUND_WIDTH, GROUND_DEPTH]} />
      <meshStandardMaterial map={texture} {...MATERIAL_PBR.GROUND} />
    </mesh>
  )
}
