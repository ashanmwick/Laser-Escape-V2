import TargetProp from './TargetProp.jsx'
import AfkTargetLabel from './AfkTargetLabel.jsx'
import { TARGET_PROPS, TARGET_AIM_OFFSET } from '../data/targets.js'
import { AFK_TARGET_CONFIG, AFK_LABEL_HEIGHT } from '../data/afk.js'

// The 9 objects in collection `Targets` — each its own glTF (data/targets.js),
// placed once. See TargetProp.jsx and data/targets.js for the shared loader
// and per-object transform. Each also gets a floating Power / Rebirth-required
// sign (AfkTargetLabel.jsx) from its data/afk.js AFK_TARGET_CONFIG entry,
// floated AFK_LABEL_HEIGHT above the same aim point systems/afk.js fires at.
export default function Targets() {
  return (
    <>
      {TARGET_PROPS.map((t) => (
        <TargetProp key={t.id} url={t.url} position={t.position} />
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
          />
        )
      })}
    </>
  )
}
