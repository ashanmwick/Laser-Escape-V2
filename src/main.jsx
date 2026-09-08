import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { install as installInput } from './systems/input.js'
import { resetPlayer } from './systems/playerState.js'
import { SPAWN } from './data/hub.js'

// Boot wiring (Tech.md §2). Input is a plain module, installed once here so the
// frame loop can read it without a subscription.
resetPlayer(SPAWN)
installInput()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
