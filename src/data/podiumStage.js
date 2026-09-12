// Data for the code-generated `podium_stage` prop — a wooden tiered display
// stage with real climbable side staircases and a neon "POWER" sign
// (Tech.md §4: every tunable number lives here, never in a component).
//
// This is the code-generated counterpart to the Blender-authored
// power_podium (data/podium.js, Tech.md §6): same subject, built from the
// tables below by systems/podiumStageModel.js instead of loaded as a glTF,
// the same way data/merchantShop.js drives systems/merchantShopModel.js.
// Nothing here is downloaded — geometry and the wood/sign texture atlas are
// both generated at boot.
//
// Local space: origin at the BASE CENTRE (x = centreline, y = 0 on the
// ground, z = centre of the footprint), +Y up, +Z is the front — the side a
// viewer reads the sign from and the foot of both staircases.
//
// Scale is real-world metres, 1 unit = 1 m (Tech.md §6). The brief's original
// figure for the centre display shelves was 1.5 m wide; each tier's own
// width now lives in TIER_WIDTHS (all four default to 2.25 m, x1.5 the
// brief's figure), and the sign board above the topmost tier is derived from
// that tier's own TIER_WIDTHS entry so it keeps matching rather than sitting
// mismatched with the platform it sits over. The tiered block is now
// 3.35 m wide x 3.1 m deep x ~1.88 m to the top of the sign — depth stays
// fixed regardless of TIER_STEP_COUNTS (see the step-profile section below),
// which only changes how many, and how tall each, of the steps making up
// each tier's own fixed climb are; height moves only with TIER_RISES. The
// first tier (the "First Stage") is deliberately shallow — just a few
// inches at hub scale — so it reads as near the ground, and gets one step
// spanning its whole depth instead of a climb-then-landing group; the two
// tiers above it are unchanged, each a 0.13 m rise on a 0.17 m ordinary
// tread / 0.26 m landing tread, comfortably under the 20 cm / 30 cm walkable
// limit. The staircases themselves project further forward of that block's
// front face — see STAIR_APRON. The flanking staircases (FOOTPRINT.flankWidth
// each) push the *total* width past the display area's own 2.25 m.

// --- placement -----------------------------------------------------------
// World transform of the local model, same shape as merchantShop's
// SHOP_TRANSFORM. yaw is a rotation about +Y in radians; 0 leaves the front
// (+Z) facing +Z.
//
// `scale` defaults to 1 — the model is authored at real-world scale, its own
// step rise/tread sized to be walkable at that scale. Scaling an *instance*
// up (see PODIUM_STAGE_HUB_TRANSFORM below) is a placement decision, not a
// property of the model; past roughly 1.5-2x the steps stop reading (and
// colliding) as climbable stairs, since STEP.rise/tread scale with it too.
export const PODIUM_STAGE_TRANSFORM = {
  x: 0,
  y: 0,
  z: 0,
  yaw: 0,
  scale: 1,
}

// The hub placement: just west of power_podium's footprint (data/podium.js
// POWER_PODIUM_AABBS spans world x 2.47..24.67, z -22.95..-8.71), aligned on
// that podium's own z-centre, facing yaw 0 (+Z) so the sign reads toward the
// road/spawn a player arrives from (data/road.js, data/hub.js SPAWN).
//
// `scale` moved from 1 to 8, so `x` is re-derived from the current footprint
// rather than hand-picked: a 2 m gap off power_podium's west edge
// (x = 2.4728164970874786 - 2 - TOTAL_WIDTH/2*scale). TIER_STEP_COUNTS (the
// step count) can change freely without touching this block — TOTAL_WIDTH
// and TOTAL_DEPTH no longer move with it (see the step-profile section
// below) — but re-run the overlap check (build PODIUM_STAGE_HUB_AABBS, test
// its enclosing box against every import in data/hub.js) after changing
// `scale`, TIER_RISES, TIER_DEPTHS, TIER_WIDTHS, or FOOTPRINT.flankWidth,
// since those still resize it.
//
// `scale` is 5.5, not 7: adding a 4th tier grew TOTAL_DEPTH from ~2.59 m to
// ~4.32 m, and at scale 7 the object's now-much-deeper south edge (z, since
// yaw 0 runs the depth along world -Z here) ran into a grass patch south of
// power_podium (data/grassBlocks.js) that the shallower 3-tier version
// cleared comfortably. 5.5 is the largest scale that still clears every
// neighbouring AABB set (power_podium, target_podium, the grass blocks/
// cubes, the walls, the merchant shop) with the same 2 m gap off
// power_podium's west edge.
export const PODIUM_STAGE_HUB_TRANSFORM = {
  x: -8.739683502912522,
  y: 0,
  z: -15.831555366516113,
  yaw: 0,
  scale: 5.5,
}

