// The one texture the `wood_crate` prop uses: a single square canvas panel —
// plank grain, a raised-look edge frame, one diagonal corner brace, and a
// scatter of bolt/rivet squares — applied unmodified to all 6 faces of every
// crate's BoxGeometry (systems/woodCrateModel.js). Framework-free (Tech.md
// rule 2).
//
// Generated, not downloaded — the same trick podiumStageAtlas.js /
// merchantShopModel.js use: procedural detail costs nothing to ship and
// stays one texture in GPU memory (Tech.md §7). One texture, one
// MeshStandardMaterial, so the whole 3-crate stack is a single draw call.
//
// Layout and the palette are data (data/woodCrate.js CRATE_ATLAS_SIZE /
// CRATE_COLORS / FRAME / BRACE / RIVETS).
import * as THREE from 'three'
import {
  CRATE_ATLAS_SIZE,
  CRATE_COLORS as C,
  FRAME,
  BRACE,
  RIVETS,
} from '../data/woodCrate.js'

// Deterministic PRNG (mulberry32) — the grain must be identical across
// reloads rather than reshuffling every session, same as podiumStageAtlas.js.
function makeRand(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// --- plank base + grain ------------------------------------------------
function paintPlanks(g, size) {
  const rand = makeRand(0x9c3a51f0)
  g.fillStyle = C.base
  g.fillRect(0, 0, size, size)

  // vertical plank seams
  const planks = 5
  for (let i = 1; i < planks; i++) {
    const x = (i * size) / planks
    g.strokeStyle = C.grain
    g.globalAlpha = 0.35
    g.lineWidth = size * 0.006
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, size)
    g.stroke()
  }

  // broad tonal banding per plank column (column-to-column colour variation)
  for (let i = 0; i < planks; i++) {
    const bx = (i * size) / planks
    const bw = size / planks
    g.fillStyle = i % 2 ? C.light : C.grain
    g.globalAlpha = 0.07 + rand() * 0.05
    g.fillRect(bx, 0, bw, size)
  }

  // horizontal grain lines, sine-warped, running the full width
  g.globalAlpha = 1
  g.lineCap = 'round'
  const lines = 120
  for (let i = 0; i < lines; i++) {
    const v = rand() * size
    const amp = 1 + rand() * 4
    const waves = 1 + Math.floor(rand() * 3)
    const phase = rand() * Math.PI * 2
    g.strokeStyle = rand() < 0.35 ? C.light : C.grain
    g.globalAlpha = 0.1 + rand() * 0.28
    g.lineWidth = 0.5 + rand() * 1.8
    g.beginPath()
    for (let px = 0; px <= size; px += 6) {
      const t = px / size
      const vy = v + Math.sin(phase + t * waves * Math.PI * 2) * amp
      if (px === 0) g.moveTo(px, vy)
      else g.lineTo(px, vy)
    }
    g.stroke()
  }

  // a few knots
  for (let k = 0; k < 3; k++) {
    const kx = rand() * size
    const ky = rand() * size
    const kr = size * (0.012 + rand() * 0.02)
    for (let r = kr; r > 1.5; r -= 2) {
      g.strokeStyle = r < kr * 0.45 ? C.grain : C.light
      g.globalAlpha = 0.3
      g.lineWidth = 1
      g.beginPath()
      g.ellipse(kx, ky, r, r * 0.55, 0.4, 0, Math.PI * 2)
      g.stroke()
    }
  }
  g.globalAlpha = 1
}

// --- a bevelled strip: fill + a lit sliver on one long edge, a shadow
// sliver on the other, so it reads as proud of the plank surface once lit --
function bevelRect(g, x, y, w, h, bevel, lightOnTop) {
  g.fillStyle = C.frame
  g.fillRect(x, y, w, h)
  const along = w >= h
  g.fillStyle = C.frameLight
  if (along) g.fillRect(x, lightOnTop ? y : y + h - bevel, w, bevel)
  else g.fillRect(lightOnTop ? x : x + w - bevel, y, bevel, h)
  g.fillStyle = C.frameDark
  if (along) g.fillRect(x, lightOnTop ? y + h - bevel : y, w, bevel)
  else g.fillRect(lightOnTop ? x + w - bevel : x, y, bevel, h)
}

// --- edge frame ----------------------------------------------------------
function paintFrame(g, size) {
  const w = size * FRAME.width
  const b = size * FRAME.bevel
  bevelRect(g, 0, 0, size, w, b, true) // top
  bevelRect(g, 0, size - w, size, w, b, true) // bottom
  bevelRect(g, 0, 0, w, size, b, true) // left
  bevelRect(g, size - w, 0, w, size, b, true) // right
}

// --- diagonal brace, corner to corner (top-left to bottom-right) ---------
function paintBrace(g, size) {
  const diag = size * Math.SQRT2
  const w = diag * BRACE.width
  const b = diag * BRACE.bevel
  g.save()
  g.translate(size / 2, size / 2)
  g.rotate(Math.PI / 4)
  bevelRect(g, -diag / 2, -w / 2, diag, w, b, true)
  g.restore()
}

// --- bolt/rivet squares, scattered on a grid, skipped near the brace -----
function paintRivets(g, size) {
  const inner = size * FRAME.width * 1.4
  const span = size - inner * 2
  const cell = span / RIVETS.cells
  const rSize = size * RIVETS.size
  for (let row = 0; row < RIVETS.cells; row++) {
    for (let col = 0; col < RIVETS.cells; col++) {
      const cx = inner + cell * (col + 0.5)
      const cy = inner + cell * (row + 0.5)
      const distFromDiag = Math.abs(cx - cy) / Math.SQRT2
      if (distFromDiag < size * BRACE.width * 0.75) continue
      g.fillStyle = C.rivet
      g.globalAlpha = 0.55
      g.fillRect(cx - rSize / 2, cy - rSize / 2, rSize, rSize)
      g.globalAlpha = 1
      // tiny highlight corner so it reads as a raised bolt head, not a hole
      g.fillStyle = C.light
      g.globalAlpha = 0.4
      g.fillRect(cx - rSize / 2, cy - rSize / 2, rSize * 0.4, rSize * 0.4)
      g.globalAlpha = 1
    }
  }
}

let atlas = null

function paintAtlas() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = CRATE_ATLAS_SIZE
  const g = canvas.getContext('2d')
  const size = CRATE_ATLAS_SIZE

  paintPlanks(g, size)
  paintRivets(g, size)
  paintBrace(g, size)
  paintFrame(g, size)

  return canvas
}

// One shared texture for every instance of the prop, built on first use —
// the same module-level-singleton idea WallProp.jsx uses for its crack
// bitmap. Mipmapped and sRGB, anisotropy left at 1 per Tech.md §7.
export function getWoodCrateAtlas() {
  if (!atlas) {
    atlas = new THREE.CanvasTexture(paintAtlas())
    atlas.colorSpace = THREE.SRGBColorSpace
    atlas.generateMipmaps = true
    atlas.minFilter = THREE.LinearMipmapLinearFilter
    atlas.magFilter = THREE.LinearFilter
    atlas.anisotropy = 1
    atlas.name = 'wood_crate_atlas'
    atlas.needsUpdate = true
  }
  return atlas
}

// Disposal is deliberately not offered: the atlas is a process-wide
// singleton shared by every mounted instance, exactly like podiumStageAtlas.
