// Every local model the hub scene mounts at boot, split by which propModel.js
// loader consumes it. systems/preload.js walks both lists behind the loading
// screen (components/LoadingScreen.jsx) so the whole world is in memory before
// the screen drops away.
//
// Remote avatar assets (data/bloxity.js) are deliberately left out: the game
// is playable on the capsule fallback and Player.jsx swaps the real avatar in
// whenever it arrives, so gating the loading screen on a CDN round-trip would
// only make boot slower and flakier.
import { TARGET_PROPS } from './targets.js'
import { WALL_PROPS } from './wallProps.js'
import { PODIUM_MODEL_URL } from './podium.js'
import { HEX_POWER_PAD_MODEL_URL } from './hexPowerPad.js'
import { GLOW_FLOOR_PANEL_MODEL_URL } from './glowFloorPanel.js'
import { GRASS_BLOCK_MODEL_URL } from './grassBlocks.js'

// Consumed by propModel.js loadProp() — scene-graph props, cached and cloned
// per instance. power_podium appears once here but backs both podiums.
export const PRELOAD_PROP_URLS = [
  ...TARGET_PROPS.map((t) => t.url),
  ...WALL_PROPS.map((w) => w.url),
  PODIUM_MODEL_URL,
  HEX_POWER_PAD_MODEL_URL,
  GLOW_FLOOR_PANEL_MODEL_URL,
]

// Consumed by propModel.js loadPropParts() — the InstancedMesh source parts
// GrassBlocks.jsx builds its lane border from.
export const PRELOAD_PARTS_URLS = [GRASS_BLOCK_MODEL_URL]

// What the loading bar counts up to.
export const PRELOAD_TOTAL = PRELOAD_PROP_URLS.length + PRELOAD_PARTS_URLS.length