// --- step profile --------------------------------------------------------
// TIER_RISES/TIER_DEPTHS are the fixed design target for each tier's own
// climb — unchanged since this prop was first authored, except that neither
// the rise nor the depth is the same for every tier any more: TIER_RISES[0]
// (the "First Stage", frontmost and lowest) is just a few inches of actual
// rise — near the ground, meant to be stepped onto directly — while the
// tiers above it keep their original height; TIER_DEPTHS[3] (the topmost,
// now a "4th tier") is a shallower ledge than the ones below it. TIER_STEP_
// COUNTS follows suit: a few-inch rise is too little to subdivide into
// "climb, then a landing" the way the taller tiers above it are
// (LANDING_FACTOR alone needs more room than that), so tier 0 gets a single
// step that simply IS the landing, while tiers 1-3 keep the fuller
// 2-steps-then-a-wider-landing group. Step count (TIER_STEP_COUNTS) is still
// an independent knob per tier (Tech.md §4): changing it can never move
// TOP_Y, STAIR_DEPTH, TOTAL_DEPTH or TOTAL_WIDTH — only TIER_RISES/
// TIER_DEPTHS (or the length of TIER_RISES) do that. Every height in the
// model is still a whole number of RISEs and every depth a whole number of
// TREADs, so the side staircases land exactly on the centre tiers' ledges by
// construction — that now holds tier by tier (see riseOf/CUM_RISE and
// normalTreadOf/CUM_DEPTH below), not uniformly. Adding tier 3 here is
// exactly this: one more entry in each of TIER_RISES/TIER_STEP_COUNTS/
// TIER_DEPTHS below — everything downstream (CUM_RISE, CUM_DEPTH,
// STEP_TIER/STEP_POS, TOP_Y, STAIR_DEPTH, TOTAL_DEPTH, the centre-tier and
// flank-step loops in podiumStageModel.js) already iterates over `TIERS`
// (= TIER_RISES.length), so nothing else needed to change to grow a tier.
export const TIER_RISES = [0.04, 0.4, 0.4, 0.4] // first stage a few inches at hub scale, rest unchanged
// Every climbing tier's group (1-3) matches — 6 steps, the same fine tread
// size throughout the climb. Tier 0 stays a single step: at its
// TIER_RISES[0] (a few inches), 6 sub-steps would each rise ~0.007 m —
// under normalTreadOf's own CAP.thickness (0.028 m), which would invert the
// tread-cap box (podiumStageModel.js `walkable()`) into a degenerate,
// negative-height slab. One step is the most this tier's own height
// structurally supports; it was already the requested "near ground, step
// directly onto it" treatment, so it is left as is.
export const TIER_STEP_COUNTS = [1, 6, 6, 6] // steps in each tier's own group

// Width of each tier's own centre shelf, per tier (X-axis) — the same
// per-tier pattern as TIER_RISES/TIER_DEPTHS/TIER_STEP_COUNTS above, so each
// tier can be a different width, not just a different height/depth. All four
// default to 2.25 (the shared width every tier had before this existed —
// see FOOTPRINT.centreWidth's old comment: "1.5m x 1.5, increase middle area
// width by x1.5"), so nothing changes visually until one is edited.
// STAIR width (the flank strip) hugs whatever TIER_WIDTHS[k] a given step's
// own tier is (see flankSpan below) — same span as the flank always is, just
// anchored to that tier's own edge instead of one shared width, so a
// narrower or wider tier never leaves a gap or overhang next to its steps.
export const TIER_WIDTHS = [2.25, 2.25, 2.25, 2.25]

