// Eye-laser aim (Tech.md §5.1 style: framework-free, mutable singleton,
// stepped once per frame from GameLoop). Fires from the player's head toward
// wherever the mouse points on screen: a real raycast against the drawn
// scene, so the beam lands exactly on whatever's under the cursor.
import * as THREE from 'three'
import { inputState } from './input.js'
import { player } from './playerState.js'
import { LASER_EYE_HEIGHT_RATIO, LASER_FORWARD_RATIO, LASER_MAX_RANGE } from '../data/laser.js'

export const laser = {
  active: false, // true while the beam should be drawn (mouse held)
  hit: false, // true when the aim ray struck real geometry, not the range fallback
  start: { x: 0, y: 0, z: 0 }, // world-space beam origin, at the player's eyes
  end: { x: 0, y: 0, z: 0 }, // world-space beam tip
}

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()
const farPoint = new THREE.Vector3()

// Player.jsx and Laser.jsx both tag their root group userData.laserIgnore so
// the aim ray never terminates on the shooter's own body or the beam mesh
// left over from the previous frame.
function isIgnored(object) {
  let o = object
  while (o) {
    if (o.userData.laserIgnore) return true
    o = o.parent
  }
  return false
}

export function step(camera, scene) {
  if (!inputState.firing) {
    laser.active = false
    return
  }

  const p = player.position
  const facing = player.facing
  const forward = player.dims.radius * LASER_FORWARD_RATIO
  laser.start.x = p.x + Math.sin(facing) * forward
  laser.start.y = p.y + player.dims.height * LASER_EYE_HEIGHT_RATIO
  laser.start.z = p.z + Math.cos(facing) * forward

  ndc.set(inputState.pointerNDC.x, inputState.pointerNDC.y)
  raycaster.setFromCamera(ndc, camera)

  const hits = raycaster.intersectObjects(scene.children, true)
  let target = null
  for (let i = 0; i < hits.length; i++) {
    if (!isIgnored(hits[i].object)) {
      target = hits[i]
      break
    }
  }

  if (target) {
    laser.end.x = target.point.x
    laser.end.y = target.point.y
    laser.end.z = target.point.z
    laser.hit = true
  } else {
    raycaster.ray.at(LASER_MAX_RANGE, farPoint)
    laser.end.x = farPoint.x
    laser.end.y = farPoint.y
    laser.end.z = farPoint.z
    laser.hit = false
  }

  laser.active = true
}
