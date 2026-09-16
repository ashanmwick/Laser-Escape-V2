// PVP player health/damage balance constants (Tech.md §4: src/data/ owns
// every tunable number).
export const PLAYER_MAX_HP = 100

// Damage per Action landed on another player while both are in the PVP zone
// (systems/playerCombat.js strikeTarget(), fired by systems/actionTracker.js
// the same cadence as a wall strike — data/progression.js
// ACTION_HOLD_INTERVAL). Scales gently with the attacker's current Power so
// grinding still matters in PVP, but is capped well under PLAYER_MAX_HP so a
// maxed-Power player can't one-shot — a fight stays a multi-hit exchange.
export const PVP_DAMAGE_BASE = 4
export const PVP_DAMAGE_POWER_SCALE = 0.03
export const PVP_DAMAGE_MAX = 20

// How long a dead player stays frozen before systems/playerHealth.js respawns
// them at data/pvpZone.js's PVP_RESPAWN_POINT.
export const PVP_RESPAWN_DELAY_MS = 3000

// In-world health bar floating above each remote player's name tag
// (components/RemotePlayers.jsx), shown only while the local viewer is
// themselves inside the PVP zone (data/pvpZone.js).
export const REMOTE_HEALTH_BAR = {
  WIDTH: 1.1,
  HEIGHT: 0.12,
  Y_OFFSET: 0.3, // above the name tag's own anchor (data/net.js REMOTE_BODY.NAME_HEIGHT)
  BG_COLOR: '#3a0000',
  FILL_COLOR: '#3ddc55',
}

// HUD health bar, just above the "N Power" caption (components/hud/
// LevelBar.jsx). Deliberately tiny — a thin sliver, not a second progression
// bar — and shown only while the local player is in the PVP zone.
export const HUD_HEALTH_BAR = {
  WIDTH: 130,
  HEIGHT: 8,
  BORDER: 2,
  BG_COLOR: '#3a0000',
  FILL_COLOR: '#3ddc55',
}