// Tread is uniform WITHIN a tier's own group of steps EXCEPT for the last
// step, the landing a climber arrives at: it reads as a landing (a wider
// resting point, not just another stair) by being LANDING_FACTOR times
// deeper than the others. The ordinary steps in that group shrink just
// enough that the whole group's run still sums to exactly TIER_DEPTHS[k], so
// the landing lines up, in both height AND depth, with the tier it borders. A
// tier whose own TIER_STEP_COUNTS is 1 has no "ordinary" steps at all — the
// formula below still holds, and simplifies to one step spanning the tier's
// full TIER_DEPTHS[k], exactly the "step directly onto it" the first stage
// wants — which does mean tier 0's one step comes out longer than an
// ordinary tread on the tiers above it (their groups split their own tier's
// TIER_DEPTHS[k] across more steps); shrinking just that flank step to match its
// neighbours was tried and reverted — doing so without also shrinking tier
// 0's own centre-tier depth broke the tier 1/2 landing alignment (the flank
// chain and the centre tiers must consume the same depth per tier to stay in
// sync), and shrinking both moved tier 0's own ledge along with it, which
// undid the earlier "middle part unchanged" ask. A depth-neutral fix (a
// second, same-height filler step behind a shorter entry step, keeping tier
// 0's total flank depth at TIER_DEPTHS[0]) is possible but not built yet.
export const LANDING_FACTOR = 1.5

// Walkable ledge depth per tier. Uniform (0.9, itself 1.5x the original 0.6)
// across tiers 0-2 now that there are four tiers; tier 3 (the topmost, "4th
// tier" — this used to be tier 2's job before tier 3 was added) is lowered
// to 0.2x that — 0.18 — a shallower top ledge than the ones below it, PLUS
// the former FOOTPRINT.backDepth (0.4, now 0 — see below) folded straight
// in: the flat landing behind the top tier used to be a separate full-width
// platform bolted on past the last stair; now it's simply more of the
// topmost tier's own depth, so its flank landing step (and the flank's own
// STAIR_DEPTH) reaches exactly as far back as the whole object does, with no
// separate platform strip needed to make up the difference. 0.18 + 0.4 = 0.58.
export const TIER_DEPTHS = [0.6, 1.2, 1.2, 0.9]
export const TIERS = TIER_RISES.length

// Cumulative depth from the front, through the end of tier k — the per-tier
// analogue of CUM_RISE below, needed now that TIER_DEPTHS is no longer
// uniform: tierSpan/STAIR_DEPTH can no longer just multiply by TIERS.
const CUM_DEPTH = (() => {
  const out = []
  let sum = 0
  for (const d of TIER_DEPTHS) {
    sum += d
    out.push(sum)
  }
  return out
})()

// Rise for a step belonging to tier k's group — that tier's own
// TIER_RISES[k] divided across its own TIER_STEP_COUNTS[k], so the first
// stage's one step is exactly as shallow as the stage itself.
function riseOf(k) {
  return TIER_RISES[k] / TIER_STEP_COUNTS[k]
}

// The "ordinary" (non-landing) tread for tier k's group; treadOf below
// makes the last step of the group LANDING_FACTOR times this instead.
function normalTreadOf(k) {
  return TIER_DEPTHS[k] / (TIER_STEP_COUNTS[k] - 1 + LANDING_FACTOR)
}


// Step 6 (tier 1's own landing — the last step of its group): widening it
// beyond its normal LANDING_FACTOR tread extends ITS own front edge forward
// (+Z — toward the viewer, the same direction STAIR_APRON already leans the
// lower steps), not its back edge: everything from tier 1's own back edge on
// (tier 1's centre ledge, tier 2, tier 3, the sign, BACK_Z) stays exactly
// where it always was — only steps 0-5 (in front of step 6) get carried
// forward along with it, each keeping its OWN size unchanged, just
// repositioned. TIER1_LANDING_STEP names its global index, computed rather
// than hardcoded so it stays correct if tier 0 or 1's own step counts change
// again. See STEP_DEPTH_MULT below for how the multiplier is actually
// applied (the same mechanism now works for any step, not just this one).
const TIER1_LANDING_STEP = TIER_STEP_COUNTS[0] + TIER_STEP_COUNTS[1] - 1 // = 6
const TIER1_LANDING_WIDEN_MULT = 4

