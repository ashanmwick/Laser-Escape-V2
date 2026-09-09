import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Billboard, Text } from '@react-three/drei'
import { remotePlayers, subscribe } from '../systems/net.js'
import { buildAvatar, applyProportions, disposeAvatar } from '../systems/avatarModel.js'
import { makeGait, updateGait, disposeGait } from '../systems/avatarAnim.js'
import {
  REMOTE_BODY,
  REMOTE_BEAM_EYE_RATIO,
  REMOTE_BEAM_FORWARD_RATIO,
} from '../data/net.js'

// Other players in the same arena room (systems/net.js). Presentation only
// (Tech.md rule 3): the socket, interpolation, roster and avatar payloads all
// live in the system; this mounts the real Bloxity character per remote —
// equipped cosmetics + the shared run cycle — exactly the way PlayerAvatar.jsx
// does for the local player, reusing systems/avatarModel.js + avatarAnim.js.
//
// The capsule is the fallback (Tech.md §6): it shows while a rig loads, when a
// remote's avatar CDN load fails, and for any player past
// data/net.js MAX_REMOTE_BODIES.

// Scratch, hoisted — zero allocation per frame (Tech.md §7).
const UP = new THREE.Vector3(0, 1, 0)
const _dir = new THREE.Vector3()
const _mid = new THREE.Vector3()
const _quat = new THREE.Quaternion()

const R = REMOTE_BODY.RADIUS
const H = REMOTE_BODY.HEIGHT
const CYL = H - R * 2

// Mounts one remote's avatar rig under the caller's transform group. Mirrors
// PlayerAvatar.jsx: all loading / rig maths / gait live in the systems; this
// rebuilds when the remote's `rev` (systems/net.js avatarRev) changes and
// ticks the gait from their reported gait factor.
function RemoteAvatar({ id, rev, onReady }) {
  const groupRef = useRef(null)
  const gaitRef = useRef(null)

  useEffect(() => {
    let built = null
    let generation = 0
    let disposed = false

    const clear = () => {
      if (gaitRef.current) {
        disposeGait(gaitRef.current)
        gaitRef.current = null
      }
      if (built) {
        disposeAvatar(built)
        built = null
      }
      onReady(false)
    }

    const build = async () => {
      const mine = ++generation
      clear()
      const e = remotePlayers.get(id)
      if (!e) return
      // A guest's `equipped` is {} — buildAvatar still returns the bare base
      // rig, same as the local signed-out player.
      const next = await buildAvatar(e.equipped || {})
      if (disposed || mine !== generation) {
        disposeAvatar(next)
        return
      }
      if (!next || !groupRef.current) {
        disposeAvatar(next)
        return
      }
      built = next
      applyProportions(built, e.proportions)
      groupRef.current.add(built.root)
      gaitRef.current = makeGait(built)
      onReady(true)
    }

    build()
    return () => {
      disposed = true
      clear()
    }
  }, [id, rev, onReady])

  useFrame((_, delta) => {
    const gait = gaitRef.current
    if (!gait) return
    const e = remotePlayers.get(id)
    // e.rspeed is the eased 0..1 gait factor the remote sent (their
    // hypot(velocity.xz) / SPEED) — drive the run cycle straight off it.
    updateGait(gait, Math.min(delta, 0.1), e ? e.rspeed : 0)
  })

  return <group ref={groupRef} />
}

