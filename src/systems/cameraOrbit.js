import { inputState } from './input.js'
import { player, PLAYER_HEIGHT } from './playerState.js'

// Third-person follow with right-drag orbit + wheel zoom (Tech.md §5.2).
// No OrbitControls — left-click is the game's action verb.
const state = {
  yaw: 0, // radians; 0 puts the camera on +Z looking toward -Z
  pitch: 0.35, // radians above the horizon
  distance: 7,
}

const MIN_PITCH = -0.15
const MAX_PITCH = 1.3
const MIN_DIST = 3
const MAX_DIST = 14
const ORBIT_SENS = 0.005
const ZOOM_SENS = 0.01
const FOLLOW_LERP = 12 // higher = snappier follow

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const target = { x: 0, y: 0, z: 0 }

export function getYaw() {
  return state.yaw
}

export function update(camera, dt) {
  // Consume drag + wheel accumulated by input.js.
  state.yaw -= inputState.look.dx * ORBIT_SENS
  state.pitch += inputState.look.dy * ORBIT_SENS
  inputState.look.dx = 0
  inputState.look.dy = 0
  if (state.pitch < MIN_PITCH) state.pitch = MIN_PITCH
  if (state.pitch > MAX_PITCH) state.pitch = MAX_PITCH

  state.distance += inputState.zoom * ZOOM_SENS
  inputState.zoom = 0
  if (state.distance < MIN_DIST) state.distance = MIN_DIST
  if (state.distance > MAX_DIST) state.distance = MAX_DIST

  // Aim at the player's upper body.
  target.x = player.position.x
  target.y = player.position.y + PLAYER_HEIGHT * 0.6
  target.z = player.position.z

  const cp = Math.cos(state.pitch)
  const desiredX = target.x + Math.sin(state.yaw) * cp * state.distance
  const desiredY = target.y + Math.sin(state.pitch) * state.distance
  const desiredZ = target.z + Math.cos(state.yaw) * cp * state.distance

  // Frame-rate independent smoothing; snap on the first frame / after a pause.
  const t = dt > 0 ? 1 - Math.exp(-FOLLOW_LERP * dt) : 1
  camera.position.x += (desiredX - camera.position.x) * t
  camera.position.y += (desiredY - camera.position.y) * t
  camera.position.z += (desiredZ - camera.position.z) * t
  camera.lookAt(target.x, target.y, target.z)
}
