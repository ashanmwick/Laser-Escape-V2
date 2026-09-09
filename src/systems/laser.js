// Eye-laser aim (Tech.md §5.1 style: framework-free, mutable singleton,
// stepped once per frame from GameLoop). Fires from the player's head toward
// wherever the mouse points on screen: a real raycast against the drawn
// scene, so the beam lands exactly on whatever's under the cursor.
import * as THREE from 'three'
import { inputState } from './input.js'
import { player } from './playerState.js'
import { afkState } from './afk.js'
import { LASER_EYE_HEIGHT_RATIO, LASER_FORWARD_RATIO, LASER_MAX_RANGE } from '../data/laser.js'
import { TARGET_AIM_POINT } from '../data/targets.js'

export const laser = {
  active: false, // true while the beam should be drawn (mouse held)
  hit: false, // true when the aim ray struck real geometry, not the range fallback
  start: { x: 0, y: 0, z: 0 }, // world-space beam origin, at the player's eyes
  end: { x: 0, y: 0, z: 0 }, // world-space beam tip
  normal: { x: 0, y: 1, z: 0 }, // world-space surface normal at end, valid only when hit
  hitObject: null, // THREE.Object3D struck this frame, valid only when hit
  hitInstanceId: -1, // instance index when hitObject is an InstancedMesh, else -1
}

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()
const farPoint = new THREE.Vector3()
const worldNormal = new THREE.Vector3()
const normalMatrix = new THREE.Matrix3()
const aimOrigin = new THREE.Vector3()
const aimDir = new THREE.Vector3()

// Player.jsx and Laser.jsx both tag their root group userData.laserIgnore so
// the aim ray never terminates on the shooter's own body or the beam mesh
// left over from the previous frame. WallHealthBars.jsx does the same: its
// bars and Stage signs float in front of the walls and must be shot through,
// not stopped on.
function isIgnored(object) {
  let o = object
  while (o) {
    if (o.userData.laserIgnore) return true
    o = o.parent
  }
  return false
}

export function step(camera, scene) {
  // AFK lock (systems/afk.js) fires the beam exactly like a held mouse
  // button, just aimed at the locked target's top area instead of the
  // cursor — so it reads as "firing" too, not only a real mouse hold.
  const aimPoint = afkState.active ? TARGET_AIM_POINT[afkState.targetId] : null
  if (!inputState.firing && !aimPoint) {
    laser.active = false
    laser.hit = false
    laser.hitObject = null
    laser.hitInstanceId = -1
    return
  }

  const p = player.position
  const facing = player.facing
  const forward = player.dims.radius * LASER_FORWARD_RATIO
  laser.start.x = p.x + Math.sin(facing) * forward
  laser.start.y = p.y + player.dims.height * LASER_EYE_HEIGHT_RATIO
  laser.start.z = p.z + Math.cos(facing) * forward

  if (aimPoint) {
    aimOrigin.set(laser.start.x, laser.start.y, laser.start.z)
    aimDir
      .set(aimPoint[0] - laser.start.x, aimPoint[1] - laser.start.y, aimPoint[2] - laser.start.z)
      .normalize()
    raycaster.set(aimOrigin, aimDir)
  } else {
    ndc.set(inputState.pointerNDC.x, inputState.pointerNDC.y)
    raycaster.setFromCamera(ndc, camera)
  }

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
    laser.hitObject = target.object
    laser.hitInstanceId = target.instanceId ?? -1

    if (target.face) {
      normalMatrix.getNormalMatrix(target.object.matrixWorld)
      worldNormal.copy(target.face.normal).applyMatrix3(normalMatrix).normalize()
      laser.normal.x = worldNormal.x
      laser.normal.y = worldNormal.y
      laser.normal.z = worldNormal.z
    }
  } else {
    raycaster.ray.at(LASER_MAX_RANGE, farPoint)
    laser.end.x = farPoint.x
    laser.end.y = farPoint.y
    laser.end.z = farPoint.z
    laser.hit = false
    laser.hitObject = null
    laser.hitInstanceId = -1
  }

  laser.active = true
}
