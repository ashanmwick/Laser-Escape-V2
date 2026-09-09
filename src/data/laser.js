// Eye-laser tunables (Tech.md §4: src/data/ owns every tunable number).

// Beam origin, as a fraction of player.dims.height/.radius from the feet —
// approximates eye height/forward offset for both the fallback capsule and
// the loaded avatar, since neither exposes a real eye bone to read from.
export const LASER_EYE_HEIGHT_RATIO = 0.85
export const LASER_FORWARD_RATIO = 0.9

// Metres the beam reaches when the aim ray hits nothing (aiming at open sky).
export const LASER_MAX_RANGE = 200

export const LASER_CORE_RADIUS = 0.028
export const LASER_GLOW_RADIUS = 0.07
export const LASER_CORE_COLOR = '#ffd6d6'
export const LASER_GLOW_COLOR = '#ff2b2b'
export const LASER_GLOW_OPACITY = 0.45

export const LASER_FLASH_COLOR = '#ffb3b3'
export const LASER_FLASH_SIZE = 0.22
export const LASER_FLASH_OPACITY = 0.85
export const LASER_FLASH_PULSE_SPEED = 40 // rad/s
export const LASER_FLASH_PULSE_AMOUNT = 0.15