function RemoteBody({ id, name, avatarRev }) {
  const bodyRef = useRef()
  const beamRef = useRef()
  const bodyMatRef = useRef()
  const nubMatRef = useRef()
  const glowMatRef = useRef()
  const coreMatRef = useRef()

  const [hasAvatar, setHasAvatar] = useState(false)
  const onAvatarReady = useCallback((ready) => setHasAvatar(ready), [])

  useFrame(() => {
    const e = remotePlayers.get(id)
    const body = bodyRef.current
    const beam = beamRef.current
    if (!e || !body || !beam) return

    // --- Body: eased world transform, faded by alpha ---
    body.position.set(e.rx, e.ry, e.rz)
    body.rotation.y = e.ryaw
    const a = e.alpha
    body.visible = a > 0.01
    // The capsule fallback fades; the rig (many materials) just hard-toggles
    // with the group above.
    const transparent = a < 0.999
    if (bodyMatRef.current) {
      bodyMatRef.current.transparent = transparent
      bodyMatRef.current.opacity = a
    }
    if (nubMatRef.current) {
      nubMatRef.current.transparent = transparent
      nubMatRef.current.opacity = a
    }

    // --- Beam: world-space, drawn only while firing ---
    if (!e.firing || a < 0.05) {
      beam.visible = false
      return
    }
    const sx = e.rx + Math.sin(e.ryaw) * R * REMOTE_BEAM_FORWARD_RATIO
    const sy = e.ry + H * REMOTE_BEAM_EYE_RATIO
    const sz = e.rz + Math.cos(e.ryaw) * R * REMOTE_BEAM_FORWARD_RATIO
    _dir.set(e.beam.x - sx, e.beam.y - sy, e.beam.z - sz)
    const len = _dir.length()
    if (len < 0.05 || len > 400) {
      beam.visible = false
      return
    }
    _dir.divideScalar(len)
    _quat.setFromUnitVectors(UP, _dir)
    _mid.set((sx + e.beam.x) / 2, (sy + e.beam.y) / 2, (sz + e.beam.z) / 2)
    beam.visible = true
    beam.position.copy(_mid)
    beam.quaternion.copy(_quat)
    beam.scale.set(1, len, 1)
    if (glowMatRef.current) glowMatRef.current.opacity = REMOTE_BODY.BEAM_OPACITY * a
    if (coreMatRef.current) coreMatRef.current.opacity = a
  })

  return (
    <>
      <group ref={bodyRef} userData={{ laserIgnore: true }}>
        {/* Fallback capsule — visible until the rig is mounted (Tech.md §6). */}
        <group visible={!hasAvatar}>
          <mesh position-y={H / 2}>
            <capsuleGeometry args={[R, CYL, 4, 10]} />
            <meshLambertMaterial ref={bodyMatRef} color={REMOTE_BODY.COLOR} />
          </mesh>
          <mesh position={[0, H * 0.62, R]}>
            <boxGeometry args={[0.14, 0.14, 0.28]} />
            <meshLambertMaterial ref={nubMatRef} color={REMOTE_BODY.NUB_COLOR} />
          </mesh>
        </group>

        <RemoteAvatar id={id} rev={avatarRev} onReady={onAvatarReady} />

        <Billboard position-y={REMOTE_BODY.NAME_HEIGHT}>
          <Text
            fontSize={REMOTE_BODY.NAME_SIZE}
            color={REMOTE_BODY.NAME_COLOR}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.022}
            outlineColor={REMOTE_BODY.NAME_OUTLINE}
            maxWidth={6}
          >
            {name}
          </Text>
        </Billboard>
      </group>

      {/* World-space beam — sibling of the body so its endpoints stay in world
         coords and don't inherit the body's yaw. */}
      <group ref={beamRef} userData={{ laserIgnore: true }} visible={false}>
        <mesh>
          <cylinderGeometry args={[REMOTE_BODY.BEAM_CORE_RADIUS, REMOTE_BODY.BEAM_CORE_RADIUS, 1, 6]} />
          <meshBasicMaterial ref={coreMatRef} color={REMOTE_BODY.BEAM_CORE_COLOR} transparent depthWrite={false} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[REMOTE_BODY.BEAM_RADIUS, REMOTE_BODY.BEAM_RADIUS, 1, 6]} />
          <meshBasicMaterial
            ref={glowMatRef}
            color={REMOTE_BODY.BEAM_COLOR}
            transparent
            opacity={REMOTE_BODY.BEAM_OPACITY}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  )
}

// Re-renders only on roster / name / avatar changes (systems/net.js emits on
// join, leave, name resolve and avatarRev bump) — never per frame (Tech.md
// §5.4). Each RemoteBody then drives its own transform + gait from the frame
// loop.
export default function RemotePlayers() {
  const [, bump] = useReducer((n) => n + 1, 0)
  useEffect(() => subscribe(() => bump()), [])

  const bodies = []
  for (const [id, e] of remotePlayers) {
    bodies.push(
      <RemoteBody key={id} id={id} name={e.username || 'Player'} avatarRev={e.avatarRev} />,
    )
  }
  return bodies
}
