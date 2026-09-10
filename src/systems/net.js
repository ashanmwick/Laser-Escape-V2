// Multiplayer presence (Tech.md §5.1 style: framework-free, mutable module
// state, no React import). This is the ONLY module that talks to the Colyseus
// server, and — exactly like systems/bloxity.js §5.6 — every path through it is
// built so a slow, asleep, or absent server leaves the game fully playable
// solo. Nothing here blocks gameplay; the scene never waits on a socket.
//
// The server (server/src/rooms/ArenaRoom.ts) is a dumb relay: we send our
// transform + beam endpoint as a `move` message, it fans every player's state
// out through `room.state.players`. We read that map once per frame in step()
// rather than wiring per-field schema callbacks, so there is no dependency on
// the exact @colyseus/schema callback API.
import { player } from './playerState.js'
import { laser } from './laser.js'
import { SPEED } from './playerMovement.js'
import { authState, subscribeAuth } from './bloxity.js'
import { avatarState, subscribe as subscribeAvatar } from './avatarState.js'
import {
  subscribeWallNet,
  applyRemoteWallHealth,
  resetWallsFromNetwork,
} from './wallHealth.js'
import { PROPORTIONS, clamp } from '../data/bloxity.js'
import {
  SERVER_URL,
  ROOM_NAME,
  JOIN_TIMEOUT_MS,
  RETRY_BACKOFF_MS,
  SOLO_NOTICE_AFTER_ATTEMPT,
  MOVE_SEND_HZ,
  MOVE_IDLE_MS,
  MOVE_EPSILON_POS,
  MOVE_EPSILON_YAW,
  REMOTE_LERP_RATE,
  REMOTE_STALE_MS,
  MAX_REMOTE_BODIES,
  USERNAME_WAIT_MS,
  AVATAR_MAX_LEN,
  AVATAR_RESEND_DEBOUNCE_MS,
  REMOTE_BODY,
} from '../data/net.js'

// --- Public state -----------------------------------------------------------
// Coarse connection status the HUD renders (components/hud/NetStatus.jsx):
//   'idle'       — not started / torn down
//   'connecting' — a join or reconnect attempt is in flight
//   'solo'       — between retry attempts; the game is single-player right now
//   'online'     — attached to a room
export const netState = {
  status: 'idle',
  attempt: 0, // failed attempts since the last successful attach
  playerCount: 0, // total players in the room, including us
  everConnected: false, // true once we have attached at least once this session
  error: null, // last error string, for diagnostics
}

// id -> live remote body. Mutated in place; the frame loop (step) and
// components/RemotePlayers.jsx read it directly.
//   x/y/z/yaw/speed   last values the server reported
//   rx/ry/rz/ryaw/rspeed  eased render values (smooth the MOVE_SEND_HZ packets)
//   firing            beam on?          beam {x,y,z}  world-space beam endpoint
//   username          name-tag text
//   alpha             0..1 fade (spawn-in / leave-out)
//   present           seen in room.state this frame
//   lastAt            performance.now() of the last time it was seen present
export const remotePlayers = new Map()

// --- Listeners ------------------------------------------------------------
// Fires on status / count / roster changes — NOT per move packet, so a HUD
// subscriber never re-renders per frame (Tech.md §5.4).
const listeners = new Set()

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emit() {
  netState.attempt = attempt
  for (const fn of listeners) {
    try {
      fn(netState)
    } catch {
      // A broken subscriber must not wedge the netcode.
    }
  }
}

function setStatus(status) {
  if (netState.status !== status) {
    netState.status = status
    emit()
  } else {
    emit()
  }
}

// --- Connection machine -------------------------------------------------
let sdkModule = null
let client = null
let room = null
let selfId = ''
let started = false
let stopped = true
let connecting = false
let attempt = 0
let retryTimer = 0
let sdkReconnecting = false // mirrors room.reconnection.isReconnecting
// Last room.state.resetNonce we have seen. null until the first state read on a
// fresh attach — that first read is ADOPTED (a joiner takes the room's current
// wall state as-is), and only later changes trigger a local wall reset.
let lastResetNonce = null
// Set when WE reached a win panel and sent `winPanelHit`: our walls are already
// reset locally, so suppress wall-health adoption until the server echoes the
// resetNonce bump (otherwise the still-stale `walls` patch would re-damage them
// for a frame). Cleared on that echo, or after RESET_ACK_TIMEOUT_MS as a
// safety if the send was lost.
let pendingLocalReset = false
let pendingLocalResetSince = 0
const RESET_ACK_TIMEOUT_MS = 4000

