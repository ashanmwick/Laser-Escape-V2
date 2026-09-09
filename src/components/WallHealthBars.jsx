import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { healthFraction, wallHealthView } from '../systems/wallHealth.js'
import { player } from '../systems/playerState.js'
import { useGameStore } from '../store/useGameStore.js'
import { WALL_AABBS, WALL_STAGES } from '../data/wallProps.js'
import { WALL_HEALTH_BAR as BAR, HEALTH_MAX } from '../data/wallHealth.js'

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

// Layer draw order, back to front: lavender border, backing, trailing damage
// chip, live fill, segment notches. Tiny camera-space z nudges on top of
// renderOrder keep the transparent, depth-write-off quads from z-fighting.
const Z_BIAS = { border: -0.01, bg: 0, chip: 0.01, fill: 0.02, notch: 0.03, text: 0.05 }

// Always-on "Stage N / <Material>" sign, sitting this far above the bar's top
// edge. Unlike the bar and the HP readout it has no visibility gate — it shows
// for every standing wall whether or not it is being damaged (hidden only once
// the wall is destroyed and gone). Text is static, so it is never re-synced.
const STAGE_SIGN_GAP = 1.5

// Fixed orientation for every bar and its text: NOT a billboard. The quads sit
// in a plane parallel to the wall face, normal pointing back down the -X
// approach toward the player. A 15m-wide quad that pivoted to the camera would
// swing its far half into the wall, and with depthTest on (see materials) that
// half then disappears behind it. Walls are only ever read head-on, so a fixed
// facing costs nothing and can never intersect the wall. -90deg about Y turns
// the plane's default +Z normal to world -X.
const FACING = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2)

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
  c.width = 512
  c.height = 60
  const x = c.getContext('2d')
  x.clearRect(0, 0, 512, 60)
  x.fillStyle = '#ffffff'
  x.beginPath()
  x.roundRect(2, 2, 508, 56, 28) // near-full pill: crisp semicircular ends
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
  c.width = 512
  c.height = 60
  const x = c.getContext('2d')
  x.clearRect(0, 0, 512, 60)
  x.fillStyle = '#ffffff'
  for (let i = 1; i < BAR.SEGMENTS; i++) {
    const px = Math.round((512 / BAR.SEGMENTS) * i) - 3
    x.fillRect(px, 2, 6, 56)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.NoColorSpace
  tex.anisotropy = 1
  return tex
}

