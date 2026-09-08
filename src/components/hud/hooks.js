import { useEffect, useReducer } from 'react'
import { subscribeAuth } from '../../systems/bloxity.js'
import { subscribe as subscribeSettings } from '../../systems/settingsState.js'
import { subscribe as subscribeChat } from '../../systems/chat.js'

// The system singletons are mutated in place, so identity never changes and
// useSyncExternalStore would not re-render. These re-render on notification and
// let the caller read the singleton directly.
//
// This is event-driven only — auth changes, a settings change, a chat line.
// Nothing here ticks per frame (Tech.md §5.4).
function useNotifier(subscribe) {
  const [, bump] = useReducer((n) => n + 1, 0)
  useEffect(() => subscribe(() => bump()), [subscribe])
}

export function useAuth() {
  useNotifier(subscribeAuth)
}

export function useSettings() {
  useNotifier(subscribeSettings)
}

export function useChat() {
  useNotifier(subscribeChat)
}