async function loadSdk() {
  if (!sdkModule) sdkModule = await import('@colyseus/sdk')
  return sdkModule
}

function currentUsername() {
  // Signed-in account, else Bloxity's generated guest identity ("bear5" …),
  // matching the HUD identity chip. Plain "Guest" only if neither exists.
  const u = authState.user || authState.guest
  const name = u && (u.displayName || u.username || u.name)
  return typeof name === 'string' && name.trim() ? name.trim().slice(0, 64) : 'Guest'
}

// --- Avatar sync -------------------------------------------------------
// Our own Bloxity avatar, serialised for the wire so every other client can
// build the real character. `avatarState` already holds the SDK's equipped ids
// + clamped proportions (systems/avatarState.js); a guest's `equipped` is {}
// which still builds the bare base rig, exactly like the local PlayerAvatar.
function avatarPayload() {
  try {
    const json = JSON.stringify({
      e: avatarState.equipped || {},
      p: avatarState.proportions || {},
    })
    return json.length <= AVATAR_MAX_LEN ? json : ''
  } catch {
    return ''
  }
}

// Full, clamped proportions from a possibly-partial remote object (untrusted —
// it came off the wire). Mirrors avatarState.js's writeProportions().
function sanitizeProportions(raw) {
  const out = {}
  const src = raw && typeof raw === 'object' ? raw : {}
  for (const [k, spec] of Object.entries(PROPORTIONS)) {
    const n = Number(src[k])
    out[k] = clamp(Number.isFinite(n) ? n : spec.def, spec.min, spec.max)
  }
  return out
}

// Keep only string-valued cosmetic ids, each length-capped. buildAvatar()
// already 404s any bad id back to the default mesh, so this is just hygiene.
function sanitizeEquipped(raw) {
  const out = {}
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string' && v.length <= 64) out[k] = v
    }
  }
  return out
}

// Parse an inbound `avatar` schema string into { equipped, proportions }.
function parseAvatar(str) {
  let obj = null
  if (typeof str === 'string' && str) {
    try {
      obj = JSON.parse(str)
    } catch {
      obj = null
    }
  }
  return {
    equipped: sanitizeEquipped(obj && obj.e),
    proportions: sanitizeProportions(obj && obj.p),
  }
}

let avatarResendTimer = 0

function sendAvatarNow() {
  if (!room) return
  const avatar = avatarPayload()
  if (!avatar) return
  try {
    room.send('setAvatar', { avatar })
  } catch {
    // Socket mid-close — the next attach re-seeds via join options anyway.
  }
}

function scheduleAvatarResend() {
  if (avatarResendTimer) return
  avatarResendTimer = setTimeout(() => {
    avatarResendTimer = 0
    sendAvatarNow()
  }, AVATAR_RESEND_DEBOUNCE_MS)
}

// --- Wall health sync -------------------------------------------------
// Local wall events from systems/wallHealth.js -> the room. Strikes land every
// ACTION_HOLD_INTERVAL (2 s) at most, so a send per event is not chatty; the
// server just clamps + stores and fans the value out to everyone else.
function onLocalWallEvent(ev) {
  if (!room) return
  try {
    if (ev.type === 'damage') {
      room.send('wallDamage', { wallId: ev.id, hp: ev.hp })
    } else if (ev.type === 'destroyed') {
      room.send('wallDestroyed', { wallId: ev.id })
    } else if (ev.type === 'reset') {
      pendingLocalReset = true
      pendingLocalResetSince = performance.now()
      room.send('winPanelHit', {})
    }
  } catch {
    // Socket mid-close — handleLeave() will pick it up; local state already moved.
  }
}