// Step 12 (tier 2's own landing) — the exact same idea, one tier up:
// widening it extends ITS own front edge forward, carrying every step in
// front of it (0 through 11 — tier 0, all of tier 1 including its own
// widened landing, and tier 2's ordinary steps) forward with it, each
// keeping its own size. Tier 2's own back edge and everything behind it
// (tier 3, the sign, BACK_Z) stay untouched. The two stack: widen both and
// step 12 carries step 6's own forward growth along with it, on top of its
// own.
const TIER2_LANDING_STEP = TIER_STEP_COUNTS[0] + TIER_STEP_COUNTS[1] + TIER_STEP_COUNTS[2] - 1 // = 12
const TIER2_LANDING_WIDEN_MULT = 4

// Cumulative height at the TOP of tier k (i.e. tierSpan(k).top) —
// precompute once since every tier above the first depends on every one
// below it.
const CUM_RISE = (() => {
  const out = []
  let sum = 0
  for (const r of TIER_RISES) {
    sum += r
    out.push(sum)
  }
  return out
})()

// Global step index i -> which tier's group it belongs to, and i's position
// within that group — precomputed once since groups are no longer a fixed
// size, so a step's tier can no longer be found with a single division.
const STEP_TIER = []
const STEP_POS = []
for (let k = 0; k < TIERS; k++) {
  for (let p = 0; p < TIER_STEP_COUNTS[k]; p++) {
    STEP_TIER.push(k)
    STEP_POS.push(p)
  }
}

// --- footprint -----------------------------------------------------------
// Full widths, measured across X. Per-tier centre width now lives in
// TIER_WIDTHS above (was a single centreWidth here); flankWidth is still one
// shared strip width, just anchored to each tier's own edge — see
// flankSpan below.
export const FOOTPRINT = {
  flankWidth: 0.55, // each side staircase, full width — open on the outside,
  // no stringer wall, so every step runs the full flank and is visible and
  // climbable from the side.
  // Was 0.4 (a separate full-width platform behind the top tier); now 0 —
  // that depth is folded into TIER_DEPTHS[2] instead (see the comment
  // there), so the staircase's own STAIR_DEPTH reaches exactly as far back
  // as the whole object (TOTAL_DEPTH) with no separate strip tacked on past
  // it. The back-platform box (collider + model) is skipped when this is 0.
  backDepth: 0,
}

// --- derived dimensions --------------------------------------------------
// Kept here (not in the builder) so the collider and the geometry read the
// exact same numbers. TOP_Y/STAIR_DEPTH/TOTAL_DEPTH/TOTAL_WIDTH are all built
// from TIERS/TIER_RISES/TIER_DEPTHS/FOOTPRINT only — never from
// TIER_STEP_COUNTS — which is what keeps the object's overall silhouette
// fixed no matter how many steps each tier's group asks for.
export const STEPS_PER_FLIGHT = STEP_TIER.length
export const TOP_Y = CUM_RISE[TIERS - 1] // 0.84 m (0.04 + 0.4 + 0.4)
// No STEP_DEPTH_MULT entry is included here: an overridden step's extra
// depth grows that step forward (+Z, toward the viewer), not backward, so
// it never touches how deep the object is from FRONT_Z back to BACK_Z.
// STAIR_DEPTH is exactly the centre tiers' own combined depth, same as if
// no step's depth were ever overridden.
export const STAIR_DEPTH = CUM_DEPTH[TIERS - 1]
// FOOTPRINT.backDepth is 0 (folded into TIER_DEPTHS[2] — see FOOTPRINT
// above), so TOTAL_DEPTH is just STAIR_DEPTH now: the staircase's own Z
// extent IS the whole object's, with no separate back-platform strip
// stretching past it. The + is kept (not simplified away) so this stays
// correct if backDepth is ever reintroduced as a nonzero separate region.
export const TOTAL_DEPTH = STAIR_DEPTH + FOOTPRINT.backDepth
// The widest tier's width, plus a flank strip on each side — used wherever
// a single conservative "how wide is this object" number is needed (hub
// placement/overlap math, the back-platform box). Individual tiers/flanks
// can be narrower than this; none is ever wider, so it stays a safe bound.
const MAX_TIER_WIDTH = Math.max(...TIER_WIDTHS)
export const TOTAL_WIDTH = MAX_TIER_WIDTH + 2 * FOOTPRINT.flankWidth // 2.6 m
// FRONT_Z/BACK_Z bound the centre tiers exactly (TOTAL_DEPTH is already
// override-independent — see STAIR_DEPTH above). The staircases can still
// reach forward of FRONT_Z — STAIR_APRON always could, and now any
// STEP_DEPTH_MULT entry can too — see STEP_SPANS below for how all of these
// are applied as forward shifts on top of this unchanged frame.
export const FRONT_Z = TOTAL_DEPTH / 2
export const BACK_Z = FRONT_Z - TOTAL_DEPTH

