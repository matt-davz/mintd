// Grade badge coloring — light green (low) → dark saturated green (high).
// Keeps every grade cohesive (no red/yellow "bad grade" signaling) while still
// giving premium grades a richer, more saturated look.

const GOLD = { $bg: 'rgba(143, 113, 0, 0.45)', $fg: '#ffe08d' }

const GREEN_TIERS = [
  { max: 2, $bg: 'rgba(74, 175, 96, 0.18)', $fg: '#8ab892' },
  { max: 4, $bg: 'rgba(70, 178, 98, 0.28)', $fg: '#7ecc8a' },
  { max: 6, $bg: 'rgba(60, 175, 96, 0.40)', $fg: '#6ed88e' },
  { max: 8, $bg: 'rgba(46, 168, 92, 0.52)', $fg: '#5ae890' },
  { max: 9, $bg: 'rgba(34, 150, 84, 0.65)', $fg: '#44f09a' },
  { max: Infinity, $bg: 'rgba(22, 130, 74, 0.80)', $fg: '#30ffa4' },
]

export function gradeToNumber(grade) {
  if (!grade) return -1
  const match = String(grade).match(/(\d+(?:\.\d+)?)$/)
  return match ? parseFloat(match[1]) : -1
}

export function gradeColors(grade) {
  const n = gradeToNumber(grade)
  if (n < 0) return GOLD
  const tier = GREEN_TIERS.find(tier => n <= tier.max) ?? GREEN_TIERS[GREEN_TIERS.length - 1]
  return { $bg: tier.$bg, $fg: tier.$fg }
}
