import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { healthFraction, wallHealthView } from '../systems/wallHealth.js'
import { player } from '../systems/playerState.js'
import { useGameStore } from '../store/useGameStore.js'
import { WALL_AABBS } from '../data/wallProps.js'
import { WALL_HEALTH_BAR as BAR } from '../data/wallHealth.js'

// In-world health bar above each wall (Tech.md §5.4: presentation only, never
// re-renders per frame — this component renders once and drives everything
// imperatively from useFrame, reading systems/wallHealth.js + the store's
// destroyedWalls straight off getState()). Every bar is one slot in a fixed set
// of InstancedMeshes, dead/hidden slots scaled to zero, so the draw-call count
// is a small constant no matter how many walls stand (same pattern as
// components/LaserParticles.jsx). All tunable numbers live in
// data/wallHealth.js; only structural constants (texture size, layer z-bias)
// are here.

// One anchor per wall, from the AABB already computed in data/wallProps.js
// (index-aligned with WALL_AABBS / WALL_PROPS): centred on the wall's width,
// partway up its face, and pushed FACE_OFFSET out from the approach (-X) face
// so the billboarded bar floats in front of the wall instead of inside it.
const ANCHORS = WALL_AABBS.map((a) => ({
  id: a.id,
  x: a.min.x - BAR.FACE_OFFSET,
  y: a.min.y + (a.max.y - a.min.y) * BAR.HEIGHT_FRAC + BAR.Y_OFFSET,
  z: (a.min.z + a.max.z) / 2,
}))
const CAP = ANCHORS.length

const STOP_COLORS = BAR.COLOR_STOPS.map((s) => new THREE.Color(s.color))

// Layer draw order, back to front: backing, trailing damage chip, live fill,
// segment notches. Tiny camera-space z nudges on top of renderOrder keep the
// four transparent, depth-write-off quads from z-fighting.
const Z_BIAS = { bg: 0, chip: 0.01, fill: 0.02, notch: 0.03 }

// Scratch, hoisted — zero allocation per frame (Tech.md §7).
const _mat = new THREE.Matrix4()
const _pos = new THREE.Vector3()
const _off = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scl = new THREE.Vector3()
const _col = new THREE.Color()
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)

// Health fraction -> fill colour, lerped between the bracketing COLOR_STOPS
// (stored high health to low).
function colorForFrac(f, out) {
  const stops = BAR.COLOR_STOPS
  if (f >= stops[0].at) return out.copy(STOP_COLORS[0])
  for (let i = 1; i < stops.length; i++) {
    if (f >= stops[i].at) {
      const t = (f - stops[i].at) / (stops[i - 1].at - stops[i].at)
      return out.copy(STOP_COLORS[i]).lerp(STOP_COLORS[i - 1], t)
    }
  }
  return out.copy(STOP_COLORS[STOP_COLORS.length - 1])
}

// White rounded-rect on transparent — the alpha mask shared by backing, chip
// and fill. Green channel is what three samples for alphaMap.
function makeRoundedMask() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 24
  const x = c.getContext('2d')
  x.clearRect(0, 0, 128, 24)
  x.fillStyle = '#ffffff'
  x.beginPath()
  x.roundRect(1, 1, 126, 22, 10)
  x.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.NoColorSpace
  tex.anisotropy = 1
  return tex
}

// Opaque only along SEGMENTS-1 thin bars — laid over the bar in BG_COLOR so the
// bar reads as discrete cells.
function makeNotchMask() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 24
  const x = c.getContext('2d')
  x.clearRect(0, 0, 128, 24)
  x.fillStyle = '#ffffff'
  for (let i = 1; i < BAR.SEGMENTS; i++) {
    const px = Math.round((128 / BAR.SEGMENTS) * i) - 1
    x.fillRect(px, 1, 2, 22)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.NoColorSpace
  tex.anisotropy = 1
  return tex
}

