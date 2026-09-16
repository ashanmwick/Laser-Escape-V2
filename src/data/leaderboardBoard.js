// Data for the code-generated `leaderboard_board` prop — a freestanding
// Lego-brick-styled scoreboard (title + a ranked player/score list), the
// same "fully code-generated, nothing downloaded" recipe as data/
// pvpCenterPentagon.js and data/targetGroundMat.js: built at boot by
// components/LeaderboardBoard.jsx from the tables below, reusing systems/
// studTexture.js's stud checker for the brown board face so it reads as the
// same brick material as Ground.jsx/PvpCenterPentagon.jsx rather than a new
// one-off texture.
//
// The two things the brief called out as needing to be edited without
// touching any component code are LEADERBOARD_TITLE and LEADERBOARD_ENTRIES
// below — change the text/scores/entry count there and every derived layout
// number (BOARD_HEIGHT, TITLE_Y, ROW_YS, TIMER_Y) recomputes to fit, the same
// "component just mounts what data/ computed" split as data/podiumStage.js's
// buildPodiumStageProfile.

import { PODIUM_STAGE_TARGET_TRANSFORM } from './podiumStage.js'

// --- placement ---------------------------------------------------------------
// Stood just west of the Target podium's own footprint (data/podiumStage.js
// PODIUM_STAGE_TARGET_TRANSFORM/PODIUM_STAGE_TARGET_AABBS), near its front
// (stair) side so a player walking up from spawn (data/hub.js SPAWN, z = 3)
// sees both at once. The Target podium's world AABB at its current transform
// is x: [-0.40, 27.55], z: [15.45, 36.25] (computed from
// PODIUM_STAGE_TARGET_AABBS) — this board's own footprint (BOARD_WIDTH plus
// clearance below) sits at x centre -5.4, roughly 5 m clear of that box's
// west edge, checked against every set in data/hub.js's HUB_AABBS with none
// overlapping. Re-run that same clearance check after moving this or
// resizing the Target podium.
//
// `yaw` matches PODIUM_STAGE_TARGET_TRANSFORM's own (Math.PI): this prop's
// local +Z front (where the panel/text face) is rotated to look back toward
// -Z, the same direction the Target podium's own front/stairs face — both
// readable by a player approaching from spawn's lower z.
export const LEADERBOARD_TRANSFORM = {
  x: -5.4,
  y: 0,
  z: 20,
  yaw: PODIUM_STAGE_TARGET_TRANSFORM.yaw,
}

// --- palette -------------------------------------------------------------
export const LEADERBOARD_COLORS = {
  frame: '#8a5423', // brown Lego-brick board, stud-textured
  panel: '#5c3a1c', // dark inset the text sits on
  panelStripeA: '#67421f', // faint alternating row banding
  panelStripeB: '#5c3a1c',
  titleColor: '#ffe600',
  timerChip: '#1c1108',
  timerGlow: '#ffffff',
}

// --- title -----------------------------------------------------------------
// Customizable: any string works, it word-wraps to the panel's own width
// (components/LeaderboardBoard.jsx's <Text> maxWidth/whiteSpace).
export const LEADERBOARD_TITLE = 'Top Power'
export const TITLE_FONT_SIZE = 0.85

// --- rows --------------------------------------------------------------------
// Customizable: add, remove or edit entries freely — BOARD_HEIGHT (below)
// grows or shrinks with this array's own length, so the panel/frame/legs
// always fit however many rows are here. `score` is already-formatted
// display text (not a number), so any notation (Qi/Qa/sci-notation/plain)
// works unchanged.
export const LEADERBOARD_ENTRIES = [
  { rank: 1, name: 'FrostSpnFan22', score: '126.1Qi', rankColor: '#ffe600', scoreColor: '#33d6ff' },
  { rank: 2, name: 'BINI79love', score: '9.34Qi', rankColor: '#b98cff', scoreColor: '#33d6ff' },
  { rank: 3, name: 'eunyulbabo123', score: '9.328Qi', rankColor: '#ff9a3b', scoreColor: '#33d6ff' },
  { rank: 4, name: 'BINI1012love', score: '1.578Qi', rankColor: '#ffe600', scoreColor: '#33d6ff' },
  { rank: 5, name: 'cheesesticksmang', score: '1.189Qi', rankColor: '#ffe600', scoreColor: '#33d6ff' },
  { rank: 6, name: 'AntacidGibbon94', score: '1.016Qi', rankColor: '#ffe600', scoreColor: '#33d6ff' },
  { rank: 7, name: 'sopermanghh', score: '786.7Qa', rankColor: '#ffe600', scoreColor: '#ff5050' },
  { rank: 8, name: 'AlexTakenLool', score: '704.2Qa', rankColor: '#ffe600', scoreColor: '#ff5050' },
]
export const ENTRY_NAME_COLOR = '#ffffff'
export const ROW_FONT_SIZE = 0.34 // rank + score column font size
export const ROW_HEIGHT = 0.62 // vertical pitch between successive rows

