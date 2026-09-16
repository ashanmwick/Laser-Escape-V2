// PVP player health/damage balance constants (Tech.md §4: src/data/ owns
// every tunable number).
export const PLAYER_MAX_HP = 100

// Damage per Action landed on another player while both are in the PVP zone
// (systems/playerCombat.js strikeTarget(), fired by systems/actionTracker.js
// the same cadence as a wall strike — data/progression.js
// ACTION_HOLD_INTERVAL). Deliberately flat — Power (or anything else) never
// factors in — so any player kills any other in exactly 10 hits.
export const PVP_DAMAGE_PER_HIT = PLAYER_MAX_HP / 10

// Ray-vs-player hit radius (systems/playerCombat.js), a bit larger than the
// remote's own visual capsule radius (data/net.js REMOTE_BODY.RADIUS, 0.4m) —
// mouse aiming at range plus the remote's own position-interpolation lag both
// eat into a razor-thin hitbox, and a slightly forgiving one reads as "the
// laser hits them" more reliably without the beam visibly missing the body.
export const PVP_HIT_RADIUS = 0.55

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
