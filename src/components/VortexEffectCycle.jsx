import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import VortexEffect from './VortexEffect.jsx'
import VortexRingEffect from './VortexRingEffect.jsx'
import {
  VORTEX_CYCLE_HOLD_SECONDS,
  VORTEX_CYCLE_TRANSITION_SECONDS,
  VORTEX_CYCLE_LENGTH_SECONDS,
} from '../data/vortexCycle.js'

// Alternates vortex_target's two looks — the swirling disc (VortexEffect.jsx)
// and the layered accretion-disk rings (VortexRingEffect.jsx) — forever:
// each holds fully visible for VORTEX_CYCLE_HOLD_SECONDS, then crossfades to
// the other over VORTEX_CYCLE_TRANSITION_SECONDS (data/vortexCycle.js), on
// repeat. Both effects are mounted the whole time; only their own opacity
// multiplier ref moves, so neither ever remounts or resets its own spin
// state mid-fade — driven off clock.elapsedTime % cycle length, so the loop
// is exact and never drifts or needs its own accumulator.
export default function VortexEffectCycle() {
  const discOpacityRef = useRef(1)
  const ringOpacityRef = useRef(0)

  useFrame(({ clock }) => {
    const hold = VORTEX_CYCLE_HOLD_SECONDS
    const trans = VORTEX_CYCLE_TRANSITION_SECONDS
    const t = clock.elapsedTime % VORTEX_CYCLE_LENGTH_SECONDS

    if (t < hold) {
      discOpacityRef.current = 1
      ringOpacityRef.current = 0
    } else if (t < hold + trans) {
      const f = (t - hold) / trans
      discOpacityRef.current = 1 - f
      ringOpacityRef.current = f
    } else if (t < hold + trans + hold) {
      discOpacityRef.current = 0
      ringOpacityRef.current = 1
    } else {
      const f = (t - (hold + trans + hold)) / trans
      discOpacityRef.current = f
      ringOpacityRef.current = 1 - f
    }
  })

  return (
    <>
      <VortexEffect opacityRef={discOpacityRef} />
      <VortexRingEffect opacityRef={ringOpacityRef} />
    </>
  )
}
