// PVP player health/damage balance constants (Tech.md §4: src/data/ owns
// every tunable number).
export const PLAYER_MAX_HP = 100

// Damage per Action landed on another player while both are in the PVP zone
// (systems/playerCombat.js strikeTarget(), fired by systems/actionTracker.js
// the same cadence as a wall strike — data/progression.js
// ACTION_HOLD_INTERVAL). Deliberately flat — Power (or anything else) never
// factors in — so any player kills any other in exactly 10 hits.
export const PVP_DAMAGE_PER_HIT = PLAYER_MAX_HP / 10

// Ray-vs-player hit radius (systems/playerCombat.js) at close range, well
// past the remote's own visual capsule radius (data/net.js REMOTE_BODY.RADIUS,
// 0.4m) — forgiveness for a genuine near-miss (mouse aim a bit off, the
// remote's own position-interpolation lag).
export const PVP_HIT_RADIUS = 0.01

// Beyond PVP_HIT_RADIUS, the effective hit radius widens with range instead
// of staying fixed (systems/playerCombat.js: effective = max(PVP_HIT_RADIUS,
// distanceAlongRay * PVP_AIM_ASSIST_TAN)) — a fixed-size hitbox forgives the
// same few centimetres of mouse error at 5m and at 30m, but real aiming error
// is angular: the same small slip of the cursor covers a few centimetres up
// close and metres at range. Raise this for more forgiving hits at real
// engagement distance; lower it to demand tighter aim. tan(16°) ≈ 0.287: at
// 10m that's ±2.9m of forgiveness, at 25m ±7.2m.
export const PVP_AIM_ASSIST_TAN = 0.287

// How long a dead player stays frozen before systems/playerHealth.js respawns
// them at the game's spawn point (data/hub.js SPAWN).
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

// "Just got hit" pulse (components/Player.jsx for the local avatar,
// components/RemotePlayers.jsx for remotes): every material on the avatar
// gets a brief red emissive tint that decays back to black over this window,
// timed off a single hitFlashAt timestamp (systems/hitFlash.js) — visible
// confirmation a shot landed even when the health bar itself is off-screen
// or (for a remote target) hidden because the viewer isn't in the PVP zone.
export const HIT_FLASH_DURATION_MS = 250
export const HIT_FLASH_COLOR = [1, 0.12, 0.12]

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
