// Big-number presentation (Tech.md §4: format.js is the one place the number
// *presentation* is decided — not balance). Pure functions of primitives only,
// no React, no store import, so any HUD readout can depend on it freely.

// K, M, B, T, then two-letter packs aa, ab, ac … once past trillions. Numbers
// here are plain JS doubles (Tech.md §4), so this never has to reason about
// BigInt or per-tick allocation.
const SUFFIXES = ['', 'K', 'M', 'B', 'T']

// Two-letter suffix for the Nth tier past T (0 -> "aa", 1 -> "ab", 26 -> "ba").
function packSuffix(over) {
  const hi = Math.floor(over / 26)
  const lo = over % 26
  return String.fromCharCode(97 + hi) + String.fromCharCode(97 + lo)
}

// 2480 -> "2.48K", 50 -> "50", 12_300_000 -> "12.3M". Sub-1000 values pass
// through as-is (integers plain, fractions to one decimal); at and above 1000
// the mantissa carries 2 decimals under 10, 1 under 100, none above, with
// trailing zeros trimmed so it reads "3M", not "3.00M".
export function formatShort(n) {
  if (!Number.isFinite(n)) return '0'
  const neg = n < 0
  let v = Math.abs(n)

  if (v < 1000) {
    const s = Number.isInteger(v) ? String(v) : v.toFixed(1)
    return neg ? `-${s}` : s
  }

  let tier = 0
  while (v >= 1000) {
    v /= 1000
    tier++
  }

  const suffix =
    tier < SUFFIXES.length ? SUFFIXES[tier] : packSuffix(tier - SUFFIXES.length)

  const digits = v < 10 ? 2 : v < 100 ? 1 : 0
  let mantissa = v.toFixed(digits)
  if (mantissa.includes('.')) mantissa = mantissa.replace(/\.?0+$/, '')

  return `${neg ? '-' : ''}${mantissa}${suffix}`
}
