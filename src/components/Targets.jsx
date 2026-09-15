import TargetProp from './TargetProp.jsx'
import TargetGroundMats from './TargetGroundMats.jsx'
import AfkTargetLabel from './AfkTargetLabel.jsx'
import VortexEffectCycle from './VortexEffectCycle.jsx'
import { TARGET_PROPS, TARGET_AIM_OFFSET } from '../data/targets.js'
import { AFK_TARGET_CONFIG, AFK_LABEL_HEIGHT } from '../data/afk.js'

// The 9 objects in collection `Targets` — each its own glTF (data/targets.js),
// placed once. See TargetProp.jsx and data/targets.js for the shared loader
// and per-object transform. Each also gets a floating Power / Rebirth-required
// sign (AfkTargetLabel.jsx) from its data/afk.js AFK_TARGET_CONFIG entry,
// floated AFK_LABEL_HEIGHT above the same aim point systems/afk.js fires at,
// and its own ground mat (TargetGroundMats.jsx) — a code-generated checker
// plate under its feet, same size/position for all nine, independently
// recolorable per target (data/targetGroundMat.js). vortex_target alone
// additionally gets VortexEffectCycle.jsx — two glowing additive looks
// (a swirling disc and layered accretion-disk rings) mounted on the
// object's own aim point, billboarded to always face the player, that
// alternate forever with a smooth crossfade (data/vortexCycle.js).
export default function Targets() {
  return (
    <>
      <TargetGroundMats />
      <VortexEffectCycle />
      {TARGET_PROPS.map((t) => (
        <TargetProp key={t.id} url={t.url} position={t.position} scale={t.scale} />
      ))}
      {TARGET_PROPS.map((t) => {
        const cfg = AFK_TARGET_CONFIG[t.id]
        if (!cfg) return null
        const aimY = TARGET_AIM_OFFSET[t.id]?.[1] ?? 0
        return (
          <AfkTargetLabel
            key={t.id}
            position={[t.position[0], t.position[1] + aimY + AFK_LABEL_HEIGHT, t.position[2]]}
            power={cfg.power}
            rebirthRequired={cfg.rebirthRequired}
            powerColorTop={cfg.powerColorTop}
            powerColorBottom={cfg.powerColorBottom}
            rebirthColorTop={cfg.rebirthColorTop}
            rebirthColorBottom={cfg.rebirthColorBottom}
          />
        )
      })}
    </>
  )
}