export default function WallHealthBars() {
  const borderRef = useRef(null)
  const bgRef = useRef(null)
  const chipRef = useRef(null)
  const fillRef = useRef(null)
  const notchRef = useRef(null)
  // One SDF <Text> per wall (see render). Driven imperatively from useFrame like
  // every other layer — no <Billboard>: they take the same fixed FACING as the
  // bar so nothing turns into the wall.
  const textRefs = useRef([]) // the "current / max" HP readout
  const stageRefs = useRef([]) // the always-on "Stage N / <Material>" sign

  // Trailing "damage chip" value per wall id, eased toward the true fraction.
  const chip = useRef({})
  // Per-wall last-shown integer HP and last write time, to throttle re-layout.
  const lastText = useRef({})
  const lastTextWrite = useRef({})

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const roundedMask = useMemo(makeRoundedMask, [])
  const notchMask = useMemo(makeNotchMask, [])

  const materials = useMemo(() => {
    // depthTest ON so anything solid between the camera and the bar — the player
    // avatar especially — occludes it instead of the bar drawing over the top of
    // the player. The bar still sits FACE_OFFSET in front of its wall, so the
    // wall never hides it. depthWrite stays OFF: the five stacked transparent
    // quads order themselves by renderOrder, not the depth buffer.
    const base = { transparent: true, depthWrite: false, depthTest: true, toneMapped: false }
    return {
      border: new THREE.MeshBasicMaterial({
        ...base,
        color: BAR.BORDER_COLOR,
        alphaMap: roundedMask,
        opacity: 1,
      }),
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
    for (const ref of [borderRef, bgRef, chipRef, fillRef, notchRef]) {
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
    const border = borderRef.current
    const bg = bgRef.current
    const chipMesh = chipRef.current
    const fill = fillRef.current
    const notch = notchRef.current
    if (!border || !bg || !chipMesh || !fill || !notch) return

    const dt = Math.min(delta, 0.1)
    const now = performance.now()
    const destroyed = useGameStore.getState().destroyedWalls
    const activeId = wallHealthView.activeId
    const px = player.position.x
    const py = player.position.y
    const pz = player.position.z
    const rangeSq = BAR.SHOW_RANGE * BAR.SHOW_RANGE

    // Fixed wall-facing orientation for every bar and its text (see FACING) —
    // deliberately not camera-facing, so a turned quad never swings into the
    // wall.
    _quat.copy(FACING)

    for (let i = 0; i < CAP; i++) {
      const a = ANCHORS[i]
      const t = textRefs.current[i]
      const stage = stageRefs.current[i]

      if (destroyed.has(a.id)) {
        border.setMatrixAt(i, ZERO)
        bg.setMatrixAt(i, ZERO)
        chipMesh.setMatrixAt(i, ZERO)
        fill.setMatrixAt(i, ZERO)
        notch.setMatrixAt(i, ZERO)
        if (t) t.visible = false
        if (stage) stage.visible = false
        continue
      }

      // Stage sign: no visibility gate — every standing wall shows it. Static
      // position (set in JSX); only the billboard turn is per-frame.
      if (stage) {
        stage.visible = true
        stage.quaternion.copy(_quat)
      }

      const frac = healthFraction(a.id)
      const sinceHit = now - (wallHealthView.lastHitAt[a.id] ?? -1e9)
      const dx = px - a.x
      const dy = py - a.y
      const dz = pz - a.z
      const near = dx * dx + dy * dy + dz * dz < rangeSq
      const visible = activeId === a.id || sinceHit < BAR.LINGER_SECONDS * 1000 || near

      if (!visible) {
        border.setMatrixAt(i, ZERO)
        bg.setMatrixAt(i, ZERO)
        chipMesh.setMatrixAt(i, ZERO)
        fill.setMatrixAt(i, ZERO)
        notch.setMatrixAt(i, ZERO)
        if (t) t.visible = false
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

      // Lavender border: the backing plus a uniform BORDER margin on every side,
      // so a frame of it shows around the bar.
      _off.set(0, 0, Z_BIAS.border).applyQuaternion(_quat)
      _pos.set(a.x + _off.x, a.y + _off.y, a.z + _off.z)
      _mat.compose(_pos, _quat, _scl.set(BAR.WIDTH + BAR.BORDER * 2, h + BAR.BORDER * 2, 1))
      border.setMatrixAt(i, _mat)

      // Backing + notches: full width, centred on the anchor.
      _off.set(0, 0, Z_BIAS.bg).applyQuaternion(_quat)
      _pos.set(a.x + _off.x, a.y + _off.y, a.z + _off.z)
      _mat.compose(_pos, _quat, _scl.set(BAR.WIDTH, h, 1))
      bg.setMatrixAt(i, _mat)

      if (BAR.SHOW_SEGMENTS) {
        _off.set(0, 0, Z_BIAS.notch).applyQuaternion(_quat)
        _pos.set(a.x + _off.x, a.y + _off.y, a.z + _off.z)
        _mat.compose(_pos, _quat, _scl.set(BAR.WIDTH, h, 1))
        notch.setMatrixAt(i, _mat)
      } else {
        notch.setMatrixAt(i, ZERO)
      }

      // Chip + fill: width scaled by fraction, left edge pinned to the bar's
      // left edge (local x = -WIDTH/2).
      composeBar(chipMesh, i, a, nextChip, h, Z_BIAS.chip)
      composeBar(fill, i, a, frac, h, Z_BIAS.fill)
      fill.setColorAt(i, colorForFrac(frac, _col))

      // "current / max" readout: one per bar, shown for as long as the bar is.
      // Text re-layout is costly, so only on a whole-HP change and at most ~10Hz.
      if (t) {
        t.visible = true
        _off.set(0, 0, Z_BIAS.text).applyQuaternion(_quat)
        t.position.set(a.x + _off.x, a.y + _off.y, a.z + _off.z)
        t.quaternion.copy(_quat)
        const cur = Math.ceil(frac * HEALTH_MAX)
        if (cur !== lastText.current[a.id] && now - (lastTextWrite.current[a.id] ?? 0) > 100) {
          lastText.current[a.id] = cur
          lastTextWrite.current[a.id] = now
          t.text = `${cur} / ${HEALTH_MAX}`
          t.sync()
        }
      }
    }

    border.instanceMatrix.needsUpdate = true
    bg.instanceMatrix.needsUpdate = true
    chipMesh.instanceMatrix.needsUpdate = true
    fill.instanceMatrix.needsUpdate = true
    notch.instanceMatrix.needsUpdate = true
    if (fill.instanceColor) fill.instanceColor.needsUpdate = true
  })

  return (
    // laserIgnore: the bars and the Stage sign sit FACE_OFFSET in front of each
    // wall — the aim ray (systems/laser.js isIgnored()) must pass straight
    // through them and land on the wall itself, never terminate on the HUD.
    <group userData={{ laserIgnore: true }}>
      <instancedMesh
        ref={borderRef}
        args={[geometry, materials.border, CAP]}
        renderOrder={0}
        frustumCulled={false}
        matrixAutoUpdate={false}
      />
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
      {ANCHORS.map((a, i) => (
        <Text
          key={a.id}
          ref={(el) => (textRefs.current[i] = el)}
          visible={false}
          fontSize={1.5}
          color="#ffffff"
          outlineWidth={0.175}
          outlineColor="#0a2a12"
          anchorX="center"
          anchorY="middle"
          renderOrder={5}
          material-depthWrite={false}
          material-toneMapped={false}
        >
          {`${HEALTH_MAX} / ${HEALTH_MAX}`}
        </Text>
      ))}
      {ANCHORS.map((a, i) => (
        <Text
          key={`stage-${a.id}`}
          ref={(el) => (stageRefs.current[i] = el)}
          visible={false}
          position={[a.x, a.y + BAR.HEIGHT / 2 + BAR.BORDER + STAGE_SIGN_GAP, a.z]}
          fontSize={2.2}
          color="#ffffff"
          outlineWidth={0.2}
          outlineColor="#0a2a12"
          anchorX="center"
          anchorY="bottom"
          textAlign="center"
          lineHeight={1.15}
          renderOrder={5}
          material-depthTest={false}
          material-toneMapped={false}
        >
          {`Stage ${WALL_STAGES[i].stage}\n${WALL_STAGES[i].name}`}
        </Text>
      ))}
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
