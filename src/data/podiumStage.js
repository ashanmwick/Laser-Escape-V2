// Data for the code-generated `podium_stage` prop — a wooden tiered display
// stage with real climbable side staircases and a neon sign
// (Tech.md §4: every tunable number lives here, never in a component).
//
// This started as the code-generated counterpart to the Blender-authored
// power_podium, then also replaced its sibling target_podium (both retired —
// see PODIUM_STAGE_HUB_TRANSFORM / PODIUM_STAGE_TARGET_TRANSFORM below):
// built from the tables here by systems/podiumStageModel.js instead of
// loaded as a glTF, the same way data/merchantShop.js drives systems/
// merchantShopModel.js. Nothing here is downloaded — geometry and the
// wood/sign texture atlas are both generated at boot.
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
//
// Both hub instances (PODIUM_STAGE_HUB_TRANSFORM "POWER" and PODIUM_STAGE_
// TARGET_TRANSFORM "TARGETS") used to share every one of these numbers, tier
// count included. They no longer do: the tables directly below (TIER_RISES/
// TIER_STEP_COUNTS/TIER_WIDTHS/TIER_DEPTHS) describe the Hub instance's own
// 4-tier shape, and PODIUM_STAGE_PROFILE (see the "tier profile" section
// below) is what actually turns a tier table into everything the geometry/
// collider need — the Target instance now builds from a shorter, 3-tier
// PODIUM_STAGE_TARGET_PROFILE instead, reusing tiers 0-2's own numbers
// unchanged. Every other knob in this file (LANDING_FACTOR, FOOTPRINT,
// STAIR_APRON, TRIM, ATLAS, the palette) is still genuinely shared between
// both instances. ALL_STEPS_DEPTH_MULT is the exception: the Target instance
// has its own independent TARGET_ALL_STEPS_DEPTH_MULT instead (see that
// constant's own comment), the same split as TARGET_TIER_DEPTHS/
// TARGET_TIER_WIDTHS.

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
  scale: 0.8,
}

// The hub placement: dead centre of the now-retired power_podium's own
// footprint (data/podium.js's former POWER_PODIUM_TRANSFORM: x =
// 13.571624755859375, world z = -15.831555366516113), facing yaw 0 (+Z) so
// the sign reads toward the road/spawn a player arrives from (data/road.js,
// data/hub.js SPAWN).
//
// `z` used to be nudged +2.5 m off power_podium's own z (to
// -13.331555366516113): at `scale` 5.5 the object's south edge (z, since
// yaw 0 runs the depth along world -Z here) was deep enough — TOTAL_DEPTH*
// scale, see the step-profile section below — to clip a grass mound
// (data/grassBlocks.js, grass_block_dirt.010) that sat comfortably clear of
// power_podium's own, much shallower footprint. That mound has since been
// re-placed elsewhere in grassBlocks.js (it ended up looming right behind
// the bigger stage regardless), so the nudge is gone too and this sits at
// power_podium's exact old z. Re-check against every import in data/hub.js
// (build PODIUM_STAGE_HUB_AABBS at the candidate z and test its boxes) after
// changing `scale`, TIER_RISES, TIER_DEPTHS, TIER_WIDTHS, or
// FOOTPRINT.flankWidth, since those still resize the footprint — the next
// nearest grass kerb block is only ~5.7 m further back at this z.
//
// `scale` is 5.5, not 7: adding a 4th tier grew TOTAL_DEPTH from ~2.59 m to
// ~3.7 m, and at scale 7 the object's south edge ran into that same grass
// mound by more than the old z-nudge could clear. 5.5 is the largest scale
// that cleared every neighbouring AABB set (target_podium, the grass blocks/
// cubes, the walls, the merchant shop) with only that nudge; unchanged since
// the mound moved elsewhere rather than through this footprint again.
export const PODIUM_STAGE_HUB_TRANSFORM = {
  x: 13.571624755859375,
  y: 0,
  z: -20,
  yaw: 0,
  scale: 6.5,
}

