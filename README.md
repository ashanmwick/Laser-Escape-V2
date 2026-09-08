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
  `input.js`, `playerState.js`, `playerMovement.js`, `cameraOrbit.js`, `timeScale.js`
- `src/data/hub.js` — spawn point + static collider AABBs (level layout is data, §3)
- `src/components/` — presentation: `GameLoop`, `Ground`, `Obstacles`, `Player`, `hud/Hud`

Not yet built: the store, data tables beyond `hub.js`, targets/walls/beam, audio,
persistence. `Blender/World.blend` is untouched.
