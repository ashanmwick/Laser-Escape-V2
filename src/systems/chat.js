// Incoming portal chat, kept as a short HUD scrollback rather than a log.
// Fed by the SDK's 'chat_message_sent' player event; display is gated on the
// enable_chat setting.
import { CHAT_MAX_LINES } from '../data/bloxity.js'

const listeners = new Set()

export const chat = { lines: [] }

export function subscribe(fn) {
  listeners.add(fn)
  fn(chat.lines)
  return () => listeners.delete(fn)
}

export function push(message) {
  const text = typeof message === 'string' ? message : String(message ?? '')
  if (!text) return
  // Replace the array rather than mutating it: React consumers compare by
  // identity, and this fires at human typing speed, not per frame.
  chat.lines = chat.lines.concat(text).slice(-CHAT_MAX_LINES)
  for (const fn of listeners) fn(chat.lines)
}

export function clear() {
  chat.lines = []
  for (const fn of listeners) fn(chat.lines)
}