// The target-podium placement: a second instance of this same prop, dead
// centre of the now-retired Blender `target_podium`'s own old footprint
// (former data/podium.js TARGET_PODIUM_TRANSFORM, world [13.571624755859375,
// 0, 17.854000091552734]) — the spot data/targets.js's nine shooting props
// already sit around. yaw is Math.PI (not exactly target_podium's old
// 3.1193714141845703, ~1.3° off — that value was tuned to this model's own
// front convention, which no longer applies) so this model's own front (+Z,
// the sign side) faces back toward -Z, the same direction target_podium's
// stairs faced: spawn (hub.js SPAWN, z = 3) and the old power_podium spot
// both sit at a smaller world Z than this podium, on that side.
//
// This instance now builds from PODIUM_STAGE_TARGET_PROFILE (3 tiers, see
// the "tier profile" section below) rather than the Hub's own 4-tier
// profile — its own TOTAL_DEPTH is tiers 0-2's combined depth alone (still
// less than the Hub's), so at any given `scale` its world-space footprint is
// strictly shallower (and shorter) than the 4-tier version was, centred on
// the same local origin. The 4-tier version was previously checked clear of
// every neighbouring AABB set in data/hub.js (grass blocks/cubes, the walls,
// the merchant shop, the hub instance) at this `x`/`z`/`scale` — since the
// 3-tier footprint's depth/height only shrink from that, symmetrically
// around the same centre, clearance still holds (re-confirmed directly for
// the 3-tier profile too — zero overlaps against every set above). Re-run
// that same check (build PODIUM_STAGE_TARGET_AABBS at the candidate
// transform and test its boxes) after changing `scale` or any of PODIUM_
// STAGE_TARGET_PROFILE's own tier tables, same as PODIUM_STAGE_HUB_
// TRANSFORM's own comment describes.
export const PODIUM_STAGE_TARGET_TRANSFORM = {
  x: 13.571624755859375,
  y: 0,
  z: 25.854000091552734,
  yaw: Math.PI,
  scale: 6.5,
}

// World-space [x, y, z] of the target instance's own mount origin — the same
// shape as the old TARGET_PODIUM_POSITION (data/podium.js, now retired).
export const PODIUM_STAGE_TARGET_POSITION = [
  PODIUM_STAGE_TARGET_TRANSFORM.x,
  PODIUM_STAGE_TARGET_TRANSFORM.y,
  PODIUM_STAGE_TARGET_TRANSFORM.z,
]

// --- step profile (Hub instance's own shape) ------------------------------
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
// normalTreadOf/CUM_DEPTH inside buildPodiumStageProfile below), not
// uniformly.
//
// This is the HUB instance's own shape (4 tiers) — the default profile
// (PODIUM_STAGE_PROFILE below). The TARGET instance builds from a shorter,
// 3-tier profile instead (PODIUM_STAGE_TARGET_PROFILE), reusing tiers 0-2's
// own numbers from these same four arrays.
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
export const TIER_WIDTHS = [3, 3, 3, 3]

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
export const TIER_DEPTHS = [0.6, 0.8, 0.8, 0.9]
export const TIERS = TIER_RISES.length

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
  // Tier indices 2/3 simply never exist on a shorter profile (the Target
  // instance's own 2-tier one), so this list works unchanged for either.
  nub: { width: 0.26, ribs: 3, ribHeight: 0.045, proud: 0.05, onTiers: [1, 2, 3] },
}

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

// The sign artwork is baked into a fixed 768x256 px region — a 3:1 w:h —
// so boardHeight is derived from that ratio (ATLAS.regions.sign, not a
// literal) rather than fixed at a constant: boardWidth tracks whatever width
// the topmost tier ends up (see buildPodiumStageProfile's own `sign` below),
// and stretching that same 3:1 image over a wider-but-not-taller board is
// what squashed the neon frame and warped the two circular star bursts into
// ellipses once TIER_WIDTHS grew. A wider tier now gets a taller sign at the
// same undistorted shape instead. Shared by every profile.
const SIGN_ASPECT = ATLAS.regions.sign[2] / ATLAS.regions.sign[3]

export const SIGN_TEXT = 'POWER'
// The target instance's own sign text (systems/podiumStageAtlas.js bakes one
// atlas per distinct string — see getPodiumStageAtlas). Replaces the old
// Blender-authored target_podium's baked sign panel, TARGET_PODIUM_SIGN_TEXT
// (data/podium.js, now retired).
export const TARGET_SIGN_TEXT = 'TARGETS'

