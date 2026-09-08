import { useEffect, useRef } from 'react'
import { subscribe } from '../systems/avatarState.js'
import { applyProportions, buildAvatar, disposeAvatar } from '../systems/avatarModel.js'
import { setDims, resetDims } from '../systems/playerState.js'

// Mounts the Bloxity avatar under Player's transform group. Presentation only
// (Tech.md rule 3): all loading and rig maths live in systems/avatarModel.js.
//
// `onReady(bool)` tells Player whether to keep drawing the capsule. Signed-out
// players now get the default base rig (avatarState seeds DEFAULT_EQUIPPED); the
// capsule is the fallback for a blocked CDN, a failed load, or equipped === null.
export default function PlayerAvatar({ onReady }) {
  const groupRef = useRef(null)

  useEffect(() => {
    let built = null
    let generation = 0
    let disposed = false

    const clear = () => {
      if (built) {
        disposeAvatar(built)
        built = null
      }
      resetDims()
      onReady(false)
    }

    const rebuild = async (equipped, proportions) => {
      const mine = ++generation
      clear()
      if (!equipped) return
      const next = await buildAvatar(equipped)
      // A newer rebuild (or unmount) landed while we were loading.
      if (disposed || mine !== generation) {
        disposeAvatar(next)
        return
      }
      if (!next || !groupRef.current) {
        disposeAvatar(next)
        return
      }
      built = next
      const dims = applyProportions(built, proportions)
      setDims(dims.radius, dims.height)
      groupRef.current.add(built.root)
      onReady(true)
    }

    const off = subscribe((state, reason) => {
      if (reason === 'proportions' && built) {
        // No reload needed: proportions only move bones.
        const dims = applyProportions(built, state.proportions)
        setDims(dims.radius, dims.height)
        return
      }
      rebuild(state.equipped, state.proportions)
    })

    return () => {
      disposed = true
      off()
      clear()
    }
  }, [onReady])

  return <group ref={groupRef} />
}
