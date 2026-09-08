import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { loadProp, disposeProp } from '../systems/propModel.js'
import { healthFraction } from '../systems/wallHealth.js'
import { WALL_DAMAGE } from '../data/wallHealth.js'

// Structural constant only — the feel (brightness floor, crack onset/opacity,
// tint) lives in data/wallHealth.js (Tech.md §4).
const CRACK_TEXTURE_SIZE = 256

// One procedural crack bitmap shared by all ten walls — generated detail costs
// nothing to download and stays one texture in GPU memory (Tech.md §7, same
// trick as Ground.jsx / BuildingBlocks.jsx). White jagged fractures on a
// transparent field; each wall tints and fades its own overlay material.
let crackTexture = null

function makeCrackTexture() {
  const size = CRACK_TEXTURE_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')
  g.strokeStyle = '#ffffff'
  g.lineCap = 'round'

  // Deterministic PRNG (mulberry32) so the fracture pattern is identical across
  // reloads rather than flickering to a new shape each session.
  let seed = 0x9e3779b9
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const branch = (x, y, angle, length, width) => {
    if (length < 6 || width < 0.4) return
    const steps = 4 + ((rand() * 4) | 0)
    const segLen = length / steps
    let px = x
    let py = y
    let a = angle
    g.lineWidth = width
    g.beginPath()
    g.moveTo(px, py)
    for (let i = 0; i < steps; i++) {
      a += (rand() - 0.5) * 0.9
      px += Math.cos(a) * segLen
      py += Math.sin(a) * segLen
      g.lineTo(px, py)
      if (rand() < 0.35) branch(px, py, a + (rand() - 0.5) * 2, length * 0.5, width * 0.6)
    }
    g.stroke()
  }

  for (const [ox, oy] of [
    [size * 0.5, size * 0.5],
    [size * 0.3, size * 0.4],
    [size * 0.7, size * 0.62],
  ]) {
    const spokes = 3 + ((rand() * 3) | 0)
    for (let i = 0; i < spokes; i++) {
      branch(ox, oy, rand() * Math.PI * 2, size * (0.28 + rand() * 0.22), 3.2)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function getCrackTexture() {
  if (!crackTexture) crackTexture = makeCrackTexture()
  return crackTexture
}

function makeCrackMaterial() {
  return new THREE.MeshBasicMaterial({
    map: getCrackTexture(),
    color: WALL_DAMAGE.CRACK_TINT,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    // Pull the overlay a hair toward the camera in the depth buffer so it wins
    // against the wall surface it sits exactly on, without writing depth itself.
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })
}

// Mounts one Blender-authored wall prop (Tech.md §6, collection `wall`) at
// `position`, turned `rotationY` radians around the up axis. Like
// TargetProp.jsx, `url` is a prop rather than a hardcoded import — the ten
// wall objects are each their own mesh/material (data/wallProps.js) — and
// like PodiumProp.jsx, rotation is applied to the mount group because
// propModel.js's loader strips the glTF's baked position/rotation on load
// (every one of these ten shares the same authored yaw).
//
// The wall also degrades visually as it takes damage: each frame its material
// is multiplied darker and a procedural crack overlay fades in, both driven by
// healthFraction(id) from systems/wallHealth.js (see the useFrame below).
export default function WallProp({ id, url, position, rotationY = 0 }) {
  const groupRef = useRef(null)
  // Populated once the prop loads, read every frame: the per-wall material
  // clones darkened in place, and the crack-overlay materials faded in.
  const cloneEntriesRef = useRef(null)
  const crackMatsRef = useRef(null)
  const lastFractionRef = useRef(-1)

  useEffect(() => {
    let built = null
    let overlays = []
    let cloneEntries = []
    let disposed = false

    loadProp(url).then((next) => {
      if (disposed || !groupRef.current) {
        disposeProp(next)
        return
      }
      built = next

      // Collect meshes first — adding overlay children mid-traverse would make
      // traverse recurse into the overlays we just added.
      const meshes = []
      built.root.traverse((o) => {
        if (o.isMesh) meshes.push(o)
      })

      // Clone each wall material so this wall darkens independently (the user
      // asked for it; also guards propModel.js's clone path, which shares
      // material refs between instances of one url). A crack quad rides on each
      // mesh's own geometry so the fractures follow the wall's shape.
      const cloneByOrig = new Map()
      for (const mesh of meshes) {
        const orig = mesh.material
        let entry = cloneByOrig.get(orig)
        if (!entry) {
          entry = { mat: orig.clone(), baseColor: orig.color.clone() }
          cloneByOrig.set(orig, entry)
        }
        mesh.material = entry.mat

        const overlay = new THREE.Mesh(mesh.geometry, makeCrackMaterial())
        overlay.renderOrder = 1
        mesh.add(overlay)
        overlays.push(overlay)
      }
      cloneEntries = [...cloneByOrig.values()]
      cloneEntriesRef.current = cloneEntries
      crackMatsRef.current = overlays.map((o) => o.material)
      lastFractionRef.current = -1

      groupRef.current.add(built.root)
      // Static once placed (Tech.md §7) — this traverse now covers the overlay
      // children too (their local transform is identity, sitting on the wall).
      built.root.traverse((o) => {
        o.matrixAutoUpdate = false
        o.updateMatrix()
      })
      // matrixAutoUpdate is off, so the mount group's own position/rotation
      // need one explicit compose too, or it would render at the origin.
      groupRef.current.updateMatrix()
      groupRef.current.updateMatrixWorld(true)
    })

    return () => {
      disposed = true
      for (const o of overlays) {
        if (o.parent) o.parent.remove(o)
        // The crack map is the shared module singleton — leave it; only the
        // per-wall material is ours to free here.
        o.material.dispose()
      }
      // The clone's .map is the wall's shared albedo — disposeProp frees it via
      // built.materials (the originals). Only dispose the clone itself.
      for (const entry of cloneEntries) entry.mat.dispose()
      cloneEntriesRef.current = null
      crackMatsRef.current = null
      if (built) disposeProp(built)
    }
  }, [url])

  // Drive the damage look off this frame's health. GameLoop's stepWallHealth
  // has already run (it subscribes first), so healthFraction(id) is current:
  // 1 = pristine, 0 = destroyed (the wall unmounts on the 0-crossing). A future
  // level reset that re-seeds wallHealth.js's health snaps this back on its own,
  // and a wall that respawns remounts fresh with a new clone/overlay.
  useFrame(() => {
    const entries = cloneEntriesRef.current
    if (!entries) return
    const f = healthFraction(id)
    if (f === lastFractionRef.current) return
    lastFractionRef.current = f

    // Multiply the base colour toward MIN_BRIGHTNESS as health drops (linear).
    const b = WALL_DAMAGE.MIN_BRIGHTNESS + (1 - WALL_DAMAGE.MIN_BRIGHTNESS) * f
    for (const entry of entries) {
      entry.mat.color.setRGB(
        entry.baseColor.r * b,
        entry.baseColor.g * b,
        entry.baseColor.b * b,
      )
    }

    // Cracks: nothing until health falls below CRACK_ONSET, then ramp opacity
    // to CRACK_MAX_OPACITY as it reaches 0.
    const onset = WALL_DAMAGE.CRACK_ONSET
    const crackO = f >= onset ? 0 : WALL_DAMAGE.CRACK_MAX_OPACITY * ((onset - f) / onset)
    for (const m of crackMatsRef.current) m.opacity = crackO
  })

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      matrixAutoUpdate={false}
      userData={{ wallId: id }}
    />
  )
}