// How far the staircase's front projects forward of FRONT_Z, so the flights
// visibly come forward from the tiered block instead of sitting flush with
// its front face. Was FOOTPRINT.backDepth * 0.1 (0.04) — now a plain literal
// of that same value, decoupled from FOOTPRINT.backDepth now that the latter
// is 0 (folded into TIER_DEPTHS[2] instead — see FOOTPRINT above), so this
// forward lean stays exactly what it was rather than silently zeroing out
// alongside it. Positive pushes forward; a negative value here would pull
// the flared steps back instead (toward the centre tiers). Shared by every
// profile — not tier-count-dependent.
export const STAIR_APRON = 0.04

// A single multiplier applied to EVERY step at once — still without ever
// touching TIER_DEPTHS/TIER_RISES/TIER_WIDTHS: it's layered under a
// profile's own per-tier landing widen multipliers (a step's actual
// multiplier is allStepsDepthMult times whatever its own landing widen
// gives it, or just allStepsDepthMult for a step with no landing-widen
// entry), applied through the same forward-shift mechanism, once per step —
// so every step keeps its own distinct size (an ordinary tread is still
// shallower than a landing, a widened landing is still bigger than its
// siblings), just each scaled by the same factor. Because every step's own
// shift only reaches boundaries in front of it, a uniform bump like this
// telescopes correctly toward the front: the object's front edge (step 0)
// ends up carrying the combined extra depth of every step behind it, exactly
// as it would if you physically made each individual stair deeper by that
// ratio — while every tier's own centre ledge and TOTAL_DEPTH/FRONT_Z/BACK_Z
// stay completely untouched, same as any single-step override. 1 = no
// change. This is the Hub instance's own value, passed to
// buildPodiumStageProfile as its `allStepsDepthMult` default; the Target
// instance uses its own independent TARGET_ALL_STEPS_DEPTH_MULT below
// instead (same split as TARGET_TIER_DEPTHS/TARGET_TIER_WIDTHS from
// TIER_DEPTHS/TIER_WIDTHS), so tuning one instance's ordinary stair-step
// depth never moves the other's.
const ALL_STEPS_DEPTH_MULT = 0.4