// How far the staircase's front projects forward of FRONT_Z, so the flights
// visibly come forward from the tiered block instead of sitting flush with
// its front face. Was FOOTPRINT.backDepth * 0.1 (0.04) — now a plain literal
// of that same value, decoupled from FOOTPRINT.backDepth now that the latter
// is 0 (folded into TIER_DEPTHS[2] instead — see FOOTPRINT above), so this
// forward lean stays exactly what it was rather than silently zeroing out
// alongside it. Positive pushes forward; a negative value here would pull
// the flared steps back instead (toward the centre tiers).
export const STAIR_APRON = 0.04

// How many steps, counting from the ground step, share in that forward
// projection — back to covering the ground step through the tier 1 landing
// (step 6 included), the same span as before "still not the same" pulled it
// back to the ground step alone. Tapering it across several steps means each
// gets a slightly different tread depth from its neighbour (full STAIR_APRON
// right at the ground, fading to none by step 6) rather than a uniform
// block offset — that gradient is deliberate this time, not an oversight.
// Derived from TIER_STEP_COUNTS rather than hardcoded, so it stays correct
// (still ending exactly at the tier 1 landing) if tier 0 or tier 1's own
// step counts change again.
export const STAIR_FLARE_STEPS = TIER_STEP_COUNTS[0] + TIER_STEP_COUNTS[1]

// Tier k (0 = frontmost, lowest) as a local box: its walkable top height and
// the Z span of its ledge, running back from the previous tier's front edge.
// Plain CUM_DEPTH — no per-step depth override (see STEP_DEPTH_MULT below)
// ever touches the centre tiers: each grows its own step forward instead, so
// every tier's own ledge sits exactly where its TIER_DEPTHS entry alone puts
// it, regardless of what any step's own multiplier is set to.
export function tierSpan(k) {
  const z1 = FRONT_Z - (k === 0 ? 0 : CUM_DEPTH[k - 1]) // front edge of this ledge
  return { top: CUM_RISE[k], z0: FRONT_Z - CUM_DEPTH[k], z1 }
}

// The tread depth of step i: normalTreadOf(k) for an ordinary step, deeper
// by LANDING_FACTOR for the last step in its group (the landing) — k and the
// position within the group come from the STEP_TIER/STEP_POS lookup above,
// since groups are no longer all the same size. Deliberately does NOT apply
// any of STEP_DEPTH_MULT — a step's own multiplier is a forward SHIFT
// applied to boundaries in STEP_SPANS below, not a bigger tread here, so it
// grows that step toward +Z instead of pushing every step behind it
// backward. This is each step's PLAIN size, unaffected by any override.
function treadOf(i) {
  const k = STEP_TIER[i]
  const isLanding = STEP_POS[i] === TIER_STEP_COUNTS[k] - 1
  const norm = normalTreadOf(k)
  return isLanding ? norm * LANDING_FACTOR : norm
}

// Per-step depth multiplier: how many times its own plain treadOf() a
// specific step is, applied in STEP_SPANS as a forward shift on every
// boundary from the very front up through that step's own (boundaries 0..i)
// — so every step in front of it is carried forward but keeps its own size
// unchanged, only the overridden step itself absorbs the difference as extra
// depth on its own front edge, and everything from its own back edge on
// (including any tier it happens to be the landing for) is untouched. Key =
// global step index, value = multiplier (1 = no change). Seeded with the two
// named landing multipliers above so they keep working exactly as before —
// add any OTHER step index here (e.g. `3: 1.5` to make step 3 1.5x its own
// depth) to make an ordinary step individually adjustable too; nothing else
// needs to change, STEP_SPANS applies every entry here the same way. Two
// overrides can stack (a later step's shift carries an earlier step's own
// growth forward with it), the same way the two landings already do.
const STEP_DEPTH_MULT = {
  [TIER1_LANDING_STEP]: TIER1_LANDING_WIDEN_MULT,
  [TIER2_LANDING_STEP]: TIER2_LANDING_WIDEN_MULT,
}

