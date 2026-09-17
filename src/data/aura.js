// Aura tier list shown in the HUD's Aura popup (components/hud/Hud.jsx
// AuraWindow) — one row per tier, same list-of-upgrades shape as
// HEX_POWER_PAD_TIERS but for the (not yet implemented) Aura system, so the
// UI has something real to render before the feature's own balancing lands.
// winsRequired spans 5 -> 100,000,000 and strengthMult spans 1.2x -> 5x
// across the 13 tiers.
//
// `iconUrl` points at per-tier art that doesn't exist yet — placeholder
// filenames under public/ui/aura/ for icons to be dropped in by hand later;
// until then the <img> just renders blank (Hud.jsx's AuraEntry sets no
// broken-image fallback on purpose).
// `colorCore`/`colorEdge` drive the equipped aura's fire-particle trail
// (components/AuraParticles.jsx) — each particle lerps from colorCore (its
// hot spawn color) to colorEdge (its faded color at end of life) over its
// own lifetime, so the trail reads as a real two-tone flame gradient rather
// than a flat tint. Picked per tier to match its name (e.g. Frost is a pale
// cyan core fading to deep blue; Void is a lit purple core fading to
// near-black).
export const AURA_TIERS = [
  { name: 'Spark Aura', strengthMult: 1.2, winsRequired: 5, gemCost: 3, iconUrl: '/ui/aura/aura-01.png', colorCore: '#fff6c2', colorEdge: '#ffa733' },
  { name: 'Ember Aura', strengthMult: 1.35, winsRequired: 25, gemCost: 5, iconUrl: '/ui/aura/aura-02.png', colorCore: '#ffcf6b', colorEdge: '#ff5a1f' },
  { name: 'Ultra Instinct', strengthMult: 1.6, winsRequired: 100, gemCost: 17, iconUrl: '/ui/aura/aura-03.png', colorCore: '#ffffff', colorEdge: '#4f7fff' },
  { name: 'Frost Aura', strengthMult: 1.9, winsRequired: 500, gemCost: 25, iconUrl: '/ui/aura/aura-04.png', colorCore: '#eafeff', colorEdge: '#1fa8d1' },
  { name: 'Storm Aura', strengthMult: 2.2, winsRequired: 2500, gemCost: 35, iconUrl: '/ui/aura/aura-05.png', colorCore: '#d6c6ff', colorEdge: '#4a2fc9' },
  { name: 'Radiant Aura', strengthMult: 2.6, winsRequired: 10000, gemCost: 50, iconUrl: '/ui/aura/aura-06.png', colorCore: '#fff9d6', colorEdge: '#ffb300' },
  { name: 'Phoenix Aura', strengthMult: 3, winsRequired: 50000, gemCost: 70, iconUrl: '/ui/aura/aura-07.png', colorCore: '#ffe27a', colorEdge: '#ff2d0a' },
  { name: 'Void Aura', strengthMult: 3.4, winsRequired: 250000, gemCost: 95, iconUrl: '/ui/aura/aura-08.png', colorCore: '#b76bff', colorEdge: '#1c0a33' },
  { name: 'Divine Aura', strengthMult: 3.8, winsRequired: 1000000, gemCost: 130, iconUrl: '/ui/aura/aura-09.png', colorCore: '#ffffff', colorEdge: '#ffd700' },
  { name: 'Celestial Aura', strengthMult: 4.2, winsRequired: 5000000, gemCost: 175, iconUrl: '/ui/aura/aura-10.png', colorCore: '#ffffff', colorEdge: '#3fa9f5' },
  { name: 'Eternal Aura', strengthMult: 4.5, winsRequired: 15000000, gemCost: 230, iconUrl: '/ui/aura/aura-11.png', colorCore: '#fff2b0', colorEdge: '#a8710a' },
  { name: 'Omega Aura', strengthMult: 4.8, winsRequired: 50000000, gemCost: 300, iconUrl: '/ui/aura/aura-12.png', colorCore: '#ff6b81', colorEdge: '#1a0008' },
  { name: 'Transcendent Aura', strengthMult: 5, winsRequired: 100000000, gemCost: 400, iconUrl: '/ui/aura/aura-13.png', colorCore: '#ffffff', colorEdge: '#c9a8ff' },
]

// store/useGameStore.js's gainPower() factor for the currently equipped aura
// — same shape as data/afk.js's afkPowerMultiplier. `equippedAura` is an
// index into AURA_TIERS, or null while nothing is equipped (1x, i.e. no-op).
export function auraStrengthMultiplier(equippedAura) {
  const tier = AURA_TIERS[equippedAura]
  return tier ? tier.strengthMult : 1
}
