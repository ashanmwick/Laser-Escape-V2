// Paints one "vortex.png"-equivalent bitmap to a CanvasTexture — a soft
// purple/magenta core glow with three tapering spiral arms, feathered to
// fully transparent at the rim so the plane's square corners never show.
// Code-generated for the same reason data/targetGroundMat.js's checker mats
// are (Tech.md §6: no runtime asset beyond the one prop atlas), and reused
// unscaled by both VortexEffect.jsx layers — only their own opacity/scale/
// rotation differ.
import * as THREE from 'three'

const TEX_SIZE = 256

export function makeVortexTexture() {
  const size = TEX_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2

  // soft white-purple core glow, brightest at centre
  const core = g.createRadialGradient(cx, cy, 0, cx, cy, maxR)
  core.addColorStop(0, 'rgba(255,255,255,0.95)')
  core.addColorStop(0.25, 'rgba(220,170,255,0.55)')
  core.addColorStop(1, 'rgba(220,170,255,0)')
  g.fillStyle = core
  g.fillRect(0, 0, size, size)

  // logarithmic-ish spiral arms, each stroked with a gradient that fades
  // from bright core to transparent at the rim
  const arms = 3
  const turns = 2.2
  const steps = 240
  g.lineCap = 'round'
  for (let a = 0; a < arms; a++) {
    const armOffset = (a / arms) * Math.PI * 2
    g.beginPath()
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const angle = armOffset + t * turns * Math.PI * 2
      const r = t * maxR * 0.96
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    const grad = g.createLinearGradient(
      cx,
      cy,
      cx + Math.cos(armOffset) * maxR,
      cy + Math.sin(armOffset) * maxR
    )
    grad.addColorStop(0, 'rgba(255,255,255,0.95)')
    grad.addColorStop(0.5, 'rgba(200,120,255,0.65)')
    grad.addColorStop(1, 'rgba(160,40,255,0)')
    g.strokeStyle = grad
    g.lineWidth = size * 0.05
    g.stroke()
  }

  // mask everything past the rim to fully transparent
  g.globalCompositeOperation = 'destination-in'
  const mask = g.createRadialGradient(cx, cy, maxR * 0.15, cx, cy, maxR)
  mask.addColorStop(0, 'rgba(255,255,255,1)')
  mask.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = mask
  g.fillRect(0, 0, size, size)
  g.globalCompositeOperation = 'source-over'

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.name = 'vortex_effect'
  return tex
}
