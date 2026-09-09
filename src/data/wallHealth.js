// Wall health/damage balance constants (Tech.md §4: src/data/ owns every
// tunable number). Strength increases in the order the ten walls are defined
// in data/wallProps.js's WALLS array — each tougher material gates progress
// behind more player Power (store/useGameStore.js), rather than being a hard
// wall/laser-tier match.
export const WALL_STRENGTH = {
  paper_wall: 1,
  cardboard_wall: 10,
  carpet_wall: 20,
  leather_wall: 30,
  rubber_wall: 40,
  grass_wall: 50,
  wood_wall: 60,
  glass_wall: 70,
  concrete_wall: 80,
  brick_wall: 90,
}

export const HEALTH_MAX = 100

// damage/sec = (power / strength) * DAMAGE_CONSTANT. Sized so starting Power
// (1) clears the weakest wall in a few seconds and barely scratches the
// strongest — tune here, not in systems/wallHealth.js.
export const DAMAGE_CONSTANT = 20

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
  FACE_OFFSET: 1,
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
// healthFraction(id) falls 1 -> 0, the wall's own MeshLambertMaterial (a JPEG
// albedo, data/wallProps.js) is multiplied darker and a procedural crack
// overlay fades in over it. Tech.md §4: the feel lives here; WallProp keeps
// only the crack bitmap resolution.
export const WALL_DAMAGE = {
  MIN_BRIGHTNESS: 0.4, // base-colour multiplier at 0 health (1.0 = as-authored)
  CRACK_ONSET: 0.8, // health fraction where cracks first appear
  CRACK_MAX_OPACITY: 0.85, // crack overlay opacity at 0 health
  CRACK_TINT: '#0a0a0a', // crack colour — near-black so fractures read as depth
}
