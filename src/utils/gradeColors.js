// Grade badge coloring — light green (low) → dark saturated green (high).
// Keeps every grade cohesive (no red/yellow "bad grade" signaling) while still
// giving premium grades a richer, more saturated look.

// White (low grades) → Green (high grades). Everything on the same scale.
const GREEN_TIERS = [
  { max: 1, $bg: 'rgba(255, 255, 255, 0.12)', $fg: '#d4d4d4' },
  { max: 2, $bg: 'rgba(220, 240, 220, 0.16)', $fg: '#c4cfc5' },
  { max: 3, $bg: 'rgba(190, 230, 195, 0.22)', $fg: '#b0c8b2' },
  { max: 4, $bg: 'rgba(160, 215, 170, 0.28)', $fg: '#9ac0a0' },
  { max: 5, $bg: 'rgba(130, 200, 145, 0.34)', $fg: '#84b890' },
  { max: 6, $bg: 'rgba(100, 190, 120, 0.42)', $fg: '#6eb880' },
  { max: 7, $bg: 'rgba(75, 180, 100, 0.50)', $fg: '#5cc878' },
  { max: 8, $bg: 'rgba(50, 168, 85, 0.58)', $fg: '#4ad870' },
  { max: 9, $bg: 'rgba(34, 155, 72, 0.68)', $fg: '#3ae868' },
  { max: Infinity, $bg: 'rgba(20, 140, 60, 0.80)', $fg: '#2cfc6a' },
]

export function gradeToNumber(grade) {
  if (!grade) return -1
  const match = String(grade).match(/(\d+(?:\.\d+)?)$/)
  return match ? parseFloat(match[1]) : -1
}

export function gradeColors(grade) {
  const n = gradeToNumber(grade)
  // Auth / non-numeric — use the white end of the gradient
  if (n < 0) return { $bg: 'rgba(255, 255, 255, 0.12)', $fg: '#d4d4d4' }
  const tier = GREEN_TIERS.find(tier => n <= tier.max) ?? GREEN_TIERS[GREEN_TIERS.length - 1]
  return { $bg: tier.$bg, $fg: tier.$fg }
}
