# Laser Escape — Engine & Game Spec

A browser incremental simulator built with React Three Fiber. This document is both the
architecture blueprint and the game spec: §1–§2 are the stack and layout, §3 is the game,
§4–§5 are the module contracts, §6–§7 are the art and performance budgets.

**Design stance, stated once:** this engine is *cheap by construction*, not adaptive at
runtime. There is no dynamic quality scaling, no LOD system, no demand rendering. Instead
every subsystem is built to be affordable on a phone at 60fps in its worst case. That trade
is deliberate and is what makes the rest of the document coherent. §7 lists the
runtime-adaptive techniques deliberately left out, and where you would add them.

---

## 1. Stack

| Package | What it does here | What was rejected, and why |
| --- | --- | --- |
| `three` | The renderer. Everything else wraps it. | — |
| `@react-three/fiber` | React reconciler for three.js: `useFrame`, a declarative scene graph, automatic disposal of declaratively-created objects. | Raw three.js — you lose component-scoped lifecycle and end up hand-rolling a scene-graph differ. |
| `@react-three/drei` | Used for **exactly two things**: SDF `<Text>` and `<Billboard>`, for in-world signage. | `<Html>` — never used; all HUD is DOM siblings of the canvas (§5.4). `<Environment>` — it streams HDRIs from a CDN and stalls the scene offline. `<OrbitControls>` — the game needs left-click for its action verb (§5.2). |
| `zustand` | The one durable-state store. **No middleware at all** — no `immer`, no `persist`, no `subscribeWithSelector`. | Redux/Context — a Context value change re-renders every consumer, which a clicker cannot afford. The `persist` middleware — it writes on every `set`; §5.3 needs a debounce and an explicit whitelist. |
| `tailwindcss` | The HUD: utility classes plus a small hand-written component layer. | A component library — every one of them fights a full-bleed canvas overlay. |
| `vite` | Dev server and build. Fast HMR matters enormously when tuning feel. | — |

**Not installed:** `@react-three/rapier`. Nothing in §3 needs physics — the player is a
kinematic capsule (§5.2) and walls break on an HP counter, not a simulation. It gets added
only if cosmetic wall-shatter debris ships, and only under the bounds in §7.

---

## 2. Project skeleton

```
index.html
vite.config.js   tailwind.config.js   postcss.config.js
public/
  models/props.glb            # every prop, one file, one material (§6)
  textures/atlas.ktx2
src/
  main.jsx                    # boot wiring: autosave subscription, sfx install, flush hooks
  App.jsx                     # <Canvas> + DOM overlay siblings
  index.css                   # Tailwind layers + the hand-written UI kit
  store/
    useGameStore.js           # THE store: durable state + derive() + all actions
  data/                       # EVERY tunable number. No balance constant lives elsewhere.
    lasers.js  walls.js  progression.js  hub.js  lane.js  format.js
  systems/                    # framework-free modules. No React import in any of these.
    input.js  playerState.js  playerMovement.js  cameraOrbit.js
    events.js  timeScale.js  persistence.js
    audio.js  sfx.js  mergeBoxes.js
    bloxity.js  avatarState.js  avatarModel.js   # the SDK facade (§5.6)
    settingsState.js  session.js  chat.js
  components/                 # presentation only. Call store actions; never own balance.
    HitParticles.jsx  FloatingTexts.jsx  Stats.jsx
    PlayerAvatar.jsx          # mounts the Bloxity rig under Player
    hud/                      # DOM overlay, not in the canvas
    hub/  lane/               # one folder per scene
```

Three rules make this re-themeable, and they are the whole point of the layout:

1. **`src/data/` owns every number.** If a component contains a balance constant, the game
   cannot be retuned without reading components. Re-theming should mean rewriting `data/`
   and the model-description functions — and nothing else.
2. **`src/systems/` never imports React.** These are plain ES modules holding module-level
   state. That is exactly what lets a frame loop read them without a subscription.
