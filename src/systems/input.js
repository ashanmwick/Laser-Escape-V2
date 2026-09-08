// inputState (Tech.md §5.1): camera-relative move vector, orbit look delta, wheel
// zoom, edge-triggered jump, and the firing flag.
//
// Left-click / tap is the action verb (hold to fire) — that is why the camera
// orbits on right-drag and there is no OrbitControls.
export const inputState = {
  move: { x: 0, z: 0 }, // x = strafe (+ right), z = forward (+ forward); pre-normalised
  look: { dx: 0, dy: 0 }, // pixels dragged this frame; consumed by cameraOrbit
  zoom: 0, // wheel delta this frame; consumed by cameraOrbit
  pointerNDC: { x: 0, y: 0 }, // mouse position in [-1, 1] clip space; consumed by systems/laser.js
  jump: false, // set on keydown, consumed by playerMovement
  firing: false, // held while left mouse / primary touch is down
  // A frame-loop poll of `firing` alone can miss a press that both starts and
  // ends between two frames (a fast click). These let a poller (see
  // systems/actionTracker.js) reconstruct exactly what happened from real
  // event timestamps instead of relying on catching the level mid-transition.
  firePressAt: 0, // performance.now() at the most recent pointerdown
  fireReleaseAt: 0, // performance.now() at the most recent pointerup/forced-release
  firePressSeq: 0, // increments once per pointerdown; never missed even if already resolved by the time it's polled
}

const held = new Set()
let orbiting = false
let installed = false

// Escape opens the portal's pause menu. Registered by the Bloxity facade so
// this module keeps knowing nothing about the SDK.
let escapeHandler = null

export function setEscapeHandler(fn) {
  escapeHandler = fn
}

// Reasons the game currently must not receive input: an SDK auth modal, the
// avatar customizer, the portal menu. Listeners are on window, so without this
// every keystroke typed into an SDK overlay would also drive WASD.
const suspensions = new Set()

export function suspend(reason) {
  suspensions.add(reason)
  if (installed) uninstall()
}

export function resume(reason) {
  suspensions.delete(reason)
  if (suspensions.size === 0 && !installed) install()
}

export function isSuspended() {
  return suspensions.size > 0
}

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
  if (e.code === 'Escape') {
    // Never treated as a held key — it leaves the game and opens the menu.
    if (escapeHandler) escapeHandler()
    return
  }
  held.add(e.code)
  if (e.code === 'Space') inputState.jump = true
  recomputeMove()
}

function onKeyUp(e) {
  held.delete(e.code)
  recomputeMove()
}

function onPointerDown(e) {
  // Scoped to the canvas so clicking a HUD element (the Rebirth button, auth
  // panel, chat box) never also fires the laser — those are separate DOM
  // elements the pointer lands on, never the canvas itself.
  if (e.button === 0 && e.target.tagName === 'CANVAS') {
    inputState.firing = true
    inputState.firePressAt = performance.now()
    inputState.firePressSeq++
  }
  // right or middle button starts a camera orbit drag
  if (e.button === 1 || e.button === 2) orbiting = true
}

function onPointerUp(e) {
  // Not target-scoped: this only closes a press that onPointerDown actually
  // opened (inputState.firing already true), so a drag that started on the
  // canvas and released over the HUD still ends correctly.
  if (e.button === 0 && inputState.firing) {
    inputState.firing = false
    inputState.fireReleaseAt = performance.now()
  }
  if (e.button === 1 || e.button === 2) orbiting = false
}

function onPointerMove(e) {
  // Tracked unconditionally (not just while orbiting) — this is what the
  // laser aims at, updated regardless of whether a button is held.
  inputState.pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1
  inputState.pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1

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
  if (inputState.firing) inputState.fireReleaseAt = performance.now()
  inputState.firing = false
  recomputeMove()
}

export function install() {
  if (installed || suspensions.size > 0) return
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
  // Drop anything held so a key down at suspend time is not stuck down on
  // resume — the same clearing onBlur already does.
  onBlur()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('wheel', onWheel)
  window.removeEventListener('contextmenu', onContextMenu)
  window.removeEventListener('blur', onBlur)
}