// Column anchors, in from the panel's own left/right edge (drei <Text>
// anchorX="left"/"right" — components/LeaderboardBoard.jsx's Row). The name
// column sits between the rank and score columns; since player names are
// free text of arbitrary length (unlike the fixed-width rank/score strings),
// it's the one column whose font size flexes per row (see nameFontSize
// below) rather than a fixed size that a long name could run past.
const RANK_TEXT_INSET = 0.32
const NAME_TEXT_INSET = 0.85
const SCORE_TEXT_INSET = 0.32
const COLUMN_GAP = 0.15 // minimum clear space between the name and score columns
const MIN_NAME_FONT_SIZE = 0.14 // floor so a pathologically long name still renders, just small

// Rough average glyph advance width for a bold sans font, as a fraction of
// fontSize — not exact per-character metrics (troika-three-text/drei's Text
// only reports real measured width after a render pass, too late for a
// layout computed here in data/), just close enough to size the name column
// so ordinary usernames render at ROW_FONT_SIZE and only unusually long ones
// scale down.
const CHAR_WIDTH_FACTOR = 0.58
function estimateTextWidth(text, fontSize) {
  return text.length * fontSize * CHAR_WIDTH_FACTOR
}

// --- footer timer chip -----------------------------------------------------
// Cosmetic, static label (not a live countdown) — matching the reference
// image's "101s" strip. Free to edit like the title/entries above.
export const LEADERBOARD_TIMER_TEXT = '101s'
export const TIMER_FONT_SIZE = 0.4

// --- board shape -------------------------------------------------------------
// Local space: origin at ground level, centred on X, +Z the readable front
// face — same convention as data/podiumStage.js.
export const BOARD_WIDTH = 8 // metres, the brown frame's full width
export const BOARD_THICKNESS = 0.3
export const LEG_HEIGHT = 1.6 // ground clearance under the frame's bottom edge
export const LEG_SECTION = 0.4 // each support post's square cross-section
export const LEG_INSET = 0.55 // each post's X offset in from the frame's own edge

// Dark inset panel the title/rows sit on, proud of the frame's front face.
export const PANEL_INSET_X = 0.35 // margin from the frame's left/right edge
export const PANEL_INSET_TOP = 0.45
export const PANEL_INSET_BOTTOM = 0.35
export const PANEL_THICKNESS = 0.08
export const PANEL_WIDTH = BOARD_WIDTH - 2 * PANEL_INSET_X

// Same checker-cell pitch idea as data/pvpCenterPentagon.js's
// PVP_CENTER_PENTAGON_CELL, just sized for this much smaller prop.
export const BOARD_STUD_CELL = 0.5

// Two knob studs poking above the frame's top edge (the reference image's
// pair of corner lugs) and two flat tabs at mid-height on the sides (the
// image's side notches) — decorative only, no collider (same precedent as
// data/pvpCenterPentagon.js's summit shell/disc: renders, stays walk-through).
export const CORNER_STUD_RADIUS = 0.34
export const CORNER_STUD_HEIGHT = 0.32
export const CORNER_STUD_INSET = 0.75 // from each side edge
export const SIDE_TAB_WIDTH = 0.28 // how far it pokes out past the frame edge
export const SIDE_TAB_HEIGHT = 1.1
export const SIDE_TAB_DEPTH = BOARD_THICKNESS * 0.85

