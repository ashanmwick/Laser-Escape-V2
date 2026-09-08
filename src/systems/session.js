// Room / party identity for invites.
//
// There is no netcode yet, so this owns the *plumbing* only: it reads an
// incoming ?roomId / ?partyId deep link, mints a room id for outgoing invites,
// and exposes the single seam real multiplayer will later drive
// (notifyPlayerJoined / notifyPlayerInRoom). An invite link resolves and
// launches the game; actual co-presence needs the netcode that follows.
const listeners = new Set()

export const session = {
  roomId: '',
  partyId: '',
  // true when we arrived through someone else's invite link.
  joinedViaInvite: false,
}

function emit(event, payload) {
  for (const fn of listeners) fn(event, payload)
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function mintRoomId() {
  return `r${Math.random().toString(36).slice(2, 10)}`
}

export function install() {
  let params
  try {
    params = new URLSearchParams(window.location.search)
  } catch {
    params = new URLSearchParams('')
  }
  const incomingRoom = params.get('roomId') || ''
  const incomingParty = params.get('partyId') || ''
  session.joinedViaInvite = !!incomingRoom
  session.roomId = incomingRoom || mintRoomId()
  session.partyId = incomingParty
  emit('room', session)
}

export function setRoom(roomId, partyId = '') {
  session.roomId = roomId
  session.partyId = partyId
  emit('room', session)
}

// Menus / non-joinable states clear the room per the SDK contract.
export function clearRoom() {
  session.roomId = ''
  session.partyId = ''
  emit('room', session)
}

// Called by netcode join handlers once they exist. Drives the portal's
// friend-join toasts.
export function notifyPlayerJoined(username) {
  emit('playerJoined', username)
}

export function notifyPlayerInRoom(username) {
  emit('playerInRoom', username)
}