// A single multiplier applied to EVERY step at once — still without ever
// touching TIER_DEPTHS/TIER_RISES/TIER_WIDTHS: it's layered under
// STEP_DEPTH_MULT (a step's actual multiplier is ALL_STEPS_DEPTH_MULT times
// whatever STEP_DEPTH_MULT gives it, or just ALL_STEPS_DEPTH_MULT for a step
// with no entry there), and applied through the exact same forward-shift
// mechanism, once per step in STEP_SPANS below — so every step keeps its own
// distinct size (an ordinary tread is still shallower than a landing, a
// TIER_DEPTH_MULT override is still bigger than its siblings), just each
// scaled by the same factor. Because every step's own shift only reaches
// boundaries in front of it, a uniform bump like this telescopes correctly
// toward the front: the object's front edge (step 0) ends up carrying the
// combined extra depth of every step behind it, exactly as it would if you
// physically made each individual stair deeper by that ratio — while every
// tier's own centre ledge and TOTAL_DEPTH/FRONT_Z/BACK_Z stay completely
// untouched, same as any single-step override. 1 = no change.
const ALL_STEPS_DEPTH_MULT = 0.7

// Step i (0 = bottom, at the front) of a flight: solid from the ground to its
// tread, so the box's top face IS the tread quad and its +Z face IS the riser
// quad — what a collider or navmesh bake needs to see. Treads are not all the
// same depth (see treadOf), so a step's Z position can only be found by
// summing every tread before it. Built in four passes:
//  1. the plain chain of BOUNDARIES (one more than there are steps — boundary
//     i is the front face of step i, and also the back face of step i-1),
//     exactly as if no forward projection or overrides existed.
//  2. STAIR_APRON's forward shift on the first STAIR_FLARE_STEPS+1
//     boundaries, tapering linearly from the full STAIR_APRON at boundary 0
//     (the very front of the ground step) down to zero at boundary
//     STAIR_FLARE_STEPS (the back of the last flared step) — so the
//     projection reads as one continuous lean forward across the ground
//     step and the steps just above it, not a lone jut on the ground step
//     alone.
//  3. one flat (not tapered) forward shift per STEP_DEPTH_MULT entry, on
//     boundaries 0 through that entry's own step index — every boundary in
//     a given entry's range gets the exact same shift, so every step in
//     that range keeps its own size, just carried forward, and only the
//     overridden step itself absorbs the difference as extra depth on its
//     own front edge.
//  4. the same flat-shift treatment again, but for EVERY step at once
//     (ALL_STEPS_DEPTH_MULT), skipped entirely when it's 1 (the common
//     case) so it costs nothing when unused.
// Every pass is summed (not replaced) with the others, since each is just a
// forward shift on some range of boundaries, and ranges can overlap (e.g.
// both landings' ranges include boundary 0, and pass 4's range is every
// other pass's range at once). Every shift lands exactly on zero at the
// boundary just past its own range, so every landing (or any other
// overridden step) still lines up with whatever comes right after it
// untouched.
// Precomputed once here rather than on every call, since STEPS_PER_FLIGHT is
// tiny and every caller wants the same numbers.
const STEP_SPANS = (() => {
  const boundary = [FRONT_Z]
  for (let i = 0; i < STEPS_PER_FLIGHT; i++) boundary.push(boundary[i] - treadOf(i))

  const apronSteps = Math.min(STAIR_FLARE_STEPS, STEPS_PER_FLIGHT)
  for (let j = 0; j <= apronSteps; j++) {
    boundary[j] += (STAIR_APRON * (apronSteps - j)) / apronSteps
  }

  for (const [stepStr, mult] of Object.entries(STEP_DEPTH_MULT)) {
    const step = Number(stepStr)
    const extra = treadOf(step) * (mult - 1)
    for (let j = 0; j <= step; j++) boundary[j] += extra
  }

  if (ALL_STEPS_DEPTH_MULT !== 1) {
    for (let step = 0; step < STEPS_PER_FLIGHT; step++) {
      const extra = treadOf(step) * (ALL_STEPS_DEPTH_MULT - 1)
      for (let j = 0; j <= step; j++) boundary[j] += extra
    }
  }

  const spans = []
  let top = 0
  for (let i = 0; i < STEPS_PER_FLIGHT; i++) {
    top += riseOf(STEP_TIER[i])
    spans.push({ top, z0: boundary[i + 1], z1: boundary[i] })
  }
  return spans
})()