3. **`src/components/` is presentation.** A component reads the store (or a system
   singleton) and draws. It never decides what a click is worth.

---

## 3. The game

An incremental simulator. Two connected spaces, one continuous world — no loading, no scene
swap; the player walks between them.

**The loop:**

1. **Accumulate Power.** Hold left-click / tap on the target objects in the spawn hub. Each
   hit adds `powerPerHit` from the player's current laser tier.
2. **Destroy walls.** Walk to the centre lane and fire. The beam drains Power and deals it
   as damage to the current wall, which has an HP set by its index in the wall table.
3. **Collect Wins.** When a wall breaks it stays broken. The player walks to the win pad
   behind it to claim that wall's **Wins** — the primary currency. Claiming is optional and
   manual; unclaimed Wins sit on the pad.
4. **Upgrade lasers.** Spend Wins at the purchase stands in the hub. A higher tier raises
   `powerPerHit` and `chargeRate`, so Power accrues faster.
5. **Rebirth.** Once the player has cleared `rebirthWallIndex` walls, they may reset Power,
   wall progress and laser tier in exchange for a permanent multiplier on all Power gain.
   Wins and rebirth count survive.

**Scenes.** `hub/` holds targets, purchase stands, the rebirth pad and the spawn point.
`lane/` holds the wall slot, the beam and the win pad. Both are laid out from data tables
(§4) — level layout is **code**, not a Blender file. Blender authors props only (§6).

**What a save holds.** `power`, `wins`, `laserTier`, `wallIndex`, `wallHp`, `rebirths`,
`unclaimedWins`, `settings`, plus a `version` field for migration. Nothing else — see §5.3.

---

## 4. Data tables

| File | Owns |
| --- | --- |
| `lasers.js` | Tier table `{ id, name, cost, powerPerHit, chargeRate, beamColor }`. Cost curve is geometric; each tier must feel like a step, not a nudge. |
| `walls.js` | Wall table `{ index, hp, winsReward, color, thickness }`. HP grows faster than laser output, which is what makes upgrades necessary rather than optional. |
| `progression.js` | Rebirth threshold, rebirth multiplier curve, and the tuning constants that span both tables. |
| `hub.js` | Hub geometry: spawn point, target positions, stand positions, rebirth pad, and the static AABB list the collider reads. |
| `lane.js` | Lane bounds, wall slot transform, win pad position, and its AABB list. |
| `format.js` | Big-number formatting (K, M, B, T, then `aa`, `ab`…). Not balance, but it is the one place the number *presentation* is decided. |

Numbers are plain JS doubles. A double holds ~1e308, which outlasts any curve here — no
BigInt, no decimal.js, no allocation per tick.

---

## 5. System contracts

Each module owns mutable module-level state and exposes a small surface. None imports React.

### 5.1 Frame-loop systems

| Module | State it owns | Surface |
| --- | --- | --- |
| `input.js` | `inputState` — move vector, look delta, `firing` flag | `install()`, `inputState`. Keyboard + pointer + touch joystick. **Left-click/tap is the action verb** (hold to fire), which is why there is no OrbitControls. |
| `playerState.js` | `player` — position, velocity, grounded, facing, zone | the singleton itself; mutated in place, never reallocated |
| `playerMovement.js` | none | `step(dt, aabbs)` — kinematic capsule vs. a flat array of static AABBs. Predictable and far cheaper than a physics character controller. |
| `cameraOrbit.js` | yaw, pitch, distance | `update(camera, dt)` — third-person follow with drag-orbit |
| `timeScale.js` | `paused`, last timestamp | `tick()` returns a **clamped** dt. A backgrounded tab must never dump 30s into one frame. |
| `events.js` | listener map | `emit(name, ...args)` / `on(name, fn)`. Drives sfx, particles and floating texts without coupling them to the store. |

