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
