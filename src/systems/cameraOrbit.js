import { inputState } from './input.js'
import { player } from './playerState.js'

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

// Smoothed separately from target.x/z: playerMovement's stair step-up assist
// (systems/playerMovement.js STEP_HEIGHT) snaps player.position.y in discrete
// jumps as the player crosses each tread, and lookAt() has no lerp of its own
// the way camera.position does below — aiming it straight at the player's raw
// Y each frame made the camera visibly judder climbing stairs. Easing this
// with the same time constant as the position follow removes that without
// making the camera feel any less responsive.
let eyeY = 0
let eyeYReady = false

// Multiplier over the base sensitivities, driven by the portal's
// camera_sensitivity setting (0.1–5.0). 1 leaves the tuned feel untouched.
let sensitivity = 1

export function setSensitivity(mult) {
  sensitivity = Number.isFinite(mult) && mult > 0 ? mult : 1
}

export function getYaw() {
  return state.yaw
}

// Snaps the orbit to sit directly behind the player, e.g. right after a
// spawn/respawn — otherwise the camera keeps whatever angle it last had
// (default 0) while the player model faces player.facing, so the two visibly
// disagree the moment the player spawns in. Player forward is
// (sin(facing), cos(facing)) (see systems/laser.js's laser.start), and this
// camera sits opposite that, at +PI.
export function syncYawToPlayer() {
  state.yaw = player.facing + Math.PI
}

export function update(camera, dt) {
  // Consume drag + wheel accumulated by input.js.
  state.yaw -= inputState.look.dx * ORBIT_SENS * sensitivity
  state.pitch += inputState.look.dy * ORBIT_SENS * sensitivity
  inputState.look.dx = 0
  inputState.look.dy = 0
  if (state.pitch < MIN_PITCH) state.pitch = MIN_PITCH
  if (state.pitch > MAX_PITCH) state.pitch = MAX_PITCH

  state.distance += inputState.zoom * ZOOM_SENS * sensitivity
  inputState.zoom = 0
  if (state.distance < MIN_DIST) state.distance = MIN_DIST
  if (state.distance > MAX_DIST) state.distance = MAX_DIST

  // Aim at the player's upper body. Y is eased (see eyeY above) rather than
  // read straight off player.position.y, which now moves in discrete
  // per-step jumps on stairs.
  const t = dt > 0 ? 1 - Math.exp(-FOLLOW_LERP * dt) : 1
  const rawEyeY = player.position.y + player.dims.height * 0.6
  if (!eyeYReady) {
    eyeY = rawEyeY
    eyeYReady = true
  } else {
    eyeY += (rawEyeY - eyeY) * t
  }
  target.x = player.position.x
  target.y = eyeY
  target.z = player.position.z

  const cp = Math.cos(state.pitch)
  const desiredX = target.x + Math.sin(state.yaw) * cp * state.distance
  const desiredY = target.y + Math.sin(state.pitch) * state.distance
  const desiredZ = target.z + Math.cos(state.yaw) * cp * state.distance

  // Frame-rate independent smoothing; snap on the first frame / after a pause.
  camera.position.x += (desiredX - camera.position.x) * t
  camera.position.y += (desiredY - camera.position.y) * t
  camera.position.z += (desiredZ - camera.position.z) * t
  camera.lookAt(target.x, target.y, target.z)
}
