// Dev harness for the code-generated `podium_stage` prop — served at
// /podium-stage.html by the normal `npm run dev`. Not part of the game: it
// mounts nothing from src/components, touches no store, and is the only place
// in the repo that imports GLTFExporter (through systems/podiumStageExport.js)
// or three's example OrbitControls.
//
// Tech.md §1 rejects drei's <OrbitControls> for the *game* because the game
// needs left-click for its action verb; a turntable inspector has no action
// verb, so orbiting here costs the game nothing.
//
// What it is for:
//  - looking at the prop from any angle with the same lighting the hub uses
//    (one hemisphere + one directional light, shadows off — Tech.md §7),
//  - reading its real triangle / draw-call cost against the 5k budget,
//  - checking that the collider boxes data/podiumStage.js generates actually
//    sit on the geometry (toggle "collider"), and
//  - exporting the baked .glb.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildPodiumStage, getPodiumStageStats } from './systems/podiumStageModel.js'
import { downloadPodiumStageGlb } from './systems/podiumStageExport.js'
import {
  PODIUM_STAGE_AABBS,
  PODIUM_STAGE_TRANSFORM,
  TOP_Y,
  TOTAL_DEPTH,
  TOTAL_WIDTH,
} from './data/podiumStage.js'

const canvas = document.getElementById('view')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.setSize(window.innerWidth, window.innerHeight, false)

const scene = new THREE.Scene()
scene.background = new THREE.Color('#afd3ff')

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 100)
camera.position.set(3.4, 2.5, 4.6)

const controls = new OrbitControls(camera, canvas)
controls.target.set(0, TOP_Y * 0.7, 0)
controls.enableDamping = true
controls.maxPolarAngle = Math.PI * 0.495

scene.add(new THREE.HemisphereLight('#eaf3ff', '#b7a98f', 2.2))
const sun = new THREE.DirectionalLight(0xffffff, 2.4)
sun.position.set(8, 14, 6)
scene.add(sun)

// ground + a 1 m grid, so the real-world scale is readable at a glance
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshLambertMaterial({ color: '#9fb87f' }),
)
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.001
scene.add(ground)
const grid = new THREE.GridHelper(20, 20, '#6f8a54', '#8aa76b')
scene.add(grid)

// the prop
const built = buildPodiumStage()
const mount = new THREE.Group()
mount.position.set(PODIUM_STAGE_TRANSFORM.x, PODIUM_STAGE_TRANSFORM.y, PODIUM_STAGE_TRANSFORM.z)
mount.rotation.y = PODIUM_STAGE_TRANSFORM.yaw
mount.scale.setScalar(PODIUM_STAGE_TRANSFORM.scale)
mount.add(built.root)
scene.add(mount)

// a 1.7 m figure for scale — the point of the 20 cm rise / 30 cm tread limit
// is that a player can walk up, and that only reads next to a body
const human = new THREE.Mesh(
  new THREE.BoxGeometry(0.42, 1.7, 0.28),
  new THREE.MeshLambertMaterial({ color: '#3f6fbf' }),
)
human.position.set(TOTAL_WIDTH / 2 + 0.95, 0.85, TOTAL_DEPTH / 2 + 0.45)
scene.add(human)

// collider overlay: the AABB list data/podiumStage.js hands the kinematic
// collider, drawn as wireframe boxes in world space
const colliders = new THREE.Group()
colliders.visible = false
for (const b of PODIUM_STAGE_AABBS) {
  const box = new THREE.Box3(
    new THREE.Vector3(b.min.x, b.min.y, b.min.z),
    new THREE.Vector3(b.max.x, b.max.y, b.max.z),
  )
  colliders.add(new THREE.Box3Helper(box, new THREE.Color('#ff2f6d')))
}
scene.add(colliders)

// --- HUD ------------------------------------------------------------------
const stats = getPodiumStageStats(built)
const readout = document.getElementById('readout')
const status = document.getElementById('status')

function refreshReadout() {
  const info = renderer.info.render
  readout.textContent = [
    `triangles ${stats.triangles} / 5000 budget`,
    `sub-meshes ${stats.meshes}  materials ${stats.materials}  textures ${stats.textures}`,
    `draw calls ${info.calls} (scene: prop + ground + grid + scale figure)`,
    `footprint ${TOTAL_WIDTH.toFixed(2)} x ${TOTAL_DEPTH.toFixed(2)} m, platform ${TOP_Y.toFixed(2)} m`,
    `collider boxes ${PODIUM_STAGE_AABBS.length}`,
  ].join('\n')
}

document.getElementById('wireframe').addEventListener('click', (e) => {
  built.root.traverse((o) => {
    if (o.isMesh) o.material.wireframe = !o.material.wireframe
  })
  e.currentTarget.classList.toggle('on')
})

document.getElementById('collider').addEventListener('click', (e) => {
  colliders.visible = !colliders.visible
  e.currentTarget.classList.toggle('on')
})

document.getElementById('atlas').addEventListener('click', (e) => {
  const panel = document.getElementById('atlas-panel')
  const shown = panel.childElementCount > 0
  panel.replaceChildren()
  if (!shown) {
    // the atlas canvas itself, scaled down — one image for the whole prop
    const image = built.root.children[0].material.map.image
    const shot = document.createElement('canvas')
    shot.width = shot.height = 256
    shot.getContext('2d').drawImage(image, 0, 0, 256, 256)
    panel.append(shot)
  }
  e.currentTarget.classList.toggle('on')
})

document.getElementById('export').addEventListener('click', async (e) => {
  const button = e.currentTarget
  button.disabled = true
  status.textContent = 'exporting…'
  try {
    const out = await downloadPodiumStageGlb()
    status.textContent = `${out.filename} — ${(out.bytes / 1024).toFixed(0)} KB, ${out.stats.triangles} tris`
  } catch (err) {
    status.textContent = `export failed: ${err.message}`
    console.error(err)
  } finally {
    button.disabled = false
  }
})

// --- loop -----------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight, false)
})

renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
  refreshReadout()
})

// Console / screenshot-script handle: set a camera pose and render one frame,
// e.g. window.__podiumPreview.look([0, 1.2, 5], [0, 0.9, 0]) for the
// reference's head-on view. Dev harness only — this whole entry is.
window.__podiumPreview = {
  scene,
  camera,
  controls,
  renderer,
  built,
  stats,
  colliders,
  look(position, target = [0, 0.9, 0]) {
    camera.position.set(position[0], position[1], position[2])
    controls.target.set(target[0], target[1], target[2])
    controls.update()
    renderer.render(scene, camera)
  },
}
