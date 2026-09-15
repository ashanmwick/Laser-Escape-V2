// Streak/noise bitmap for one accretion-disk ring layer
// (components/VortexRingEffect.jsx). Canvas X wraps around the torus's own
// main circumference (its U), so vertical noisy streaks read as energy
// trails racing around the ring once the U axis is scrolled
// (material.map.offset.x, animated per-frame — native texture-matrix
// scrolling, so no custom ShaderMaterial is needed for it, keeping this
// inside Tech.md §7's Lambert/Basic-only rule). Canvas Y wraps the tube's
// own cross-section (its V); fading it top and bottom keeps each ring's
// edges soft instead of a hard-walled tube. Code-generated for the same
// reason vortexTexture.js's disc glow is (Tech.md §6: no ad-hoc external
// asset).
import * as THREE from 'three'

const TEX_W = 512
const TEX_H = 64

// `seed` just needs to differ per ring so the 4 layers don't all repeat an
// identical streak pattern — not a security- or gameplay-sensitive RNG, so
// a tiny LCG is plenty.
export function makeVortexRingTexture(seed = 1) {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const g = canvas.getContext('2d')

  g.clearRect(0, 0, TEX_W, TEX_H)

  // faint continuous base so the ring reads as one band, not just streaks
  // on nothing
  g.fillStyle = 'rgba(255,255,255,0.18)'
  g.fillRect(0, 0, TEX_W, TEX_H)

  let state = (seed * 9301 + 49297) % 233280
  const next = () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }

  const streaks = 90
  for (let i = 0; i < streaks; i++) {
    const x = next() * TEX_W
    const w = 2 + next() * 10
    const alpha = 0.25 + next() * 0.55
    g.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
    g.fillRect(x, 0, w, TEX_H)
  }

  // vertical fade: transparent at the tube's own top/bottom rim, opaque
  // through the middle
  g.globalCompositeOperation = 'destination-in'
  const mask = g.createLinearGradient(0, 0, 0, TEX_H)
  mask.addColorStop(0, 'rgba(255,255,255,0)')
  mask.addColorStop(0.5, 'rgba(255,255,255,1)')
  mask.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = mask
  g.fillRect(0, 0, TEX_W, TEX_H)
  g.globalCompositeOperation = 'source-over'

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.anisotropy = 4
  tex.name = `vortex_ring_${seed}`
  return tex
}