// Resolve once auth has settled, so a signed-in player joins under their real
// name. Bounded — a blocked SDK never settles and must not hold the connect.
function waitForAuth(ms) {
  if (authState.ready) return Promise.resolve()
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(t)
      off()
      resolve()
    }
    const off = subscribeAuth((s) => {
      if (s.ready) finish()
    })
    const t = setTimeout(finish, ms)
  })
}

function withTimeout(promise, ms, label) {
  let t
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(label)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

async function connect() {
  if (stopped || connecting || room) return
  connecting = true
  clearTimeout(retryTimer)
  retryTimer = 0
  setStatus('connecting')

  try {
    const mod = await loadSdk()
    if (stopped) return
    if (!client) client = new mod.Client(SERVER_URL)

    // The @colyseus/sdk Room has its own automatic reconnection (buffered
    // messages, exponential backoff) that transparently rides out a brief
    // socket drop — a Render dyno recycle, a Wi-Fi blip. This connect() is
    // only reached for the FIRST join and for the outer fallback after that
    // built-in reconnection has exhausted its retries (room.onLeave). So a
    // plain joinOrCreate is all that's needed here; JOIN_TIMEOUT_MS covers a
    // cold Render boot.
    const joined = await withTimeout(
      // `avatar` in the join options so a joiner is drawn as the right
      // character from their very first patch, before any `setAvatar` lands.
      client.joinOrCreate(ROOM_NAME, {
        username: currentUsername(),
        avatar: avatarPayload(),
      }),
      JOIN_TIMEOUT_MS,
      'join timed out',
    )

    if (stopped) {
      try {
        joined.leave()
      } catch {
        /* nothing to clean up */
      }
      return
    }
    attachRoom(joined)
  } catch (err) {
    connecting = false
    attempt += 1
    netState.error = String((err && err.message) || err)
    if (stopped) return
    scheduleRetry()
  }
}

function scheduleRetry() {
  if (stopped || room || retryTimer) return
  // Between attempts the game IS single-player. Say so plainly once a cold
  // start is the likely cause; keep retrying underneath either way.
  setStatus(attempt >= SOLO_NOTICE_AFTER_ATTEMPT || netState.everConnected ? 'solo' : 'connecting')
  const i = Math.min(Math.max(attempt - 1, 0), RETRY_BACKOFF_MS.length - 1)
  retryTimer = setTimeout(() => {
    retryTimer = 0
    connect()
  }, RETRY_BACKOFF_MS[i])
}

function attachRoom(joined) {
  room = joined
  connecting = false
  attempt = 0
  selfId = joined.sessionId
  sdkReconnecting = false
  // Re-adopt the room's wall state on this (re)attach rather than treating the
  // current resetNonce as a change to react to (step() seeds it on first read).
  lastResetNonce = null
  pendingLocalReset = false
  netState.everConnected = true
  netState.error = null

  // Fires only once the SDK's own reconnection has given up (or on a
  // consented leave from teardown()). That's our cue to drop to solo and run
  // the slower outer retry loop.
  room.onLeave((code) => handleLeave(code))
  room.onError((code, message) => {
    netState.error = message || `error ${code}`
  })

  // Re-send our avatar on every (re)attach — the join options already carried
  // it, but a fresh joinOrCreate after a drop needs it re-stated on the new
  // session, and a server that predates the `avatar` field just ignores this.
  sendAvatarNow()

  recount()
  setStatus('online')
}

function handleLeave() {
  room = null
  selfId = ''
  connecting = false
  sdkReconnecting = false
  lastResetNonce = null
  pendingLocalReset = false
  netState.playerCount = 0
  // Fade every remote out; step() culls them as alpha hits 0.
  for (const e of remotePlayers.values()) e.present = false

  if (stopped) return
  attempt = 0
  scheduleRetry()
}

function recount() {
  const n = room && room.state && room.state.players ? room.state.players.size : 0
  if (n !== netState.playerCount) {
    netState.playerCount = n
    emit()
  }
}

// --- Public lifecycle -------------------------------------------------
let offAvatar = null
let offWallNet = null

export function init() {
  if (started) return
  started = true
  stopped = false
  // One subscription for the whole session: the portal changed our avatar
  // (login, customizer) — push it to the room, debounced. A no-op while
  // offline; the next attach re-seeds from avatarPayload().
  if (!offAvatar) offAvatar = subscribeAvatar(() => scheduleAvatarResend())
  // Local wall damage / destroy / round-reset -> the room. onLocalWallEvent
  // no-ops while offline, so single-player wall breaking is unaffected.
  if (!offWallNet) offWallNet = subscribeWallNet(onLocalWallEvent)
  waitForAuth(USERNAME_WAIT_MS).then(() => {
    if (!stopped) connect()
  })
}

export function teardown() {
  stopped = true
  started = false
  clearTimeout(retryTimer)
  retryTimer = 0
  clearTimeout(avatarResendTimer)
  avatarResendTimer = 0
  if (offAvatar) {
    offAvatar()
    offAvatar = null
  }
  if (offWallNet) {
    offWallNet()
    offWallNet = null
  }
  if (room) {
    try {
      // Stop the SDK from trying to reconnect a socket we are deliberately
      // closing on the way out.
      if (room.reconnection) room.reconnection.enabled = false
      room.leave()
    } catch {
      /* page is going away */
    }
  }
  room = null
  connecting = false
  remotePlayers.clear()
  netState.playerCount = 0
  setStatus('idle')
}

// Manual "Retry" from the HUD banner. Collapses the backoff and tries now.
export function retryNow() {
  if (stopped) {
    stopped = false
    started = true
  }
  clearTimeout(retryTimer)
  retryTimer = 0
  attempt = 0
  connect()
}

// --- Outgoing: local player -> server --------------------------------
let lastSendAt = 0
const lastSent = { x: 0, y: 0, z: 0, yaw: 0, speed: 0, firing: false }

// Called every frame from GameLoop. Throttles itself: MOVE_SEND_HZ while the
// transform is changing, once per MOVE_IDLE_MS at rest so a late joiner still
// sees us standing where we are.
export function reportLocal() {
  if (!room) return

  const p = player.position
  const yaw = player.facing
  const speed = Math.min(1, Math.hypot(player.velocity.x, player.velocity.z) / SPEED)
  const firing = laser.active

  const changed =
    Math.abs(p.x - lastSent.x) > MOVE_EPSILON_POS ||
    Math.abs(p.y - lastSent.y) > MOVE_EPSILON_POS ||
    Math.abs(p.z - lastSent.z) > MOVE_EPSILON_POS ||
    Math.abs(yaw - lastSent.yaw) > MOVE_EPSILON_YAW ||
    Math.abs(speed - lastSent.speed) > 0.05 ||
    firing !== lastSent.firing

  const now = performance.now()
  const minGap = changed ? 1000 / MOVE_SEND_HZ : MOVE_IDLE_MS
  if (now - lastSendAt < minGap) return
  lastSendAt = now

  lastSent.x = p.x
  lastSent.y = p.y
  lastSent.z = p.z
  lastSent.yaw = yaw
  lastSent.speed = speed
  lastSent.firing = firing

  try {
    room.send('move', {
      x: p.x,
      y: p.y,
      z: p.z,
      yaw,
      speed,
      firing,
      beamToX: firing ? laser.end.x : 0,
      beamToY: firing ? laser.end.y : 0,
      beamToZ: firing ? laser.end.z : 0,
    })
  } catch {
    // Socket mid-close — handleLeave() will pick it up.
  }
}

// --- Per-frame: remote interpolation + roster upkeep -----------------
function shortestAngleTo(from, to) {
  let d = (to - from) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

function ingestRemote(id, s, now) {
  let e = remotePlayers.get(id)
  if (!e) {
    if (remotePlayers.size >= MAX_REMOTE_BODIES) return
    const parsed = parseAvatar(s.avatar)
    e = {
      x: s.x, y: s.y, z: s.z, yaw: s.yaw, speed: s.speed,
      rx: s.x, ry: s.y, rz: s.z, ryaw: s.yaw, rspeed: s.speed,
      firing: false, beam: { x: 0, y: 0, z: 0 },
      username: s.username || 'Player',
      // Bloxity avatar for RemotePlayers.jsx. `avatarRaw` is the last schema
      // string we built from; `avatarRev` bumps whenever it changes so the
      // component rebuilds the rig (and only then).
      avatarRaw: s.avatar || '',
      equipped: parsed.equipped,
      proportions: parsed.proportions,
      avatarRev: 0,
      alpha: 0, present: true, lastAt: now,
    }
    remotePlayers.set(id, e)
    emit() // a new body joined the render roster
  }
  e.x = s.x
  e.y = s.y
  e.z = s.z
  e.yaw = s.yaw
  e.speed = s.speed
  e.firing = !!s.firing
  e.beam.x = s.beamToX
  e.beam.y = s.beamToY
  e.beam.z = s.beamToZ
  if (s.username && s.username !== e.username) {
    e.username = s.username
    emit()
  }
  const nextAvatar = s.avatar || ''
  if (nextAvatar !== e.avatarRaw) {
    const parsed = parseAvatar(nextAvatar)
    e.avatarRaw = nextAvatar
    e.equipped = parsed.equipped
    e.proportions = parsed.proportions
    e.avatarRev++
    emit() // the character changed — rebuild the rig
  }
  e.present = true
  e.lastAt = now
}

export function step(dt) {
  const now = performance.now()

  // Reflect the SDK's own reconnection loop (a transient socket drop it is
  // riding out) into the HUD as "Reconnecting…", and back to "online" once it
  // recovers. If it never recovers, room.onLeave -> handleLeave takes over.
  if (room && room.reconnection) {
    const reconnecting = !!room.reconnection.isReconnecting
    if (reconnecting !== sdkReconnecting) {
      sdkReconnecting = reconnecting
      setStatus(reconnecting ? 'connecting' : 'online')
    }
  }

  if (room && room.state && room.state.players) {
    const live = room.state.players
    live.forEach((s, id) => {
      if (id !== selfId) ingestRemote(id, s, now)
    })
    // Anything we track that the room no longer lists has left.
    for (const [id, e] of remotePlayers) {
      if (!live.get(id)) e.present = false
    }
    recount()
  }

  // Shared wall health: a room-wide round reset first (someone reached a win
  // panel), then adopt every wall's current pool. applyRemoteWallHealth() is a
  // no-op for a value that matches or exceeds ours, so this costs ~25 early
  // returns a frame when nothing changed, and never fights a local strike.
  if (room && room.state) {
    if (pendingLocalReset && now - pendingLocalResetSince > RESET_ACK_TIMEOUT_MS) {
      pendingLocalReset = false
    }
    const nonce = room.state.resetNonce
    if (typeof nonce === 'number') {
      if (lastResetNonce === null) {
        lastResetNonce = nonce
      } else if (nonce !== lastResetNonce) {
        lastResetNonce = nonce
        if (pendingLocalReset) {
          pendingLocalReset = false // our own win-panel reset echoed back
        } else {
          resetWallsFromNetwork()
        }
      }
    }
    if (room.state.walls && !pendingLocalReset) {
      room.state.walls.forEach((w, id) => {
        applyRemoteWallHealth(id, w.hp, w.destroyed)
      })
    }
  }

  const lerp = 1 - Math.exp(-REMOTE_LERP_RATE * Math.min(dt, 0.1))
  const fadeStep = REMOTE_BODY.FADE_RATE * Math.min(dt, 0.1)

  for (const [id, e] of remotePlayers) {
    const stale = now - e.lastAt > REMOTE_STALE_MS
    const targetAlpha = e.present && !stale ? 1 : 0
    if (e.alpha < targetAlpha) e.alpha = Math.min(targetAlpha, e.alpha + fadeStep)
    else if (e.alpha > targetAlpha) e.alpha = Math.max(targetAlpha, e.alpha - fadeStep)

    e.rx += (e.x - e.rx) * lerp
    e.ry += (e.y - e.ry) * lerp
    e.rz += (e.z - e.rz) * lerp
    e.ryaw += shortestAngleTo(e.ryaw, e.yaw) * lerp
    e.rspeed += (e.speed - e.rspeed) * lerp

    if (targetAlpha === 0 && e.alpha <= 0.001) {
      remotePlayers.delete(id)
      emit() // the body left the render roster
    }
  }
}
