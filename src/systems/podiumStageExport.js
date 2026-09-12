// glTF/GLB export for the code-generated `podium_stage` prop. Framework-free
// (Tech.md rule 2), and dev-tooling only — nothing in the game imports it, so
// GLTFExporter never reaches a production bundle.
//
// The runtime prop is deliberately Lambert + Basic (Tech.md §7: no PBR, no
// postprocessing). glTF has neither material, so this module rebuilds the two
// materials at the export boundary — the mirror image of what
// systems/propModel.js does on the way IN — and exports:
//
//   podium_stage_wood  -> MeshStandardMaterial, the atlas as baseColorTexture,
//                         roughness 0.85 / metalness 0. The wood's shading
//                         detail is already baked into the albedo, so no
//                         normal / roughness / AO maps are written.
//   podium_stage_sign  -> MeshStandardMaterial with the atlas as BOTH
//                         baseColorTexture and emissiveTexture (emissive
//                         white). That is what the brief asks for: the neon
//                         frame, the word and the bursts arrive as an
//                         emissive map for the receiving engine to bloom,
//                         with no alpha and no glow geometry.
//
// Everything else the brief asks of the file the model already satisfies by
// construction: Y-up, 1 unit = 1 m, origin at the base centre, one 1024^2
// texture (embedded in the .glb), two sub-meshes, ~1.2k triangles.
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { buildPodiumStage, getPodiumStageStats } from './podiumStageModel.js'

const EXPORT_NAME = 'podium_stage'

function toGltfMaterials(root) {
  const swapped = []
  root.traverse((o) => {
    if (!o.isMesh) return
    const source = o.material
    const isNeon = source.isMeshBasicMaterial === true
    o.material = new THREE.MeshStandardMaterial({
      map: source.map,
      color: 0xffffff,
      roughness: isNeon ? 1 : 0.85,
      metalness: 0,
      ...(isNeon
        ? { emissive: new THREE.Color(0xffffff), emissiveMap: source.map, emissiveIntensity: 1 }
        : {}),
    })
    o.material.name = isNeon ? 'podium_stage_neon_mat' : 'podium_stage_wood_mat'
    swapped.push({ mesh: o, original: source, exportMaterial: o.material })
  })
  return {
    restore() {
      for (const s of swapped) {
        s.mesh.material = s.original
        s.exportMaterial.dispose()
      }
    },
  }
}

// Builds the prop, exports it as a binary glTF and returns
// { blob, filename, stats }. Browser-only: GLTFExporter serialises the canvas
// atlas through the DOM.
export async function exportPodiumStageGlb({ built = null } = {}) {
  const prop = built ?? buildPodiumStage()
  const owned = built === null
  const stats = getPodiumStageStats(prop)
  const swap = toGltfMaterials(prop.root)

  try {
    const exporter = new GLTFExporter()
    const buffer = await exporter.parseAsync(prop.root, {
      binary: true,
      onlyVisible: true,
      // The atlas is a lossless procedural bitmap with hard neon edges; PNG
      // keeps them crisp, and at 1024^2 the file is still small.
      maxTextureSize: 1024,
    })
    return {
      blob: new Blob([buffer], { type: 'model/gltf-binary' }),
      filename: `${EXPORT_NAME}.glb`,
      stats,
    }
  } finally {
    swap.restore()
    if (owned) prop.dispose()
  }
}

// Runs the export and hands the file to the browser's downloader.
export async function downloadPodiumStageGlb() {
  const { blob, filename, stats } = await exportPodiumStageGlb()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Revoke on the next macrotask: revoking synchronously can cancel the
  // download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0)
  return { filename, bytes: blob.size, stats }
}
