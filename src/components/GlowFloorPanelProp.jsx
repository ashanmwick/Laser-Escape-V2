import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { loadProp, disposeProp } from '../systems/propModel.js'
import { GLOW_FLOOR_PANEL_MODEL_URL, GLOW_FLOOR_PANEL_TOP_Y } from '../data/glowFloorPanel.js'

// Fade midpoint: the material is fully transparent at the mesh's top face
// (y = GLOW_FLOOR_PANEL_TOP_Y) and fully opaque from the mesh's vertical
// midpoint down to its base (y = 0) — so the panel reads as a glow that
// dissolves away toward its top edge.
const FADE_MID_Y = GLOW_FLOOR_PANEL_TOP_Y / 2
const FADE_RANGE = GLOW_FLOOR_PANEL_TOP_Y - FADE_MID_Y // == FADE_MID_Y

const GLOW_COLOR = new THREE.Color('#ffc400') // saturated gold-yellow — kept off pure
// white-yellow ('#ffe21a' clipped to near-white once lit + emissive stacked)

// Turns the converted Lambert material into a flat, saturated glow — the
// source's map/emissiveMap (data/glowFloorPanel.js's yellow/black/navy
// texture bands) are dropped in favor of a solid emissive yellow so every
// visible fragment reads as glowing yellow, regardless of which band its UV
// happened to land in — then injects a vertical (local-space y) alpha
// gradient into the shader: transparent at the top face, ramping to opaque
// by FADE_MID_Y and staying opaque down to the base. `position` in the
// vertex shader is the raw object-space attribute (pre node-scale, same
// 0..GLOW_FLOOR_PANEL_TOP_Y range for every one of the 25 placed instances,
// since they all share this one geometry). Applied once to the shared
// material (all 25 GlowFloorPanelProp instances reuse the same converted
// material — see propModel.js's cache/refCount note), guarded so a later
// instance's mount doesn't redo it.
function applyGlowGradient(material) {
  if (material.userData.glowGradientApplied) return
  material.userData.glowGradientApplied = true

  // Dropped, not just unlinked — nothing else references this glTF's single
  // material, so these are the only holders of its GPU textures; propModel's
  // disposeProp() only disposes what's still on material.map/.emissiveMap at
  // teardown time, so freeing them here (not there) is what avoids orphaning
  // the GPU memory Tech.md §7 says three.js won't reclaim on its own.
  if (material.map) material.map.dispose()
  if (material.emissiveMap) material.emissiveMap.dispose()
  material.map = null
  material.emissiveMap = null
  material.color.copy(GLOW_COLOR)
  if (material.emissive) material.emissive.copy(GLOW_COLOR)
  material.emissiveIntensity = 1.4
  material.transparent = true
  material.depthWrite = false
  material.needsUpdate = true

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vGlowFade;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\n\tvGlowFade = clamp((${GLOW_FLOOR_PANEL_TOP_Y.toFixed(6)} - position.y) / ${FADE_RANGE.toFixed(6)}, 0.0, 1.0);`
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlowFade;')
      .replace(
        '#include <opaque_fragment>',
        'diffuseColor.a *= vGlowFade;\n#include <opaque_fragment>'
      )
  }
}

// Mounts one instance of the Blender-authored `glow_floor_panel` prop
// (Tech.md §6, collection `WinPanel`) at `position`. None of the 8 placed
// objects carry rotation (data/glowFloorPanel.js), so there's no rotationY
// prop here — same shape as HexPowerPadProp.jsx.
export default function GlowFloorPanelProp({ position }) {
  const groupRef = useRef(null)

  useEffect(() => {
    let built = null
    let disposed = false

    loadProp(GLOW_FLOOR_PANEL_MODEL_URL).then((next) => {
      if (disposed || !groupRef.current) {
        disposeProp(next)
        return
      }
      built = next
      for (const material of built.materials) applyGlowGradient(material)
      groupRef.current.add(built.root)
      // Static once placed (Tech.md §7).
      built.root.traverse((o) => {
        o.matrixAutoUpdate = false
        o.updateMatrix()
      })
      // matrixAutoUpdate is off, so the mount group's own position needs one
      // explicit compose too, or it would render at the origin.
      groupRef.current.updateMatrix()
      groupRef.current.updateMatrixWorld(true)
    })

    return () => {
      disposed = true
      if (built) disposeProp(built)
    }
  }, [])

  return <group ref={groupRef} position={position} matrixAutoUpdate={false} />
}
