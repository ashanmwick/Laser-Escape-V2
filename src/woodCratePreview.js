// Dev harness for the code-generated `wood_crate` prop — served at
// /wood-crate.html by the normal `npm run dev`. Not part of the game: it
// mounts nothing from src/components, touches no store, and is the only
// place besides podiumStagePreview.js that imports three's example
// OrbitControls.
//
// What it is for: looking at the prop from any angle with the same lighting
// the hub uses (one hemisphere + one directional light, shadows off — Tech.md
// §7), and checking that the collider boxes data/woodCrate.js generates
// actually sit on the geometry (toggle "collider").
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildWoodCrateStack } from './systems/woodCrateModel.js'
import { getWoodCrateAtlas } from './systems/woodCrateAtlas.js'
import { WOOD_CRATE_AABBS, WOOD_CRATE_TRANSFORM, CRATE_SIZE } from './data/woodCrate.js'

const canvas = document.getElementById('view')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.setSize(window.innerWidth, window.innerHeight, false)

const scene = new THREE.Scene()
scene.background = new THREE.Color('#afd3ff')

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 100)
camera.position.set(2.4, 1.8, 3.2)

const controls = new OrbitControls(camera, canvas)
controls.target.set(0, CRATE_SIZE * 0.7, 0)
controls.enableDamping = true
controls.maxPolarAngle = Math.PI * 0.495

scene.add(new THREE.HemisphereLight('#eaf3ff', '#b7a98f', 2.2))
const sun = new THREE.DirectionalLight(0xffffff, 2.4)
sun.position.set(8, 14, 6)
scene.add(sun)

// ground + a 1 m grid, so the real-world scale is readable at a glance
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshLambertMaterial({ color: '#9fb87f' }),
)
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.001
scene.add(ground)
const grid = new THREE.GridHelper(20, 20, '#6f8a54', '#8aa76b')
scene.add(grid)

// the prop, mounted in local space (transform is a hub placement, not part
// of the model itself — same split as podiumStagePreview.js's own mount)
const built = buildWoodCrateStack()
scene.add(built.root)

// collider overlay: the AABB list data/woodCrate.js hands the kinematic
// collider, drawn in LOCAL space here (offset back by WOOD_CRATE_TRANSFORM)
// since this harness mounts the prop at the origin, not its hub position.
const colliders = new THREE.Group()
colliders.visible = false
for (const b of WOOD_CRATE_AABBS) {
  const box = new THREE.Box3(
    new THREE.Vector3(
      b.min.x - WOOD_CRATE_TRANSFORM.x,
      b.min.y - WOOD_CRATE_TRANSFORM.y,
      b.min.z - WOOD_CRATE_TRANSFORM.z,
    ),
    new THREE.Vector3(
      b.max.x - WOOD_CRATE_TRANSFORM.x,
      b.max.y - WOOD_CRATE_TRANSFORM.y,
      b.max.z - WOOD_CRATE_TRANSFORM.z,
    ),
  )
  colliders.add(new THREE.Box3Helper(box, new THREE.Color('#ff2f6d')))
}
scene.add(colliders)

// --- HUD --------------------------------------------------------------
const readout = document.getElementById('readout')

function refreshReadout() {
  let triangles = 0
  built.root.traverse((o) => {
    if (o.isMesh) triangles += o.geometry.index.count / 3
  })
  const info = renderer.info.render
  readout.textContent = [
    `triangles ${triangles}`,
    `draw calls ${info.calls} (scene: prop + ground + grid)`,
    `collider boxes ${WOOD_CRATE_AABBS.length}`,
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
    const image = getWoodCrateAtlas().image
    const shot = document.createElement('canvas')
    shot.width = shot.height = 256
    shot.getContext('2d').drawImage(image, 0, 0, 256, 256)
    panel.append(shot)
  }
  e.currentTarget.classList.toggle('on')
})

// --- loop ---------------------------------------------------------------
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

// Console / screenshot-script handle, same idea as podiumStagePreview.js's
// own window.__podiumPreview.
window.__woodCratePreview = {
  scene,
  camera,
  controls,
  renderer,
  built,
  colliders,
  look(position, target = [0, 0.7, 0]) {
    camera.position.set(position[0], position[1], position[2])
    controls.target.set(target[0], target[1], target[2])
    controls.update()
    renderer.render(scene, camera)
  },
}