### 5.2 Movement and camera

The player is a capsule stepped once per frame: apply input to velocity, apply gravity,
integrate, then resolve against the static AABB list for the current zone, axis by axis.
No broadphase — the AABB count is small enough (tens) that a linear scan is cheaper than
any structure that would index it.

### 5.3 Persistence

`persistence.js` writes to `localStorage` on a **~2s debounce** from a store subscription,
serialising an **explicit whitelist** of keys (§3) — never the whole store, so adding
transient state can never accidentally start persisting it. It flushes synchronously on
`visibilitychange` and `pagehide`. On load, an unknown or missing `version` falls through a
migration stub to a fresh save rather than crashing on a stale shape.

### 5.4 HUD

The HUD is DOM siblings of the `<canvas>`, never drei `<Html>`. **It must not re-render per
frame.** Numeric readouts subscribe transiently (`useGameStore.subscribe`, outside React) and
write `textContent` on a ~10Hz throttle; React state is reserved for panel open/close. The
frame loop reads systems directly and never calls `setState`.

### 5.5 Audio

`audio.js` owns one `AudioContext`, unlocked on the first user gesture (mobile browsers
refuse otherwise). `sfx.js` pools buffer sources and rate-limits repeat sounds — hold-to-fire
generates hits far faster than an ear can resolve them.

### 5.6 Bloxity SDK

`systems/bloxity.js` is the **only** module that touches `window.Legion.SDK`. It holds the
single `onUserChanged` subscription — the source of truth for auth UI and for (re)loading
friends, avatar and balance — and every method no-ops when the SDK is absent. That guard is
load-bearing, not defensive polish: §1 rejected drei `<Environment>` because a CDN stall
breaks the scene, and the same standard applies here. A blocked `sdk.bloxity.io` must leave
the game fully playable on the capsule fallback.

| Concern | Where it lands |
| --- | --- |
| Portal settings (8 keys) | `settingsState.js` singleton; frame-loop systems read it without subscribing. Registering a listener is also what puts the control in the portal menu, so every registered key drives something real. |
| Avatar | `avatarState.js` (equipped ids + clamped proportions) → `avatarModel.js` (loads and rigs) → `PlayerAvatar.jsx` (mounts). Signed-out players wear `DEFAULT_EQUIPPED` (the bare base rig), not the capsule. |
| Avatar run cycle | `avatarAnim.js`. Prefers an embedded `player.glb` clip matching `GAIT.runClip`; else a generated four-bone swing on `ArmL1/ArmR1/LegL1/LegR1` (rotation-only, so it never fights `applyProportions`). `PlayerAvatar.jsx` ticks it from `hypot(velocity.xz) / SPEED`. |
| Collider | Proportions rescale `player.dims`, which `playerMovement.js` and `cameraOrbit.js` read every frame. `PLAYER_RADIUS`/`PLAYER_HEIGHT` remain the defaults that seed it — they are const bindings and could never have been reassigned by a caller, which is exactly how a remote height would have silently desynced the drawn body from the AABB sweep. |
| Pause | The SDK supplies the writers `timeScale.paused` never had: Escape → the portal menu, and `pointer_lock_changed`. `resetClock()` on resume. |
| Input | All listeners are on `window`, so keystrokes typed into an SDK modal would otherwise also drive WASD. `input.js` exposes `suspend(reason)`/`resume(reason)` for the auth popup, customizer and portal menu. |
| Rooms | `session.js` reads an incoming `?roomId`/`?partyId` and mints one for outgoing invites. `playerJoined`/`playerInRoom` are the seams real netcode will drive; today an invite link resolves and launches the game, but there is no co-presence. |
| Bux | Deliberately **not** wired. Fulfillment arrives by a server-to-server webhook and there is no backend, so a non-2xx auto-refunds and every grant would be free. `getBalance()` is a plain read and is wired. Prices never reach the client — skus only; the catalog is server-authoritative. |

