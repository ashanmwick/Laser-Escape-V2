// Data for the code-generated `leaderboard_board` prop — a freestanding
// Lego-brick-styled scoreboard (title + a ranked player/score list), the
// same "fully code-generated, nothing downloaded" recipe as data/
// pvpCenterPentagon.js and data/targetGroundMat.js: built at boot by
// components/LeaderboardBoard.jsx from the tables below, reusing systems/
// studTexture.js's stud checker for the brown board face so it reads as the
// same brick material as Ground.jsx/PvpCenterPentagon.jsx rather than a new
// one-off texture.
//
// Each board is a live, real leaderboard — every currently-connected player
// (local + remote, via systems/net.js's getLeaderboard(), fed by the
// Colyseus room's shared PlayerState.power/rebirth/wins — see Server/src/
// rooms/schema/ArenaState.ts) ranked highest-first on whichever store field
// its own `stat` names — rather than a hardcoded roster. The thing the brief
// called out as needing to be edited without touching any component code is
// each LEADERBOARD_TRANSFORMS entry's own `title`/`stat` pair below. The
// board's own physical size is deliberately fixed (FIXED_ROW_SLOTS, in the
// row section below) rather than growing/shrinking with how many players are
// actually connected right now — up to that many ranked rows draw, top-
// aligned, any unused slots just stay empty. TITLE_Y/ROW_YS/TIMER_Y still
// recompute off that fixed size, the same "component just mounts what data/
// computed" split as data/podiumStage.js's buildPodiumStageProfile.

import { PODIUM_STAGE_TARGET_TRANSFORM } from './podiumStage.js'

// --- placement ---------------------------------------------------------------
// Three boards, one component (components/LeaderboardBoard.jsx takes
// `transform`/`title`/`stat` props, App.jsx mounts one instance per entry
// here, same "one component, several placements" pattern as data/
// podiumStage.js's PODIUM_STAGE_HUB_TRANSFORM/PODIUM_STAGE_TARGET_TRANSFORM),
// fanned into the open corridor west of the Target podium:
//
//                      (mound)   B3-north
//                        |      /
//                        |     /
//                        |  existing --- Target podium
//                        |     \
//                        |      \
//                      (mound)   B2-south
//
// `existing` (the original board, unmoved) sits at the corridor's own centre.
// The Target podium's world AABB at its current transform is x: [-0.40,
// 27.55], z: [15.45, 36.25]; the grass-mound hillside immediately west of the
// corridor is x: [-35.35, -21.08], z: [13.17, 56.64] (both from data/hub.js's
// HUB_AABBS/GRASS_BLOCK_AABBS) — together they bound a ~20.7 m-wide, 40+ m-
// long clear strip. At the current BOARD_WIDTH (7 m), three boards side by
// side along X would need ~21 m and no longer fit that strip alongside the
// podium, so B2/B3 sit further west AND offset along Z instead (one south,
// one north of `existing`), each nudged a few degrees back toward the
// podium/approach side (`yaw`s a little short of Math.PI) for a shallow fan
// rather than a flat wall of boards. Checked with a padded oriented bounding
// box (half BOARD_WIDTH + 0.3 m, half depth 0.5 m — covers the corner studs/
// side tabs) against every set in data/hub.js's HUB_AABBS, the mound, the
// Target podium and each other: zero overlaps, ~1 m+ clearance on every side.
// Re-run that same check after moving any of these, or after changing
// BOARD_WIDTH/LEG_HEIGHT/CORNER_STUD_INSET/SIDE_TAB_WIDTH enough to grow the
// padded footprint past what was checked.
// `title` and `stat` travel with each transform (rather than separate
// parallel arrays) so a board's placement, heading and which store/
// useGameStore.js field it reads stay one edit instead of three —
// components/LeaderboardBoard.jsx reads all three off the same object via
// its `transform`/`title`/`stat` props. `stat` must be a key useGameStore
// actually has (`power`, `rebirth`, `wins`, ...); the component reads it as
// `useGameStore((s) => s[stat])`.
export const LEADERBOARD_TRANSFORMS = [
  { x: -3.4, y: 0, z: 25, yaw: PODIUM_STAGE_TARGET_TRANSFORM.yaw + 0.7, title: 'Top Rebirth', stat: 'rebirth' },
  { x: -18, y: 0, z: 25, yaw: PODIUM_STAGE_TARGET_TRANSFORM.yaw - 0.5, title: 'Top Power', stat: 'power' },
  { x: -10.5, y: 0, z: 27, yaw: PODIUM_STAGE_TARGET_TRANSFORM.yaw, title: 'Top Wins', stat: 'wins' },
]
// Kept as the single default transform (components/LeaderboardBoard.jsx's own
// default prop) — the first entry above, unchanged from before this became a
// list.
export const LEADERBOARD_TRANSFORM = LEADERBOARD_TRANSFORMS[0]

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
// Per-board titles now live on each LEADERBOARD_TRANSFORMS entry's own
// `title` field (see the placement section above) — any string works, it
// word-wraps to the panel's own width (components/LeaderboardBoard.jsx's
// <Text> maxWidth/whiteSpace). LEADERBOARD_TITLE is kept only as components/
// LeaderboardBoard.jsx's default `title` prop, so a bare <LeaderboardBoard />
// still renders something sensible.
export const LEADERBOARD_TITLE = LEADERBOARD_TRANSFORMS[0].title
export const TITLE_FONT_SIZE = 0.85

