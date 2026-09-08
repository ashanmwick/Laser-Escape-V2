// The avatar run cycle. Framework-free (Tech.md rule 2): PlayerAvatar.jsx builds
// one of these alongside the rig and ticks it each frame.
//
// Two paths, preferring Bloxity's own animation:
//   1. player.glb ships a clip matching GAIT.runClip -> drive it with an
//      AnimationMixer, cross-faded under an idle clip when present. This rigs to
//      the skeleton exactly because it was authored for it.
//   2. no such clip -> a generated four-bone swing on ArmL1/ArmR1/LegL1/LegR1
//      plus a Spine1 lean and a body bob. Rotation-only, so it never fights
//      applyProportions(), which owns those nodes' position and scale.
//
// Everything here is null-safe: a missing bone or a total failure just leaves
// the avatar static, the same way a failed load leaves Player on the capsule.
import * as THREE from 'three'
import { GAIT } from '../data/bloxity.js'

// phase offset per limb: legs are half a cycle apart; each arm is anti-phase to
// the leg on its own side (contralateral swing).
const LIMBS = [
  { name: 'LegL1', kind: 'leg', offset: 0 },
  { name: 'LegR1', kind: 'leg', offset: Math.PI },
  { name: 'ArmL1', kind: 'arm', offset: Math.PI },
  { name: 'ArmR1', kind: 'arm', offset: 0 },
]

const AXES = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
}

// Build the gait driver for one freshly built avatar. Returns null when there is
// nothing to animate.
export function makeGait(built) {
  if (!built || !built.root) return null

  const gait = {
    built,
    axis: AXES[GAIT.swingAxis] || AXES.x,
    amp: 0, // eased 0..1 locomotion weight
    phase: 0, // radians along the stride
    q: new THREE.Quaternion(), // scratch
    mixer: null,
    run: null,
    idle: null,
    limbs: [],
    spine: null,
    spineBind: null,
  }

  // --- Path 1: an embedded Bloxity clip --------------------------------
  const run = (built.clips || []).find((c) => GAIT.runClip.test(c.name))
  if (run) {
    gait.mixer = new THREE.AnimationMixer(built.root)
    gait.run = gait.mixer.clipAction(run)
    gait.run.play()
    gait.run.setEffectiveWeight(0)

    const idle = built.clips.find((c) => GAIT.idleClip.test(c.name))
    if (idle) {
      gait.idle = gait.mixer.clipAction(idle)
      gait.idle.play()
    }
    return gait
  }

  // --- Path 2: the generated fallback --------------------------------
  for (const limb of LIMBS) {
    const bone = built.nodes[limb.name]
    if (bone) gait.limbs.push({ ...limb, bone, bind: bone.quaternion.clone() })
  }
  const spine = built.nodes.Spine1
  if (spine) {
    gait.spine = spine
    gait.spineBind = spine.quaternion.clone()
  }
  return gait
}

// speed01: horizontal speed / target run speed. Values outside 0..1 are clamped.
export function updateGait(gait, dt, speed01) {
  if (!gait || dt <= 0) return

  const target = speed01 < 0 ? 0 : speed01 > 1 ? 1 : speed01
  // Exponential ease so a start or stop does not snap mid-stride.
  gait.amp += (target - gait.amp) * (1 - Math.exp(-GAIT.blendHz * dt))
  // Advance the cycle; keep a little residual cadence so the legs finish the
  // step they are on rather than freezing.
  gait.phase += GAIT.strideHz * 2 * Math.PI * dt * (0.35 + 0.65 * gait.amp)
  if (gait.phase > Math.PI * 2) gait.phase -= Math.PI * 2

  if (gait.mixer) {
    if (gait.run) {
      gait.run.setEffectiveWeight(gait.amp)
      gait.run.timeScale = 0.4 + 0.9 * gait.amp
    }
    if (gait.idle) gait.idle.setEffectiveWeight(1 - gait.amp)
    gait.mixer.update(dt)
    return
  }

  // Below the ease-out floor: hold the exact bind pose and stop touching bones.
  if (gait.amp < 0.01) {
    for (const limb of gait.limbs) limb.bone.quaternion.copy(limb.bind)
    if (gait.spine) gait.spine.quaternion.copy(gait.spineBind)
    gait.built.root.position.y = 0
    return
  }

  for (const limb of gait.limbs) {
    const swing = (limb.kind === 'arm' ? GAIT.armSwing : GAIT.legSwing) * gait.amp
    gait.q.setFromAxisAngle(gait.axis, Math.sin(gait.phase + limb.offset) * swing)
    // Parent-space swing (premultiply): the *_Offset parents carry position
    // only (identity rotation, per applyProportions), so parent space is the
    // character's own frame and X is the forward/back flexion axis regardless
    // of how each mirrored limb bone's local frame is twisted.
    limb.bone.quaternion.copy(limb.bind).premultiply(gait.q)
  }
  if (gait.spine) {
    gait.q.setFromAxisAngle(AXES.x, GAIT.lean * gait.amp)
    gait.spine.quaternion.copy(gait.spineBind).premultiply(gait.q)
  }
  // Body bob: two beats per stride. built.root's X/Z/Y world placement belongs
  // to Player's group, so only its local Y is ours to touch.
  gait.built.root.position.y = Math.abs(Math.sin(gait.phase)) * GAIT.bob * gait.amp
}

// Return the rig to its bind pose. Call before disposeAvatar(), while the nodes
// are still live.
export function disposeGait(gait) {
  if (!gait) return
  if (gait.mixer) {
    gait.mixer.stopAllAction()
    gait.mixer.uncacheRoot(gait.built.root)
  }
  for (const limb of gait.limbs) limb.bone.quaternion.copy(limb.bind)
  if (gait.spine) gait.spine.quaternion.copy(gait.spineBind)
  if (gait.built && gait.built.root) gait.built.root.position.y = 0
}
