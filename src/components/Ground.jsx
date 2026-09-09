import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

// Ground plane — a green checker floor authored in code (Tech.md §3: level
// layout is code, not a Blender file). Look and transform both track the
// Blender reference object `ground_plane_checker_green` / material
// `ground_checker_green`: a two-tone green checkerboard drawn to a
// CanvasTexture so it costs nothing to download (Tech.md §7) and stays one
// draw call on a MeshLambertMaterial. Position matches the reference's
// location (727.326, 0, 0 in Blender Z-up; rotation 0; object origin at the
// plane's geometric centre) so the code floor sits exactly where the
// reference does. The reference carries an unapplied object scale of
// (2.027, 1, 1) on X — width/depth below are its world-space dimensions in
// metres, which already bake that scale in.
const GROUND_WIDTH = 1820.7913818359375 // Blender world X (dimensions.x)
const GROUND_DEPTH = 137.60633850097656 // Blender world Y (dimensions.y)
const GROUND_POSITION = [727.3260498046875, 0, 0] // Blender Z-up -> three Y-up
const CELL = 2 // metres per checker cell (matches the old grid pitch)
const DARK = '#54a739'
const LIGHT = '#84ce54'

function makeCheckerTexture() {
  const cell = 128 // px per cell in the source bitmap
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = cell * 2
  const g = canvas.getContext('2d')

  // 2x2 checker
  g.fillStyle = LIGHT
  g.fillRect(0, 0, canvas.width, canvas.height)
  g.fillStyle = DARK
  g.fillRect(0, 0, cell, cell)
  g.fillRect(cell, cell, cell, cell)

  // faint inset panel per cell — echoes the baked detail in the reference image
  g.strokeStyle = 'rgba(255, 255, 255, 0.06)'
  g.lineWidth = 2
  const pad = cell * 0.18
  for (const [x, y] of [[0, 0], [cell, 0], [0, cell], [cell, cell]]) {
    g.strokeRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(GROUND_WIDTH / (CELL * 2), GROUND_DEPTH / (CELL * 2))
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export default function Ground() {
  const texture = useMemo(makeCheckerTexture, [])
  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={GROUND_POSITION} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[GROUND_WIDTH, GROUND_DEPTH]} />
      <meshLambertMaterial map={texture} />
    </mesh>
  )
}
