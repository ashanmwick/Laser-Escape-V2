import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { subscribe } from '../systems/avatarState.js'
import { applyProportions, buildAvatar, disposeAvatar } from '../systems/avatarModel.js'
import { makeGait, updateGait, disposeGait } from '../systems/avatarAnim.js'
import { player, setDims, resetDims } from '../systems/playerState.js'
import { SPEED } from '../systems/playerMovement.js'
import { setAvatarReady } from '../systems/gameReadiness.js'

// Mounts the Bloxity avatar under Player's transform group. Presentation only
// (Tech.md rule 3): all loading, rig maths and the run cycle live in
// systems/avatarModel.js and systems/avatarAnim.js.
//
// `onReady(bool)` tells Player whether to keep drawing the capsule (visible
// only for the instant between clear() and the next build landing, since
// components/LoadingScreen.jsx blocks play for that whole window — see
// setAvatarReady() calls below, which drive that gate).
export default function PlayerAvatar({ onReady }) {
  const groupRef = useRef(null)
  // Read from the frame loop; written by the rebuild effect below.
  const gaitRef = useRef(null)

  useEffect(() => {
    let built = null
    let generation = 0
    let disposed = false
    // Cancels the current build's base-rig retry loop (systems/avatarModel.js)
    // once a newer rebuild supersedes it or the component unmounts, so an
    // abandoned retry loop can't keep polling the CDN forever.
    let cancelToken = null

    const clear = () => {
      // Gait first: it restores the bind pose while the bones are still live.
      if (gaitRef.current) {
        disposeGait(gaitRef.current)
        gaitRef.current = null
      }
      if (built) {
        disposeAvatar(built)
        built = null
      }
      resetDims()
      onReady(false)
      setAvatarReady(false)
    }

    const rebuild = async (equipped, proportions) => {
      const mine = ++generation
      if (cancelToken) cancelToken.cancelled = true
      clear()
      if (!equipped) {
        // Deliberately no avatar (equipped === null): a portal instruction,
        // not a failure — there is nothing to retry, so unlike a load
        // failure this does NOT block play behind LoadingScreen.jsx.
        setAvatarReady(true)
        return
      }
      const token = { cancelled: false }
      cancelToken = token
      const next = await buildAvatar(equipped, token)
      // A newer rebuild (or unmount) landed while we were loading.
      if (disposed || mine !== generation) {
        disposeAvatar(next)
        return
      }
      if (!next || !groupRef.current) {
        // Only reachable via cancellation racing the fetch itself (the
        // base rig's own retry loop never gives up on its own — see
        // avatarModel.js) or a mid-flight unmount; the earlier check above
        // already covers both, so this is just a defensive backstop. Stay
        // not-ready: there is nothing here for LoadingScreen.jsx to clear.
        disposeAvatar(next)
        return
      }
      built = next
      const dims = applyProportions(built, proportions)
      setDims(dims.radius, dims.height)
      groupRef.current.add(built.root)
      gaitRef.current = makeGait(built)
      onReady(true)
      setAvatarReady(true)
    }

    const off = subscribe((state, reason) => {
      if (reason === 'proportions' && built) {
        // No reload needed: proportions only move bones. The gait keeps its
        // cached bind quaternions — proportions never touch rotation.
        const dims = applyProportions(built, state.proportions)
        setDims(dims.radius, dims.height)
        return
      }
      rebuild(state.equipped, state.proportions)
    })

    return () => {
      disposed = true
      if (cancelToken) cancelToken.cancelled = true
      off()
      clear()
    }
  }, [onReady])

  // GameLoop's useFrame subscribes first (rendered before Player), so
  // player.velocity is already this frame's when we read it here.
  useFrame((_, delta) => {
    const gait = gaitRef.current
    if (!gait) return
    const speed = Math.hypot(player.velocity.x, player.velocity.z) / SPEED
    updateGait(gait, Math.min(delta, 0.1), speed)
  })

  return <group ref={groupRef} />
}