// --- tier profile ----------------------------------------------------------
// Turns one set of TIER_RISES/TIER_STEP_COUNTS/TIER_WIDTHS/TIER_DEPTHS
// tables into every geometry/collider number the builder (systems/
// podiumStageModel.js) and the collider below actually need. This used to be
// one set of module-level constants computed straight from the four arrays
// above — now it's a factory so the Hub and Target instances can each have
// their own tier count/shape (PODIUM_STAGE_PROFILE vs PODIUM_STAGE_
// TARGET_PROFILE below) while still sharing every OTHER knob in this file
// (LANDING_FACTOR, FOOTPRINT, STAIR_APRON, TRIM, ATLAS, the palette)
// unchanged — plus their own independent allStepsDepthMult (ALL_STEPS_
// DEPTH_MULT for the Hub, TARGET_ALL_STEPS_DEPTH_MULT for the Target).
//
// `landingWidenMult[k]` is tier k's own landing-step widen multiplier — the
// same idea this file used to spell out one tier at a time as TIER1_LANDING_
// STEP/TIER2_LANDING_STEP/TIER3_LANDING_STEP + their own *_WIDEN_MULT
// constants (widening a tier's own landing extends ITS front edge forward,
// carrying every step in front of it along for the ride, each keeping its
// own size — see the per-step loop inside for exactly how). Index 0 is never
// read: tier 0's single step has no separate landing to widen.
function buildPodiumStageProfile({
  tierRises,
  tierStepCounts,
  tierWidths,
  tierDepths,
  landingWidenMult,
  allStepsDepthMult = ALL_STEPS_DEPTH_MULT,
}) {
  const tiers = tierRises.length

  // Cumulative depth/height through the end of tier k — CUM_DEPTH/CUM_RISE's
  // old role, needed since TIER_DEPTHS/TIER_RISES are no longer uniform.
  const cumDepth = []
  {
    let sum = 0
    for (const d of tierDepths) {
      sum += d
      cumDepth.push(sum)
    }
  }
  const cumRise = []
  {
    let sum = 0
    for (const r of tierRises) {
      sum += r
      cumRise.push(sum)
    }
  }

  // Rise for a step belonging to tier k's group — that tier's own rise
  // divided across its own step count, so the first stage's one step is
  // exactly as shallow as the stage itself.
  function riseOf(k) {
    return tierRises[k] / tierStepCounts[k]
  }
  // The "ordinary" (non-landing) tread for tier k's group; treadOf below
  // makes the last step of the group LANDING_FACTOR times this instead.
  function normalTreadOf(k) {
    return tierDepths[k] / (tierStepCounts[k] - 1 + LANDING_FACTOR)
  }

  // Global step index i -> which tier's group it belongs to, and i's
  // position within that group.
  const stepTier = []
  const stepPos = []
  for (let k = 0; k < tiers; k++) {
    for (let p = 0; p < tierStepCounts[k]; p++) {
      stepTier.push(k)
      stepPos.push(p)
    }
  }
  const stepsPerFlight = stepTier.length

  // TOP_Y/STAIR_DEPTH/TOTAL_DEPTH/TOTAL_WIDTH are all built from tiers/
  // tierRises/tierDepths/FOOTPRINT only — never from tierStepCounts — which
  // is what keeps the object's overall silhouette fixed no matter how many
  // steps each tier's group asks for.
  const topY = cumRise[tiers - 1]
  const stairDepth = cumDepth[tiers - 1]
  // FOOTPRINT.backDepth is 0 (folded into the topmost tier's own depth), so
  // totalDepth is just stairDepth now — the + is kept (not simplified away)
  // so this stays correct if backDepth is ever reintroduced.
  const totalDepth = stairDepth + FOOTPRINT.backDepth
  const maxTierWidth = Math.max(...tierWidths)
  const totalWidth = maxTierWidth + 2 * FOOTPRINT.flankWidth
  // FRONT_Z/BACK_Z bound the centre tiers exactly and are symmetric about
  // the model's own local z = 0 — so a profile with a smaller totalDepth
  // (like the Target instance's 2-tier one) sits with both edges pulled in
  // toward that same centre, never past where a taller profile's edges sat.
  const frontZ = totalDepth / 2
  const backZ = frontZ - totalDepth

  // How many steps, counting from the ground step, share in STAIR_APRON's
  // forward projection — through the tier 1 landing. Every profile here has
  // at least 2 tiers, so tierStepCounts[1] always exists.
  const stairFlareSteps = tierStepCounts[0] + tierStepCounts[1]

  // Tier k (0 = frontmost, lowest) as a local box: its walkable top height
  // and the Z span of its ledge, running back from the previous tier's front
  // edge. Plain cumDepth — no per-step depth override ever touches the
  // centre tiers: each grows its own step forward instead, so every tier's
  // own ledge sits exactly where its tierDepths entry alone puts it.
  function tierSpan(k) {
    const z1 = frontZ - (k === 0 ? 0 : cumDepth[k - 1]) // front edge of this ledge
    return { top: cumRise[k], z0: frontZ - cumDepth[k], z1 }
  }

  // The tread depth of step i: normalTreadOf(k) for an ordinary step, deeper
  // by LANDING_FACTOR for the last step in its group (the landing). This is
  // each step's PLAIN size, unaffected by any landing-widen override.
  function treadOf(i) {
    const k = stepTier[i]
    const isLanding = stepPos[i] === tierStepCounts[k] - 1
    const norm = normalTreadOf(k)
    return isLanding ? norm * LANDING_FACTOR : norm
  }

  // Per-step depth multiplier, keyed by global step index: how many times
  // its own plain treadOf() that step is, applied below as a forward shift
  // on every boundary from the very front up through that step's own — so
  // every step in front of it is carried forward but keeps its own size
  // unchanged, only the overridden step itself absorbs the difference as
  // extra depth on its own front edge. Built from landingWidenMult: tier k's
  // own landing is the last step of its group, at global index
  // sum(tierStepCounts[0..k]) - 1.
  const stepDepthMult = {}
  for (let k = 1; k < tiers; k++) {
    const mult = landingWidenMult[k]
    if (!mult || mult === 1) continue
    let landingStep = -1
    for (let j = 0; j <= k; j++) landingStep += tierStepCounts[j]
    stepDepthMult[landingStep] = mult
  }

  // Step i (0 = bottom, at the front) of a flight: solid from the ground to
  // its tread, so the box's top face IS the tread quad and its +Z face IS
  // the riser quad. Treads are not all the same depth, so a step's Z
  // position can only be found by summing every tread before it. Built in
  // four passes: (1) the plain chain of boundaries, (2) STAIR_APRON's
  // tapered forward shift on the ground step through the tier 1 landing,
  // (3) one flat forward shift per stepDepthMult entry, (4) the same flat
  // shift again for EVERY step at once (ALL_STEPS_DEPTH_MULT). Every pass is
  // summed (not replaced), since each is just a forward shift on some range
  // of boundaries, and ranges can overlap.
  const stepSpans = (() => {
    const boundary = [frontZ]
    for (let i = 0; i < stepsPerFlight; i++) boundary.push(boundary[i] - treadOf(i))

    const apronSteps = Math.min(stairFlareSteps, stepsPerFlight)
    for (let j = 0; j <= apronSteps; j++) {
      boundary[j] += (STAIR_APRON * (apronSteps - j)) / apronSteps
    }

    for (const [stepStr, mult] of Object.entries(stepDepthMult)) {
      const step = Number(stepStr)
      const extra = treadOf(step) * (mult - 1)
      for (let j = 0; j <= step; j++) boundary[j] += extra
    }

    if (allStepsDepthMult !== 1) {
      for (let step = 0; step < stepsPerFlight; step++) {
        const extra = treadOf(step) * (allStepsDepthMult - 1)
        for (let j = 0; j <= step; j++) boundary[j] += extra
      }
    }

    const spans = []
    let top = 0
    for (let i = 0; i < stepsPerFlight; i++) {
      top += riseOf(stepTier[i])
      spans.push({ top, z0: boundary[i + 1], z1: boundary[i] })
    }
    return spans
  })()

  function stepSpan(i) {
    return stepSpans[i]
  }
  // Which tier's group step i belongs to — used with flankSpan(k) to find
  // the right X span for a given step, since that varies by tier.
  function tierOfStep(i) {
    return stepTier[i]
  }
  // X span of the right-hand flank for tier k's own steps; the left flank is
  // its mirror (negated). Anchored to that tier's own tierWidths[k] — not
  // one shared width — so the flank always hugs its tier's edge exactly.
  function flankSpan(k) {
    const x0 = tierWidths[k] / 2
    return { x0, x1: x0 + FOOTPRINT.flankWidth }
  }

  // Board spans the same width as the tier it actually stands on — the
  // topmost one (board and posts scale with that, not a separate literal),
  // so widening/narrowing that tier widens/narrows the sign to match instead
  // of leaving it mismatched with the platform it sits over.
  const topWidth = tierWidths[tiers - 1]
  const sign = {
    postHeight: 0.5,
    postSection: 0.055,
    boardWidth: topWidth,
    postSpread: topWidth / 3, // +/- X of the two posts
    boardHeight: topWidth / SIGN_ASPECT,
    boardThickness: 0.06,
    faceInset: 0.004, // the unlit quad, proud of the board face
    capHeight: 0.04, // brushed-metal cap along the board's top edge
    capOverhang: 0.03,
    z: backZ + 0.2, // centre of the board in Z, over the back platform
  }

  function worldBox(t, x0, x1, y1, z0, z1) {
    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]
    for (const lx of [x0, x1]) {
      for (const lz of [z0, z1]) {
        for (const ly of [0, y1]) {
          const p = localToWorld(t, lx, ly, lz)
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

  // The stage is walked ON, not around, so the collider is the real stepped
  // profile, not one enclosing box: every stair step, every centre tier and
  // the back platform, each solid from the ground to its own top (Tech.md
  // §5.2 — the kinematic capsule scans a flat AABB list). These boxes are
  // generated from the same spans the geometry uses, so they cannot drift.
  function buildAabbs(t = PODIUM_STAGE_TRANSFORM) {
    const out = []
    // both staircases, step by step — each using its own tier's flank span
    for (let i = 0; i < stepsPerFlight; i++) {
      const s = stepSpan(i)
      const f = flankSpan(tierOfStep(i))
      out.push(worldBox(t, f.x0, f.x1, s.top, s.z0, s.z1))
      out.push(worldBox(t, -f.x1, -f.x0, s.top, s.z0, s.z1))
    }
    // the centre tiers, each its own tierWidths[k]
    for (let k = 0; k < tiers; k++) {
      const c = tierSpan(k)
      const halfWidth = tierWidths[k] / 2
      out.push(worldBox(t, -halfWidth, halfWidth, c.top, c.z0, c.z1))
    }
    // full-width back platform — skipped when FOOTPRINT.backDepth is 0
    // (folded into the topmost tier's own depth instead), since a
    // zero-depth box is degenerate.
    if (FOOTPRINT.backDepth > 0) {
      out.push(worldBox(t, -totalWidth / 2, totalWidth / 2, topY, backZ, backZ + FOOTPRINT.backDepth))
    }
    return out
  }

  return {
    TIERS: tiers,
    STEPS_PER_FLIGHT: stepsPerFlight,
    TOP_Y: topY,
    STAIR_DEPTH: stairDepth,
    TOTAL_DEPTH: totalDepth,
    TOTAL_WIDTH: totalWidth,
    FRONT_Z: frontZ,
    BACK_Z: backZ,
    STAIR_FLARE_STEPS: stairFlareSteps,
    TIER_WIDTHS: tierWidths,
    SIGN: sign,
    tierSpan,
    stepSpan,
    tierOfStep,
    flankSpan,
    buildAabbs,
  }
}

// Point at local (lx, ly, lz) under transform t, in world space — the
// rotate-scale-translate every collider box corner (and, via
// PODIUM_STAGE_TARGET_PROFILE, data/targets.js's own prop placements) goes
// through. yaw rotates about +Y.
export function localToWorld(t, lx, ly, lz) {
  const cos = Math.cos(t.yaw)
  const sin = Math.sin(t.yaw)
  const sx = lx * t.scale
  const sy = ly * t.scale
  const sz = lz * t.scale
  return [t.x + sx * cos + sz * sin, t.y + sy, t.z - sx * sin + sz * cos]
}

// The Hub instance's own profile — every export below this point that used
// to be its own module-level constant (TIERS, STEPS_PER_FLIGHT, TOP_Y, ...,
// tierSpan/stepSpan/tierOfStep/flankSpan, SIGN) is now an alias of the
// matching field here, so every existing caller of this file (systems/
// podiumStagePreview.js, components/PodiumStage.jsx's default profile prop)
// keeps working unchanged.
// The Hub instance's own per-tier landing widen multiplier, keyed by tier
// index (index 0 is never read: tier 0's single step has no separate landing
// to widen — see buildPodiumStageProfile's own comment on landingWidenMult).
// Each entry is independently tunable — index 1 widens only global step 6
// (tier 1's landing: tierStepCounts[0] + tierStepCounts[1] - 1 = 1+6-1),
// index 2 only step 12 (tier 2's landing: 1+6+6-1), index 3 only step 18
// (tier 3's landing) — changing one never moves the others' depth.
export const LANDING_WIDEN_MULT = [undefined, 2, 4, 5]

export const PODIUM_STAGE_PROFILE = buildPodiumStageProfile({
  tierRises: TIER_RISES,
  tierStepCounts: TIER_STEP_COUNTS,
  tierWidths: TIER_WIDTHS,
  tierDepths: TIER_DEPTHS,
  landingWidenMult: LANDING_WIDEN_MULT,
})
export const {
  STEPS_PER_FLIGHT,
  TOP_Y,
  STAIR_DEPTH,
  TOTAL_DEPTH,
  TOTAL_WIDTH,
  FRONT_Z,
  BACK_Z,
  STAIR_FLARE_STEPS,
  SIGN,
  tierSpan,
  stepSpan,
  tierOfStep,
  flankSpan,
} = PODIUM_STAGE_PROFILE
export const buildPodiumStageAabbs = PODIUM_STAGE_PROFILE.buildAabbs

// The Target instance's own tier depths — its own knob, independent of the
// Hub's TIER_DEPTHS above (unlike tierRises/tierStepCounts below, which the
// Target profile still reuses straight from the Hub's own tables). Defaults
// to the same three values TIER_DEPTHS[0..2] already has, so nothing changes
// visually until this is edited — change an entry here to make the Target
// podium's tiers deeper/shallower without touching the Hub instance at all.
// Same rules as TIER_DEPTHS apply (see that comment): changing this only
// moves TOP_Y/STAIR_DEPTH/TOTAL_DEPTH/tierSpan, never TIER_STEP_COUNTS.
//
// Changing tier depth/width here resizes the Target podium's own footprint
// (TOTAL_DEPTH/TOTAL_WIDTH) — re-check it against every neighbouring AABB
// set in data/hub.js (grass blocks/cubes, the walls, the merchant shop, the
// hub instance) the same way PODIUM_STAGE_HUB_TRANSFORM's own comment
// describes, since a bigger tier can grow the footprint back into them.
export const TARGET_TIER_DEPTHS = [1.2, 1.2, 0.8]

// The Target instance's own tier widths — its own knob, independent of the
// Hub's TIER_WIDTHS above, the same way TARGET_TIER_DEPTHS is independent of
// TIER_DEPTHS. Defaults to the same three values TIER_WIDTHS[0..2] already
// has, so nothing changes visually until this is edited. A tier's own width
// also sets its flank's X position (flankSpan) and, for the topmost tier,
// the sign board's width/height (see buildPodiumStageProfile's own `sign`)
// — so widening/narrowing the Target's own topmost tier resizes its sign to
// match, independently of the Hub's sign.
export const TARGET_TIER_WIDTHS = [3.2, 3.2, 3.2]

// The Target instance's own ordinary (non-landing) stair-step depth
// multiplier — its own knob, independent of the Hub's ALL_STEPS_DEPTH_MULT
// above, the same way TARGET_TIER_DEPTHS is independent of TIER_DEPTHS. This
// is NOT tier depth (TARGET_TIER_DEPTHS, the walkable ledge/landing you stand
// on) — it only scales the depth of the repeating steps making up each
// tier's own climb, exactly like ALL_STEPS_DEPTH_MULT does for the Hub (see
// that constant's own comment for the forward-shift mechanics). Defaults to
// the same value ALL_STEPS_DEPTH_MULT already has, so nothing changes
// visually until this is edited. As with TARGET_TIER_DEPTHS, this can grow
// the Target podium's real (rendered) footprint out past its computed
// TOTAL_DEPTH/FRONT_Z without moving those constants themselves — re-check
// against neighbouring AABBs in data/hub.js the same way.
export const TARGET_ALL_STEPS_DEPTH_MULT = 0.4

// The Target instance's own per-tier landing widen multiplier — its own
// knob, independent of the Hub's LANDING_WIDEN_MULT above, the same way
// TARGET_TIER_DEPTHS is independent of TIER_DEPTHS. Index 0 is never read
// (tier 0 has no landing). Index 1 widens only global step 6 (tier 1's
// landing: tierStepCounts[0] + tierStepCounts[1] - 1 = 1+6-1) and index 2
// only step 12 (tier 2's landing: 1+6+6-1) — each independently tunable,
// changing one never moves the other's depth or the Hub's. Defaults to the
// same two values LANDING_WIDEN_MULT[1..2] already has, so nothing changes
// visually until this is edited.
export const TARGET_LANDING_WIDEN_MULT = [4, 4, 4]

// The Target instance's own profile — 3 tiers. Rise/step-count still come
// straight from the Hub's own tables (tiers 0-2, unchanged) so the two
// instances read as visually consistent (same step sizing); depth, width,
// ordinary step depth, and landing widen are each their own TARGET_TIER_
// DEPTHS/TARGET_TIER_WIDTHS/TARGET_ALL_STEPS_DEPTH_MULT/TARGET_LANDING_
// WIDEN_MULT above instead, so any of them can differ from the Hub without
// the Hub's own shape moving too.
export const PODIUM_STAGE_TARGET_PROFILE = buildPodiumStageProfile({
  tierRises: TIER_RISES.slice(0, 3),
  tierStepCounts: TIER_STEP_COUNTS.slice(0, 3),
  tierWidths: TARGET_TIER_WIDTHS,
  tierDepths: TARGET_TIER_DEPTHS,
  landingWidenMult: TARGET_LANDING_WIDEN_MULT,
  allStepsDepthMult: TARGET_ALL_STEPS_DEPTH_MULT,
})

export const PODIUM_STAGE_AABBS = PODIUM_STAGE_PROFILE.buildAabbs()
// The collider for each of the two hub placements — data/hub.js spreads both
// into HUB_AABBS, the same way MERCHANT_SHOP_AABBS is.
export const PODIUM_STAGE_HUB_AABBS = PODIUM_STAGE_PROFILE.buildAabbs(PODIUM_STAGE_HUB_TRANSFORM)
export const PODIUM_STAGE_TARGET_AABBS = PODIUM_STAGE_TARGET_PROFILE.buildAabbs(
  PODIUM_STAGE_TARGET_TRANSFORM,
)
