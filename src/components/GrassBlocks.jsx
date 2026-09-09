import { useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { loadPropParts } from '../systems/propModel.js'
import { GRASS_BLOCK_MODEL_URL, GRASS_BLOCK_INSTANCES } from '../data/grassBlocks.js'

// The 160 `grass_block_dirt.NNN` objects (collection `grass_block_new`,
// data/grassBlocks.js) — a lane border, so this is the largest repeat count
// of any prop in the game. Tech.md §7 caps busiest-view draw calls at 60;
// mounting 160 scene-graph clones the way PodiumProp/WallProp/HexPowerPadProp
// do (2 materials each) would spend 320 of that budget alone. Instead this
// loads the shared glTF once (propModel.js's loadPropParts, not loadProp —
// there is no per-instance scene node here to clone) and draws it as one
// InstancedMesh per material — 2 draw calls for all 160, matching
// BuildingBlocks.jsx's InstancedMesh pattern for the same "everything
// repeated" rule.
const scratchMatrix = new THREE.Matrix4()
const scratchPosition = new THREE.Vector3()
const scratchQuaternion = new THREE.Quaternion()
const scratchScale = new THREE.Vector3()
const Y_AXIS = new THREE.Vector3(0, 1, 0)

export default function GrassBlocks() {
  const [parts, setParts] = useState(null)
  const meshRefs = useRef([])

  useLayoutEffect(() => {
    let disposed = false
    let loaded = null

    loadPropParts(GRASS_BLOCK_MODEL_URL).then((next) => {
      if (disposed) {
        for (const p of next.parts) p.geometry.dispose()
        for (const m of next.materials) {
          if (m.map) m.map.dispose()
          m.dispose()
        }
        return
      }
      loaded = next
      setParts(next.parts)
    })

    return () => {
      disposed = true
      if (loaded) {
        for (const p of loaded.parts) p.geometry.dispose()
        for (const m of loaded.materials) {
          if (m.map) m.map.dispose()
          m.dispose()
        }
      }
    }
  }, [])

  // Instances are static: written once, never touched by the frame loop
  // (Tech.md §7).
  useLayoutEffect(() => {
    if (!parts) return
    for (const mesh of meshRefs.current) {
      if (!mesh) continue
      for (let i = 0; i < GRASS_BLOCK_INSTANCES.length; i++) {
        const b = GRASS_BLOCK_INSTANCES[i]
        scratchPosition.set(b.position[0], b.position[1], b.position[2])
        scratchQuaternion.setFromAxisAngle(Y_AXIS, b.rotationY)
        scratchScale.set(b.scale[0], b.scale[1], b.scale[2])
        scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale)
        mesh.setMatrixAt(i, scratchMatrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }, [parts])

  if (!parts) return null

  return (
    <>
      {parts.map((p, i) => (
        <instancedMesh
          key={i}
          ref={(el) => (meshRefs.current[i] = el)}
          args={[p.geometry, p.material, GRASS_BLOCK_INSTANCES.length]}
          matrixAutoUpdate={false}
        />
      ))}
    </>
  )
}