export function stepSpan(i) {
  return STEP_SPANS[i]
}

// Which tier's group step i belongs to — callers (the collider builder here,
// and podiumStageModel.js's stairs loop) use this with flankSpan(k) to find
// the right X span for a given step, since that now varies by tier.
export function tierOfStep(i) {
  return STEP_TIER[i]
}

// X span of the right-hand flank for tier k's own steps; the left flank is
// its mirror (negated). Anchored to that tier's own TIER_WIDTHS[k] — not one
// shared width — so the flank always hugs its tier's edge exactly, whatever
// that tier's own width is: no gap if a tier is narrower than its neighbours,
// no overhang if it's wider.
export function flankSpan(k) {
  const x0 = TIER_WIDTHS[k] / 2
  return { x0, x1: x0 + FOOTPRINT.flankWidth }
}

// --- trim ----------------------------------------------------------------
// The raised frame around each sheer riser panel and the lip inlay around
// each tread, both straight from the reference: a proud border a couple of
// centimetres thick, the panel reading as recessed inside it.
export const TRIM = {
  // Every walkable surface (stair tread, tier ledge, back platform) gets a
  // thin lighter-oak cap slab occupying the top of its solid block, so treads
  // read as oak boards over walnut risers without needing a second material.
  // `overhang` keeps the cap's sides off the block's, so the two boxes never
  // end up with coplanar faces; `nosing` is the tread's front lip.
  cap: { thickness: 0.028, overhang: 0.004, nosing: 0.012 },
  frameWidth: 0.07, // border strip width on a riser face
  frameProud: 0.022, // how far it stands off the riser
  lipWidth: 0.06, // border strip width on a tread top
  lipProud: 0.018, // how far it stands above the tread
  // The small ribbed nub centred on each climbing tier's riser (every tier
  // but the near-ground first stage — see TIERS in the step-profile section).
  nub: { width: 0.26, ribs: 3, ribHeight: 0.045, proud: 0.05, onTiers: [1, 2, 3] },
}

// --- sign ----------------------------------------------------------------
// Backboard on two posts at the rear centre of the top platform, face square
// to +Z. The glowing neon frame, the word POWER and the two star bursts are
// all baked into the sign region of the texture atlas and drawn unlit
// (Tech.md §7: no postprocessing — "glow" is an unlit bright surface, the
// same trick the laser beam uses), so there is no alpha and no extra
// geometry for the glow.
export const SIGN = {
  postHeight: 0.5,
  postSection: 0.055,
  // Board spans the same width as the tier it actually stands on — the
  // topmost one, TIER_WIDTHS[TIERS - 1] (board and posts scale with that,
  // not a separate literal, so widening/narrowing that tier widens/narrows
  // the sign to match instead of leaving it mismatched with the platform it
  // sits over).
  boardWidth: TIER_WIDTHS[TIERS - 1],
  postSpread: TIER_WIDTHS[TIERS - 1] / 3, // +/- X of the two posts
  boardHeight: 0.5,
  boardThickness: 0.06,
  faceInset: 0.004, // the unlit quad, proud of the board face
  capHeight: 0.04, // brushed-metal cap along the board's top edge
  capOverhang: 0.03,
  z: BACK_Z + 0.2, // centre of the board in Z, over the back platform
}
export const SIGN_TEXT = 'POWER'

// --- material / texture --------------------------------------------------
// ONE 1024^2 canvas atlas for the whole prop (systems/podiumStageAtlas.js),
// which is what keeps the model at two draw calls: the wood (Lambert, lit)
// and the sign face (Basic, unlit). Regions are in pixels; `grainMetres` is
// how much surface one full pass of a wood region covers, which is what keeps
// the grain the same physical size on a 2.6 m platform and a 7 cm trim strip.
export const ATLAS = {
  size: 1024,
  padding: 6, // px inset per region, so mips do not bleed across regions
  grainMetres: 1.2,
  regions: {
    oak: [0, 0, 512, 512], // medium oak: treads, platform, large panels
    walnut: [512, 0, 512, 512], // darker walnut: risers, ribs, stringers
    sign: [0, 512, 768, 256], // unique, non-tiling: the neon sign face
    metal: [768, 512, 256, 256], // brushed cap on the sign board
    trim: [0, 768, 256, 256], // dark trim: frames, lips, posts
  },
}