export default function WallHealthBars() {
  const camera = useThree((s) => s.camera)

  const bgRef = useRef(null)
  const chipRef = useRef(null)
  const fillRef = useRef(null)
  const notchRef = useRef(null)
  const billboardRef = useRef(null)
  const textRef = useRef(null)

  // Trailing "damage chip" value per wall id, eased toward the true fraction.
  const chip = useRef({})
  const lastTextWrite = useRef(0)
  const lastTextValue = useRef(-1)

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const roundedMask = useMemo(makeRoundedMask, [])
  const notchMask = useMemo(makeNotchMask, [])

  const materials = useMemo(() => {
    // depthTest off: the bar is a gameplay readout and must stay visible even
    // when the wall face (or a prop) is between it and the camera. renderOrder
    // on each mesh keeps the four layers stacked correctly.
    const base = { transparent: true, depthWrite: false, depthTest: false, toneMapped: false }
    return {
      bg: new THREE.MeshBasicMaterial({
        ...base,
        color: BAR.BG_COLOR,
        alphaMap: roundedMask,
        opacity: 0.82,
      }),
      chip: new THREE.MeshBasicMaterial({ ...base, color: BAR.CHIP_COLOR, alphaMap: roundedMask }),
      // White base so the per-instance colour (setColorAt) shows true.
      fill: new THREE.MeshBasicMaterial({ ...base, color: '#ffffff', alphaMap: roundedMask }),
      notch: new THREE.MeshBasicMaterial({ ...base, color: BAR.BG_COLOR, alphaMap: notchMask }),
    }
  }, [roundedMask, notchMask])

  useLayoutEffect(() => {
    for (const ref of [bgRef, chipRef, fillRef, notchRef]) {
      const m = ref.current
      if (!m) continue
      for (let i = 0; i < CAP; i++) m.setMatrixAt(i, ZERO)
      m.instanceMatrix.needsUpdate = true
    }
  }, [])

  useEffect(
    () => () => {
      geometry.dispose()
      roundedMask.dispose()
      notchMask.dispose()
      for (const m of Object.values(materials)) m.dispose()
    },
    [geometry, roundedMask, notchMask, materials],
  )

  useFrame((_, delta) => {
    const bg = bgRef.current
    const chipMesh = chipRef.current
    const fill = fillRef.current
    const notch = notchRef.current
    if (!bg || !chipMesh || !fill || !notch) return

    const dt = Math.min(delta, 0.1)
    const now = performance.now()
    const destroyed = useGameStore.getState().destroyedWalls
    const activeId = wallHealthView.activeId
    const px = player.position.x
    const py = player.position.y
    const pz = player.position.z
    const rangeSq = BAR.SHOW_RANGE * BAR.SHOW_RANGE

    // One camera-facing orientation for every bar this frame (they only diverge
    // meaningfully in the periphery, which the range/linger gate hides anyway).
    _quat.copy(camera.quaternion)

    for (let i = 0; i < CAP; i++) {
      const a = ANCHORS[i]

      if (destroyed.has(a.id)) {
        bg.setMatrixAt(i, ZERO)
        chipMesh.setMatrixAt(i, ZERO)
        fill.setMatrixAt(i, ZERO)
        notch.setMatrixAt(i, ZERO)
        continue
      }

      const frac = healthFraction(a.id)
      const sinceHit = now - (wallHealthView.lastHitAt[a.id] ?? -1e9)
      const dx = px - a.x
      const dy = py - a.y
      const dz = pz - a.z
      const near = dx * dx + dy * dy + dz * dz < rangeSq
      const visible = activeId === a.id || sinceHit < BAR.LINGER_SECONDS * 1000 || near

      if (!visible) {
        bg.setMatrixAt(i, ZERO)
        chipMesh.setMatrixAt(i, ZERO)
        fill.setMatrixAt(i, ZERO)
        notch.setMatrixAt(i, ZERO)
        continue
      }

      // Chip eases down toward the true fraction; snaps up on any reset.
      const prevChip = chip.current[a.id] ?? frac
      const nextChip =
        prevChip > frac ? Math.max(frac, prevChip - BAR.CHIP_EASE * dt) : frac
      chip.current[a.id] = nextChip

      const flash =
        sinceHit < BAR.FLASH_SECONDS * 1000 ? 1 - sinceHit / (BAR.FLASH_SECONDS * 1000) : 0
      const h = BAR.HEIGHT * (1 + flash * BAR.FLASH_SCALE)

      // Backing + notches: full width, centred on the anchor.
      _off.set(0, 0, Z_BIAS.bg).applyQuaternion(_quat)
      _pos.set(a.x + _off.x, a.y + _off.y, a.z + _off.z)
      _mat.compose(_pos, _quat, _scl.set(BAR.WIDTH, h, 1))
      bg.setMatrixAt(i, _mat)

      _off.set(0, 0, Z_BIAS.notch).applyQuaternion(_quat)
      _pos.set(a.x + _off.x, a.y + _off.y, a.z + _off.z)
      _mat.compose(_pos, _quat, _scl.set(BAR.WIDTH, h, 1))
      notch.setMatrixAt(i, _mat)

      // Chip + fill: width scaled by fraction, left edge pinned to the bar's
      // left edge (local x = -WIDTH/2).
      composeBar(chipMesh, i, a, nextChip, h, Z_BIAS.chip)
      composeBar(fill, i, a, frac, h, Z_BIAS.fill)
      fill.setColorAt(i, colorForFrac(frac, _col))
    }

    bg.instanceMatrix.needsUpdate = true
    chipMesh.instanceMatrix.needsUpdate = true
    fill.instanceMatrix.needsUpdate = true
    notch.instanceMatrix.needsUpdate = true
    if (fill.instanceColor) fill.instanceColor.needsUpdate = true

    // Percentage readout: follows the active wall, hidden when none. Text is
    // costly to re-lay-out, so only when the whole-number percent changes and
    // at most ~10Hz.
    const bill = billboardRef.current
    const text = textRef.current
    if (bill && text) {
      if (activeId == null) {
        bill.visible = false
      } else {
        const a = ANCHORS[wallIndex(activeId)]
        bill.visible = true
        bill.position.set(a.x, a.y + BAR.HEIGHT / 2 + 0.7, a.z)
        const pct = Math.round(healthFraction(activeId) * 100)
        if (pct !== lastTextValue.current && now - lastTextWrite.current > 100) {
          lastTextValue.current = pct
          lastTextWrite.current = now
          text.text = `${pct}%`
          text.sync()
        }
      }
    }
  })

  return (
    <group>
      <instancedMesh
        ref={bgRef}
        args={[geometry, materials.bg, CAP]}
        renderOrder={1}
        frustumCulled={false}
        matrixAutoUpdate={false}
      />
      <instancedMesh
        ref={chipRef}
        args={[geometry, materials.chip, CAP]}
        renderOrder={2}
        frustumCulled={false}
        matrixAutoUpdate={false}
      />
      <instancedMesh
        ref={fillRef}
        args={[geometry, materials.fill, CAP]}
        renderOrder={3}
        frustumCulled={false}
        matrixAutoUpdate={false}
      />
      <instancedMesh
        ref={notchRef}
        args={[geometry, materials.notch, CAP]}
        renderOrder={4}
        frustumCulled={false}
        matrixAutoUpdate={false}
      />
      <Billboard ref={billboardRef}>
        <Text
          ref={textRef}
          fontSize={0.85}
          color="#ffffff"
          outlineWidth={0.06}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
          renderOrder={5}
          material-depthTest={false}
          material-toneMapped={false}
        >
          100%
        </Text>
      </Billboard>
    </group>
  )
}

function composeBar(mesh, i, anchor, frac, height, zBias) {
  const w = BAR.WIDTH * frac
  // Local x of the fill's centre when its left edge sits at -WIDTH/2.
  const localX = (BAR.WIDTH / 2) * (frac - 1)
  _off.set(localX, 0, zBias).applyQuaternion(_quat)
  _pos.set(anchor.x + _off.x, anchor.y + _off.y, anchor.z + _off.z)
  _mat.compose(_pos, _quat, _scl.set(w, height, 1))
  mesh.setMatrixAt(i, _mat)
}

function wallIndex(id) {
  for (let i = 0; i < CAP; i++) if (ANCHORS[i].id === id) return i
  return 0
}