// --- vertical layout ---------------------------------------------------------
// Reserved vertical space per section, top to bottom: a top margin, the
// title, one line per LEADERBOARD_ENTRIES row, a gap, then the timer chip and
// a bottom margin. PANEL_HEIGHT is the sum of all of it, so BOARD_HEIGHT (and
// every mesh built from it — FrameBoard/Legs/Trim/Panel in components/
// LeaderboardBoard.jsx) auto-fits whatever LEADERBOARD_ENTRIES holds, and
// TITLE_Y/ROW_YS/TIMER_Y (also below) can never overlap by construction: each
// section's own block reserves exactly the room the one after it starts from.
const TOP_PADDING = 0.35
const BOTTOM_PADDING = 0.3
const TITLE_BLOCK = TITLE_FONT_SIZE * 1.35
const TIMER_GAP = 0.25 // clear space between the last row and the timer chip
const TIMER_BLOCK = TIMER_FONT_SIZE * 1.8 + 0.25 // chip height + its own margin

export const PANEL_HEIGHT =
  TOP_PADDING +
  TITLE_BLOCK +
  ROW_HEIGHT * LEADERBOARD_ENTRIES.length +
  TIMER_GAP +
  TIMER_BLOCK +
  BOTTOM_PADDING
export const BOARD_HEIGHT = PANEL_HEIGHT + PANEL_INSET_TOP + PANEL_INSET_BOTTOM

// Ground-relative Y (the mount group's own origin sits at y = 0, ground
// level — ties into data/leaderboardBoard.js's own local-space convention
// above LEADERBOARD_TRANSFORM.y = 0, not a fresh one).
export const BOARD_BOTTOM = LEG_HEIGHT
export const BOARD_TOP = BOARD_BOTTOM + BOARD_HEIGHT
export const BOARD_CENTER_Y = BOARD_BOTTOM + BOARD_HEIGHT / 2
const PANEL_BOTTOM = BOARD_BOTTOM + PANEL_INSET_BOTTOM
const PANEL_TOP = PANEL_BOTTOM + PANEL_HEIGHT
export const PANEL_CENTER_Y = PANEL_BOTTOM + PANEL_HEIGHT / 2

export const TITLE_Y = PANEL_TOP - TOP_PADDING - TITLE_FONT_SIZE * 0.55
const ROWS_TOP_Y = PANEL_TOP - TOP_PADDING - TITLE_BLOCK - ROW_HEIGHT / 2
export const ROW_YS = LEADERBOARD_ENTRIES.map((_, i) => ROWS_TOP_Y - i * ROW_HEIGHT)
export const TIMER_Y = PANEL_BOTTOM + BOTTOM_PADDING + TIMER_BLOCK / 2

// --- column layout -----------------------------------------------------------
// Every position a Row (components/LeaderboardBoard.jsx) needs, precomputed
// per entry: the rank/name (anchorX="left") and score (anchorX="right") X
// anchors are fixed, but the name column's own font size is scaled down from
// ROW_FONT_SIZE just enough to keep that entry's own name clear of the score
// column by COLUMN_GAP — computed per row (not once for the whole board) so
// one long name never shrinks every other row's name to match.
export const RANK_TEXT_X = -PANEL_WIDTH / 2 + RANK_TEXT_INSET
export const NAME_TEXT_X = -PANEL_WIDTH / 2 + NAME_TEXT_INSET
export const SCORE_TEXT_X = PANEL_WIDTH / 2 - SCORE_TEXT_INSET

export const LEADERBOARD_ROWS = LEADERBOARD_ENTRIES.map((entry, i) => {
  const scoreWidth = estimateTextWidth(entry.score, ROW_FONT_SIZE)
  const scoreLeftEdge = SCORE_TEXT_X - scoreWidth
  const availableNameWidth = scoreLeftEdge - COLUMN_GAP - NAME_TEXT_X
  const nameWidthAtRowFont = estimateTextWidth(entry.name, ROW_FONT_SIZE)
  const nameFontSize =
    nameWidthAtRowFont <= availableNameWidth
      ? ROW_FONT_SIZE
      : Math.max(MIN_NAME_FONT_SIZE, ROW_FONT_SIZE * (availableNameWidth / nameWidthAtRowFont))
  return { ...entry, y: ROW_YS[i], nameFontSize }
})