// Palette the atlas is painted from (sRGB hex).
export const PODIUM_STAGE_COLORS = {
  oakBase: '#b07b45',
  oakGrain: '#96632f',
  oakLight: '#c69161',
  walnutBase: '#8a5526',
  walnutGrain: '#6d3f1a',
  walnutLight: '#a36a34',
  trimBase: '#6b421d',
  trimGrain: '#54320f',
  metalBase: '#8f949b',
  metalGrain: '#b6bbc2',
  signBase: '#2b1a0e', // dark brown/black sign ground
  signNeon: '#ffffff', // emissive outline border
  signGlow: '#ffe9b8', // warm falloff just inside/outside the border
  signInk: '#f4f6f8', // POWER lettering
  starRed: '#e02334',
  starHot: '#ffd166',
}

// The wood mesh is lit (Lambert); the sign face is unlit (Basic) and must not
// be tone-mapped, or the "neon" reads as dull cream instead of glowing.
export const SIGN_FACE_TONE_MAPPED = false

// --- collider ------------------------------------------------------------
// The stage is walked ON, not around, so the collider is the real stepped
// profile, not one enclosing box: every stair step, every centre tier and the
// back platform, each solid from the ground to its own top (Tech.md §5.2 —
// the kinematic capsule scans a flat AABB list). These boxes are generated
// from the same spans the geometry uses, so they cannot drift from it.
function worldBox(t, x0, x1, y1, z0, z1) {
  const cos = Math.cos(t.yaw)
  const sin = Math.sin(t.yaw)
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const lx of [x0, x1]) {
    for (const lz of [z0, z1]) {
      for (const ly of [0, y1]) {
        const sx = lx * t.scale
        const sy = ly * t.scale
        const sz = lz * t.scale
        const p = [t.x + sx * cos + sz * sin, t.y + sy, t.z - sx * sin + sz * cos]
        for (let i = 0; i < 3; i++) {
          if (p[i] < min[i]) min[i] = p[i]
          if (p[i] > max[i]) max[i] = p[i]
        }
      }
    }
  }
  return {
    min: { x: min[0], y: min[1], z: min[2] },
    max: { x: max[0], y: max[1], z: max[2] },
  }
}

export function buildPodiumStageAabbs(t = PODIUM_STAGE_TRANSFORM) {
  const out = []
  // both staircases, step by step — each using its own tier's flank span
  // (flankSpan), since TIER_WIDTHS (and so the flank position) can now
  // differ per tier.
  for (let i = 0; i < STEPS_PER_FLIGHT; i++) {
    const s = stepSpan(i)
    const f = flankSpan(tierOfStep(i))
    out.push(worldBox(t, f.x0, f.x1, s.top, s.z0, s.z1))
    out.push(worldBox(t, -f.x1, -f.x0, s.top, s.z0, s.z1))
  }
  // the centre tiers (TIERS of them), each its own TIER_WIDTHS[k]
  for (let k = 0; k < TIERS; k++) {
    const c = tierSpan(k)
    const halfWidth = TIER_WIDTHS[k] / 2
    out.push(worldBox(t, -halfWidth, halfWidth, c.top, c.z0, c.z1))
  }
  // full-width (MAX_TIER_WIDTH-based) back platform — skipped when
  // FOOTPRINT.backDepth is 0 (folded into TIER_DEPTHS[TIERS-1] instead),
  // since a zero-depth box is degenerate: the flank's top-tier landing step
  // and that tier's own centre-tier box already cover that depth between
  // them.
  if (FOOTPRINT.backDepth > 0) {
    out.push(
      worldBox(t, -TOTAL_WIDTH / 2, TOTAL_WIDTH / 2, TOP_Y, BACK_Z, BACK_Z + FOOTPRINT.backDepth),
    )
  }
  return out
}

export const PODIUM_STAGE_AABBS = buildPodiumStageAabbs()
// The collider for the actual hub placement — data/hub.js spreads this into
// HUB_AABBS, the same way POWER_PODIUM_AABBS and MERCHANT_SHOP_AABBS are.
export const PODIUM_STAGE_HUB_AABBS = buildPodiumStageAabbs(PODIUM_STAGE_HUB_TRANSFORM)
