import { useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { loadPropParts } from '../systems/propModel.js'
import {
  GRASS_BLOCK_CUBE_MODEL_URL,
  GRASS_BLOCK_CUBE_INSTANCES,
} from '../data/grassBlockCubes.js'

// The 51 `grass_block_cube` objects (collection `grass_block`,
// data/grassBlockCubes.js) — a second lane border alongside GrassBlocks.jsx.
// Same pattern: mounting 51 scene-graph clones the way
// PodiumProp/WallProp/HexPowerPadProp do (2 materials each) would spend 102
// of Tech.md §7's 60 draw-call budget on its own, so this loads the shared
// glTF once (propModel.js's loadPropParts) and draws it as one InstancedMesh
// per material — 2 draw calls for all 51, matching BuildingBlocks.jsx and
// GrassBlocks.jsx.
const scratchMatrix = new THREE.Matrix4()
const scratchPosition = new THREE.Vector3()
const scratchQuaternion = new THREE.Quaternion()
const scratchScale = new THREE.Vector3()
const Y_AXIS = new THREE.Vector3(0, 1, 0)

export default function GrassBlockCubes() {
  const [parts, setParts] = useState(null)
  const meshRefs = useRef([])

  useLayoutEffect(() => {
    let disposed = false
    let loaded = null

    loadPropParts(GRASS_BLOCK_CUBE_MODEL_URL).then((next) => {
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
      for (let i = 0; i < GRASS_BLOCK_CUBE_INSTANCES.length; i++) {
        const b = GRASS_BLOCK_CUBE_INSTANCES[i]
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
          args={[p.geometry, p.material, GRASS_BLOCK_CUBE_INSTANCES.length]}
          matrixAutoUpdate={false}
        />
      ))}
    </>
  )
}
