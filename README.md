# Laser Escape

Browser incremental simulator built with React Three Fiber. See [`Tech.md`](Tech.md)
for the full engine & game spec.

## Run

```bash
npm install
npm run dev
```

## Current state

Scaffold only — a ground plane and a kinematic-capsule player with basic control.

| Input | Action |
| --- | --- |
| WASD / arrows | move (camera-relative) |
| right-drag | orbit camera |
| mouse wheel | zoom |
| space | jump |
| hold left-click | fire flag (reserved for the action verb, §5.1) |

### Layout

- `src/systems/` — framework-free modules, no React import:
  `input.js`, `playerState.js`, `playerMovement.js`, `cameraOrbit.js`, `timeScale.js`,
  plus the Bloxity SDK facade (`bloxity.js`, `avatarState.js`, `avatarModel.js`,
  `settingsState.js`, `session.js`, `chat.js`, `audio.js`) — see Tech.md §5.6
- `src/data/hub.js` — spawn point + static collider AABBs (level layout is data, §3)
- `src/data/bloxity.js` — every SDK constant, including the `GAME_SLUG` placeholder
- `src/components/` — presentation: `GameLoop`, `Ground`, `Obstacles`, `Player`,
  `PlayerAvatar`, `Stats`, `hud/`

Bloxity integration: portal login, the player's cross-game avatar (with proportions
driving the collider), portal-owned settings, friends and invites. The game runs
identically standalone and embedded, and stays fully playable with the SDK blocked —
it falls back to the capsule player. **`GAME_SLUG` in `src/data/bloxity.js` is a
placeholder** until the game is registered on bloxity.io. Bux purchases are not wired:
fulfillment needs a server-to-server webhook and there is no backend yet.

Not yet built: the store, data tables beyond `hub.js`, targets/walls/beam, sfx,
persistence. `audio.js` exists only as the master/music gain buses the volume settings
drive — nothing plays sound yet. `Blender/World.blend` is untouched.