---

## 6. Art pipeline

Blender authors **props only**; layout is data (§4). Props: target orb, purchase stand,
rebirth pad, win pad, wall panel, lane frame, player character.

Authoring rules, all enforced at export:

- 1 unit = 1 metre, +Y up, transforms applied, origin at each prop's base.
- **< 500 tris per prop.** No subdivision, no smooth-shading modifiers, no n-gons.
- **One shared material for the entire prop set**, UVs unwrapped into a single 512² atlas.
- Colour variation comes from **vertex colours**, not extra materials or textures. This is
  what lets the whole set instance down to one draw call.
- Occlusion is baked into vertex colours — there are no runtime shadows (§7).

Export → `bpy.ops.export_scene.gltf` with Draco → `gltf-transform prune dedup weld ktx2` →
one `public/models/props.glb`. Loaded once with `GLTFLoader` + `DRACOLoader` + `KTX2Loader`;
the geometries are then reused across `InstancedMesh`es.

**The player character is the one exception**, and it is scoped. When a signed-in player has
a Bloxity avatar, the body comes from `static.bloxity.io` instead of this pipeline: a skinned
rig (6 meshes, 104 tris, **one** shared material — `avatarModel.js` maps every source
material to a single converted one, so meshes that shared a material still do) plus up to
eight optional cosmetic slots, each adding one mesh and one material. Hats and backs are
`.obj` with plain `.png`: no Draco, no KTX2, and sizes we do not control. Props stay atlased
and instanced — only the player is multi-mesh — and remote players, if they ever ship, must
be capped or merged rather than each paying this cost.

---

## 7. Performance rules

Hard numbers, each checkable from `renderer.info` behind the stats toggle:

| Rule | Budget |
| --- | --- |
| Draw calls, busiest view | **< 60** |
| Triangles | < 150k |
| Total download | < 5 MB |
| Device pixel ratio | clamped to `[1, 1.5]` |

- Everything repeated is an `InstancedMesh`. Everything static and unique is merged by
  `mergeBoxes.js` into one geometry per material, with `matrixAutoUpdate = false`.
- **Materials are `MeshLambertMaterial` or `MeshBasicMaterial` only.** No
  `MeshStandardMaterial` — PBR costs fragment time a phone does not have, and against baked
  occlusion it buys nothing. Remote avatar glTFs arrive as `MeshStandardMaterial`, so
  `avatarModel.js` rebuilds every loaded material as Lambert on the way in; this rule is
  enforced at the boundary, not assumed.
- One 512² KTX2/Basis atlas: power-of-two, mipmapped, `SRGBColorSpace`, anisotropy 1.
- Lighting is one hemisphere + one directional light. **Shadows off.**
- **No postprocessing.** The laser glow is an additive cylinder plus a sprite core, not
  bloom — bloom is the single most expensive thing that could be added here.
- Zero allocation inside `useFrame`: scratch `Vector3`/`Quaternion` hoisted to module scope;
  particles and floating texts drawn from fixed-size pools.
- Dispose geometries, materials and textures on teardown. three.js does not GC GPU memory.

`graphics_quality` (Low/Medium/High/Ultra) caps `dpr` through `<Canvas dpr>` and is **not** a
violation of the stance in the preamble. It is a *user-elected* tier applied on change; what
this engine rejects is runtime-*adaptive* scaling — a `dpr` setter driven by a frame-time
average, which still does not exist. The cap stays inside the `[1, 1.5]` clamp above.

**Deliberately left out**, and where they would go if the budget ever changed: LOD (per-prop,
in the loader), dynamic resolution scaling (a `dpr` setter driven by a frame-time average in
`timeScale.js`), demand rendering (`frameloop="demand"` on the `<Canvas>`, viable only once
the idle scene is genuinely static), and Rapier debris (bounded count, event-driven from
`events.js`, despawned on a timer).
