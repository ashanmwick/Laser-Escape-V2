// Wall health/damage balance constants (Tech.md §4: src/data/ owns every
// tunable number). Each wall's Strength IS its full health pool: every Action
// that lands on the wall (a click, then one per ACTION_HOLD_INTERVAL while
// fire is held — systems/actionTracker.js) subtracts the player's current
// Power (store/useGameStore.js) from that pool in one discrete hit, so after
// N strikes the remaining health is strength - Power*N (Power itself grows as
// the run goes), and the in-world bar reads `remaining / strength`
// (components/WallHealthBars.jsx) rather than a fixed X / 100.
//
// STAGE_STRENGTH is keyed by stage number — 1 is the first wall in
// data/wallProps.js's roster order (paper), 25 is the last (obsidian).
// WALL_STRENGTH resolves it to a wallId -> strength map through WALL_STAGES so
// the two orderings can never drift. The curve ramps 10 -> 1,000,000,000
// across the 25 stages.
import { WALL_STAGES } from './wallProps.js'

export const STAGE_STRENGTH = {
  1: 10,
  2: 50,
  3: 250,
  4: 1_000,
  5: 5_000,
  6: 15_000,
  7: 50_000,
  8: 150_000,
  9: 500_000,
  10: 1_500_000,
  11: 4_500_000,
  12: 10_000_000,
  13: 25_000_000,
  14: 50_000_000,
  15: 100_000_000,
  16: 200_000_000,
  17: 300_000_000,
  18: 400_000_000,
  19: 500_000_000,
  20: 600_000_000,
  21: 700_000_000,
  22: 800_000_000,
  23: 850_000_000,
  24: 900_000_000,
  25: 1_000_000_000,
}

// wallId -> strength (full health pool), resolved through the stage roster.
export const WALL_STRENGTH = Object.fromEntries(
  WALL_STAGES.map(({ id, stage }) => [id, STAGE_STRENGTH[stage]]),
)

// Health removed per wall strike, as a multiple of the player's current Power:
// damage = power * DAMAGE_CONSTANT (systems/wallHealth.js strikeWall(), fired
// once per Action by systems/actionTracker.js). At the default 1, one strike
// removes exactly `Power` health. Raise it to speed every wall up uniformly —
// tune here, not in systems/wallHealth.js.
export const DAMAGE_CONSTANT = 1

// In-world health bar above each wall (components/WallHealthBars.jsx). All
// distances are world metres, all times are seconds — Tech.md §4: every tunable
// number lives here, the component only owns structural constants (plane args,
// instance capacity).
export const WALL_HEALTH_BAR = {
  WIDTH: 15, // bar width at full health
  HEIGHT: 1.75, // bar height
  BORDER: 0.1, // lavender frame thickness, world metres — uniform on every side
  BORDER_COLOR: '#000000', // rounded outer border, same pill look as the HUD
  SEGMENTS: 12, // notch count baked into the mask texture
  SHOW_SEGMENTS: false, // image is a smooth pill — leave the notch overlay off
  // Placement: centred on the wall's width, HEIGHT_FRAC of the way up its face
  // (0 = base, 1 = top) plus Y_OFFSET metres, and FACE_OFFSET metres out from
  // the approach (-X) face so the bar floats just in front of the wall rather
  // than buried inside its box.
  HEIGHT_FRAC: 0.3, // sit low on the wall face
  Y_OFFSET: 0,
  FACE_OFFSET: 0.5,
  // Health -> fill colour, high to low, lerped between the bracketing stops.
  // Single stop = the fill stays this green at every health level (per design:
  // the bar never turns amber/red as it drains). Add stops back to restore the
  // graded look.
  COLOR_STOPS: [
    { at: 1.0, color: '#8fe34a' }, // bright lime, matching the image
  ],
  BG_COLOR: '#cf2b2b', // bar backing / damage track shown behind the green fill
  CHIP_COLOR: '#ffffff', // trailing "damage chip" that eases toward the true value
  LINGER_SECONDS: 2.5, // how long a bar stays up after the last hit
  SHOW_RANGE: 25, // also show the bar for any live wall this near the player
  CHIP_EASE: 0.6, // health-fraction per second the chip closes the gap
  FLASH_SECONDS: 0.15, // impact pulse duration
  FLASH_SCALE: 0.18, // extra vertical scale at the peak of the pulse
}

// Progressive damage look for each wall (components/WallProp.jsx): as
// healthFraction(id) falls 1 -> 0, the wall's own material (a Lambert JPEG
// albedo for the first ten, a flat Lambert/Basic colour for the fifteen new
// procedural ones — data/wallProps.js) is multiplied darker and a procedural
// crack overlay fades in over it. Tech.md §4: the feel lives here; WallProp
// keeps only the crack bitmap resolution.
export const WALL_DAMAGE = {
  MIN_BRIGHTNESS: 0.4, // base-colour multiplier at 0 health (1.0 = as-authored)
  CRACK_ONSET: 0.8, // health fraction where cracks first appear
  CRACK_MAX_OPACITY: 0.85, // crack overlay opacity at 0 health
  CRACK_TINT: '#0a0a0a', // crack colour — near-black so fractures read as depth
}
