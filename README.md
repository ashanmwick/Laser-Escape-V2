# Laser Escape

Browser incremental simulator built with React Three Fiber. See [`Tech.md`](Tech.md)
for the full engine & game spec.

## Run

```bash
npm install
npm run dev
```

`/podium-stage.html` on that dev server is the inspector for the code-generated
`podium_stage` prop (`src/data/podiumStage.js` + `src/systems/podiumStageModel.js`):
orbit it, toggle wireframe / its collider boxes / the generated texture atlas, read
its triangle and draw-call cost, and export a baked `.glb`. It is a separate Vite
entry, so its dev-only imports (`OrbitControls`, `GLTFExporter`) stay out of the game
bundle.

## Current state

Scaffold only — a ground plane and a kinematic-capsule player with basic control.

| Input | Action |
| --- | --- |
| WASD / arrows | move (camera-relative) |
| right-drag | orbit camera |
| mouse wheel | zoom |
| space | jump |
| hold left-click | fire flag (reserved for the action verb, §5.1) |
| E | interact (AFK here / buy / equip) |

On touch devices the on-screen controls appear automatically
(`components/hud/TouchControls.jsx`): a floating stick on the left half moves,
dragging the right half orbits the camera, pinch zooms, and the bottom-right
cluster is Fire (hold) / Jump / E. The laser aims at the centre crosshair. A
portrait phone gets a "rotate to landscape" gate (`RotatePrompt.jsx`).

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
