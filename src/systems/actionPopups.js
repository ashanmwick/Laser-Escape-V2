// Power-gain popups (Tech.md §5.1 style: framework-free, mutable singleton
// pool, stepped once per frame from GameLoop). systems/actionTracker.js calls
// spawnActionPopup(amount) with each Action's Power gain; step() projects the
// player's anchor point to the screen and ages the live popups.
// components/hud/ActionPopups.jsx reads the pool each frame and draws it.
import * as THREE from 'three'
import { player } from './playerState.js'
import {
  ACTION_POPUP_POOL_SIZE,
  ACTION_POPUP_LIFETIME,
  ACTION_POPUP_ANCHOR_HEIGHT,
  ACTION_POPUP_SPREAD_X,
  ACTION_POPUP_SPREAD_Y,
} from '../data/actionPopups.js'

function makeSlot() {
  return {
    alive: false,
    age: 0,
    amount: 0,
    // Viewport position frozen at spawn: normalized device coords, -1..1, x
    // right / y up. The popup drifts from here on its own (see the view).
    ndcX: 0,
    ndcY: 0,
    // Bumped on every (re)spawn so the view can tell a recycled slot from one
    // it is already animating, and refresh the "+N" label exactly once.
    seq: 0,
  }
}

// Fixed pool, allocated once and reused for the life of the game — spawning
// just recycles the oldest slot (Tech.md §7: no per-frame allocation).
export const actionPopupPool = []
for (let i = 0; i < ACTION_POPUP_POOL_SIZE; i++) actionPopupPool.push(makeSlot())

let nextSlot = 0 // round-robin write cursor
let spawnSeq = 0

// Last projection of the player anchor into normalized device coords, refreshed
// by step() each frame. spawnActionPopup() snapshots this so a popup stays put
// where the avatar was the instant the Action landed.
const playerNdc = { x: 0, y: 0 }

// Scratch, hoisted to module scope — zero allocation per frame (Tech.md §7).
const anchor = new THREE.Vector3()

// Called only from systems/actionTracker.js, once per Action, with that
// Action's applied Power gain. A non-positive amount (Power already clamped at
// POWER_MAX) shows nothing.
export function spawnActionPopup(amount) {
  if (!(amount > 0)) return
  const slot = actionPopupPool[nextSlot]
  nextSlot = (nextSlot + 1) % ACTION_POPUP_POOL_SIZE
  spawnSeq += 1

  slot.alive = true
  slot.age = 0
  slot.amount = amount
  slot.ndcX = playerNdc.x + (Math.random() * 2 - 1) * ACTION_POPUP_SPREAD_X
  slot.ndcY = playerNdc.y + (Math.random() * 2 - 1) * ACTION_POPUP_SPREAD_Y
  slot.seq = spawnSeq
}

export function step(dt, camera) {
  if (camera) {
    anchor.set(
      player.position.x,
      player.position.y + ACTION_POPUP_ANCHOR_HEIGHT,
      player.position.z,
    )
    anchor.project(camera)
    // anchor.z > 1 means the point is behind the camera — project() mirrors it
    // to the far side, so fall back to screen centre rather than flinging
    // popups off-axis.
    if (anchor.z <= 1) {
      playerNdc.x = anchor.x
      playerNdc.y = anchor.y
    } else {
      playerNdc.x = 0
      playerNdc.y = 0
    }
  }

  for (let i = 0; i < ACTION_POPUP_POOL_SIZE; i++) {
    const slot = actionPopupPool[i]
    if (!slot.alive) continue
    slot.age += dt
    if (slot.age >= ACTION_POPUP_LIFETIME) slot.alive = false
  }
}
