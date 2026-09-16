// Every local model the hub scene mounts at boot, split by which propModel.js
// loader consumes it. systems/preload.js walks both lists behind the loading
// screen (components/LoadingScreen.jsx) so the whole world is in memory before
// the screen drops away.
//
// Remote avatar assets (data/bloxity.js) are loaded on a separate path —
// avatarModel.js / PlayerAvatar.jsx, not preload.js — since they key off
// avatarState rather than a fixed URL list. LoadingScreen.jsx still gates on
// them (via systems/gameReadiness.js's live avatarReady flag) rather than
// adding them to this manifest, but with no timeout on that part — the
// avatar has no acceptable "missing" state the way an optional prop does, so
// it keeps the screen up (with its own status line + retry) until the real
// rig lands, even if that's well after every prop/wall here has settled.
import { TARGET_PROPS } from './targets.js'
import { WALL_PROPS } from './wallProps.js'
import { HEX_POWER_PAD_MODEL_URL } from './hexPowerPad.js'
import { GLOW_FLOOR_PANEL_MODEL_URL } from './glowFloorPanel.js'
import { TREE_MODEL_URL } from './tree.js'
import { TREE_PINE_MODEL_URL } from './treePine.js'

// Consumed by propModel.js loadProp() — scene-graph props, cached and cloned
// per instance. Both podiums are code-generated (components/PodiumStage.jsx)
// rather than loaded glTFs, so neither appears here any more.
export const PRELOAD_PROP_URLS = [
  ...TARGET_PROPS.map((t) => t.url),
  ...WALL_PROPS.map((w) => w.url),
  HEX_POWER_PAD_MODEL_URL,
  GLOW_FLOOR_PANEL_MODEL_URL,
  TREE_MODEL_URL,
  TREE_PINE_MODEL_URL,
]

// Consumed by propModel.js loadPropParts() — currently empty. Both
// GrassBlocks.jsx and GrassBlockCubes.jsx are code-generated (data/
// grassBlocks.js / data/grassBlockCubes.js) and no longer download
// anything, so neither appears here any more — same as both PodiumStage
// instances. Kept as a named export (rather than removed outright) since
// loadPropParts() is still a live propModel.js entry point another prop
// could use.
export const PRELOAD_PARTS_URLS = []

// What the loading bar counts up to.
export const PRELOAD_TOTAL = PRELOAD_PROP_URLS.length + PRELOAD_PARTS_URLS.length
