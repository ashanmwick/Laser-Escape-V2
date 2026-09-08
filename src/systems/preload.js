// Fetches and parses every hub model up front so components/LoadingScreen.jsx
// can show real progress and drop away onto a fully populated first frame.
// Framework-free (Tech.md rule 2) — the component is the only React surface.
//
// Each model settles on its own: one failed request still counts toward
// `loaded` and the game boots without that prop rather than wedging the
// loading screen forever (the same "every asset is optional" posture as
// systems/avatarModel.js). The returned promise therefore always resolves.
import { preloadProp, preloadPropParts } from './propModel.js'
import {
  PRELOAD_PROP_URLS,
  PRELOAD_PARTS_URLS,
  PRELOAD_TOTAL,
} from '../data/assetManifest.js'

export function preloadAll(onProgress) {
  let loaded = 0
  const bump = (url, err) => {
    if (err) console.warn('[preload] could not load', url, err)
    loaded += 1
    onProgress?.(loaded, PRELOAD_TOTAL)
  }

  const jobs = [
    ...PRELOAD_PROP_URLS.map((url) =>
      preloadProp(url).then(() => bump(url), (e) => bump(url, e)),
    ),
    ...PRELOAD_PARTS_URLS.map((url) =>
      preloadPropParts(url).then(() => bump(url), (e) => bump(url, e)),
    ),
  ]

  return Promise.all(jobs)
}
