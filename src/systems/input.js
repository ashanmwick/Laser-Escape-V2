// inputState (Tech.md §5.1): camera-relative move vector, orbit look delta, wheel
// zoom, edge-triggered jump, and the firing flag.
//
// Left-click / tap is the action verb (hold to fire) — that is why the camera
// orbits on right-drag and there is no OrbitControls.
export const inputState = {
  move: { x: 0, z: 0 }, // x = strafe (+ right), z = forward (+ forward); pre-normalised
  look: { dx: 0, dy: 0 }, // pixels dragged this frame; consumed by cameraOrbit
  zoom: 0, // wheel delta this frame; consumed by cameraOrbit
  jump: false, // set on keydown, consumed by playerMovement
  firing: false, // held while left mouse / primary touch is down
}

const held = new Set()
let orbiting = false
let installed = false

function recomputeMove() {
  let x = 0
  let z = 0
  if (held.has('KeyW') || held.has('ArrowUp')) z += 1
  if (held.has('KeyS') || held.has('ArrowDown')) z -= 1
  if (held.has('KeyA') || held.has('ArrowLeft')) x -= 1
  if (held.has('KeyD') || held.has('ArrowRight')) x += 1
  const len = Math.hypot(x, z)
  if (len > 0) {
    x /= len
    z /= len
  }
  inputState.move.x = x
  inputState.move.z = z
}

function onKeyDown(e) {
  if (e.repeat) return
  held.add(e.code)
  if (e.code === 'Space') inputState.jump = true
  recomputeMove()
}

function onKeyUp(e) {
  held.delete(e.code)
  recomputeMove()
}

function onPointerDown(e) {
  if (e.button === 0) inputState.firing = true
  // right or middle button starts a camera orbit drag
  if (e.button === 1 || e.button === 2) orbiting = true
}

function onPointerUp(e) {
  if (e.button === 0) inputState.firing = false
  if (e.button === 1 || e.button === 2) orbiting = false
}

function onPointerMove(e) {
  if (!orbiting) return
  inputState.look.dx += e.movementX || 0
  inputState.look.dy += e.movementY || 0
}

function onWheel(e) {
  inputState.zoom += e.deltaY
}

function onContextMenu(e) {
  e.preventDefault() // right-drag is the orbit gesture
}

function onBlur() {
  held.clear()
  orbiting = false
  inputState.firing = false
  recomputeMove()
}

export function install() {
  if (installed) return
  installed = true
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('contextmenu', onContextMenu)
  window.addEventListener('blur', onBlur)
}

export function uninstall() {
  if (!installed) return
  installed = false
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('wheel', onWheel)
  window.removeEventListener('contextmenu', onContextMenu)
  window.removeEventListener('blur', onBlur)
}