// --- rows (real players, live) ------------------------------------------
// Up to FIXED_ROW_SLOTS rows per board, one per currently-connected player
// (systems/net.js getLeaderboard()), ranked #1 highest-first. Colors/sizing
// stay here (data/ owns presentation, Tech.md §4); the actual name/stat
// values are live and can only be read at render time, so components/
// LeaderboardBoard.jsx supplies them to getRowLayout() (below) each frame
// the roster or a stat changes.
//
// Rank color follows the reference image's own scheme (gold/purple/orange
// for the top 3, yellow past that); score stays one color for every rank —
// simpler, and still matches most of the reference image's own rows.
const RANK_COLORS = { 1: '#ffe600', 2: '#b98cff', 3: '#ff9a3b' }
const DEFAULT_RANK_COLOR = '#ffe600'
export function rankColorFor(rank) {
  return RANK_COLORS[rank] || DEFAULT_RANK_COLOR
}
export const PLAYER_ROW_SCORE_COLOR = '#33d6ff'
export const ENTRY_NAME_COLOR = '#ffffff'
export const ROW_FONT_SIZE = 0.34 // rank + score column font size
export const ROW_HEIGHT = 0.62 // reserved vertical room per row

// The board's own physical size stays fixed regardless of how many players
// are actually connected right now. FIXED_ROW_SLOTS is a sizing-only knob:
// PANEL_HEIGHT/BOARD_HEIGHT below are computed as if this many rows always
// filled the panel — matching the board's original size from when it held a
// hardcoded 8-entry roster — even on a night with only 1 or 2 players
// online. Raise/lower this to resize the board (and the leaderboard's own
// cutoff — see systems/net.js's getLeaderboard(stat, limit) call site).
export const FIXED_ROW_SLOTS = 8

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
export const BOARD_WIDTH = 7 // metres, the brown frame's full width
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
// title, a rows band sized for FIXED_ROW_SLOTS rows (so the board's own size
// never depends on how many players are actually connected), a gap, then the
// timer chip and a bottom margin. PANEL_HEIGHT is the sum of all of it, so
// BOARD_HEIGHT (and every mesh built from it — FrameBoard/Legs/Trim/Panel in
// components/LeaderboardBoard.jsx) stays fixed. ROW_YS lists each slot's own
// Y, top-aligned (rank 1 at the top) — a board with fewer players connected
// than FIXED_ROW_SLOTS just leaves the remaining slots undrawn, rather than
// re-centring what is drawn. TITLE_Y/ROW_YS/TIMER_Y can never overlap by
// construction: each section's own block reserves exactly the room the one
// after it starts from.
const TOP_PADDING = 0.35
const BOTTOM_PADDING = 0.3
const TITLE_BLOCK = TITLE_FONT_SIZE * 1.35
const TIMER_GAP = 0.25 // clear space between the rows band and the timer chip
const TIMER_BLOCK = TIMER_FONT_SIZE * 1.8 + 0.25 // chip height + its own margin
const ROWS_BAND_HEIGHT = ROW_HEIGHT * FIXED_ROW_SLOTS

export const PANEL_HEIGHT =
  TOP_PADDING + TITLE_BLOCK + ROWS_BAND_HEIGHT + TIMER_GAP + TIMER_BLOCK + BOTTOM_PADDING
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
const ROWS_BAND_TOP = PANEL_TOP - TOP_PADDING - TITLE_BLOCK
export const ROW_YS = Array.from(
  { length: FIXED_ROW_SLOTS },
  (_, i) => ROWS_BAND_TOP - ROW_HEIGHT / 2 - i * ROW_HEIGHT,
)
export const TIMER_Y = PANEL_BOTTOM + BOTTOM_PADDING + TIMER_BLOCK / 2

// --- column layout -----------------------------------------------------------
// X anchors a Row (components/LeaderboardBoard.jsx) needs: the rank/name
// (anchorX="left") and score (anchorX="right") columns are fixed, but the
// name column's own font size flexes — see getRowLayout below.
export const RANK_TEXT_X = -PANEL_WIDTH / 2 + RANK_TEXT_INSET
export const NAME_TEXT_X = -PANEL_WIDTH / 2 + NAME_TEXT_INSET
export const SCORE_TEXT_X = PANEL_WIDTH / 2 - SCORE_TEXT_INSET

// Computes the two things that depend on LIVE data rather than a fixed
// table: `y` (which of the FIXED_ROW_SLOTS positions this row's own rank
// sits at) and the name column's own font size, scaled down from
// ROW_FONT_SIZE just enough to keep it clear of the score column by
// COLUMN_GAP (same idea the old per-entry table used, just called at render
// time now instead of once at module load — components/LeaderboardBoard.jsx
// calls this once per row, each time the roster or a stat changes, not per
// frame). Pure function of its arguments, no store/React import here (data/
// stays framework-free, Tech.md §4).
export function getRowLayout(rank, name, scoreText) {
  const scoreWidth = estimateTextWidth(scoreText, ROW_FONT_SIZE)
  const scoreLeftEdge = SCORE_TEXT_X - scoreWidth
  const availableNameWidth = scoreLeftEdge - COLUMN_GAP - NAME_TEXT_X
  const nameWidthAtRowFont = estimateTextWidth(name, ROW_FONT_SIZE)
  const nameFontSize =
    nameWidthAtRowFont <= availableNameWidth
      ? ROW_FONT_SIZE
      : Math.max(MIN_NAME_FONT_SIZE, ROW_FONT_SIZE * (availableNameWidth / nameWidthAtRowFont))
  return { y: ROW_YS[rank - 1], nameFontSize }
}
