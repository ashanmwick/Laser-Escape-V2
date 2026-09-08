import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { install as installInput } from './systems/input.js'
import { resetPlayer } from './systems/playerState.js'
import { SPAWN } from './data/hub.js'
import { init as initBloxity, teardown as teardownBloxity } from './systems/bloxity.js'

// Boot wiring (Tech.md §2). Input is a plain module, installed once here so the
// frame loop can read it without a subscription.
//
// Bloxity goes first: it registers the settings listeners and the single
// onUserChanged subscription, so the very first render already has the right
// auth state and settings applied. It is a no-op if the SDK failed to load.
initBloxity()
resetPlayer(SPAWN)
installInput()

// Flush the portal's gameplay state on the way out, alongside the save flush
// persistence.js will add here (Tech.md §5.3).
window.addEventListener('pagehide', teardownBloxity)

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
