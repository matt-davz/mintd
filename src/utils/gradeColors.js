// Grade badge coloring — light green (low) → dark saturated green (high).
// Keeps every grade cohesive (no red/yellow "bad grade" signaling) while still
// giving premium grades a richer, more saturated look.

// White (low grades) → Green (high grades). Solid backgrounds, no transparency.
const GREEN_TIERS = [
  { max: 1, $bg: '#e8e8e8', $fg: '#1a1a1a' },
  { max: 2, $bg: '#d4e6d4', $fg: '#1a1a1a' },
  { max: 3, $bg: '#b8d9b8', $fg: '#1a1a1a' },
  { max: 4, $bg: '#9acc9a', $fg: '#1a1a1a' },
  { max: 5, $bg: '#7cbf7c', $fg: '#1a1a1a' },
  { max: 6, $bg: '#5fb25f', $fg: '#ffffff' },
  { max: 7, $bg: '#44a244', $fg: '#ffffff' },
  { max: 8, $bg: '#2e8f2e', $fg: '#ffffff' },
  { max: 9, $bg: '#1e7a1e', $fg: '#ffffff' },
  { max: Infinity, $bg: '#146514', $fg: '#ffffff' },
]

export function gradeToNumber(grade) {
  if (!grade) return -1
  const match = String(grade).match(/(\d+(?:\.\d+)?)$/)
  return match ? parseFloat(match[1]) : -1
}

export function gradeColors(grade) {
  const n = gradeToNumber(grade)
  // Auth / non-numeric — white end of the gradient
  if (n < 0) return { $bg: '#e8e8e8', $fg: '#1a1a1a' }
  const tier = GREEN_TIERS.find(tier => n <= tier.max) ?? GREEN_TIERS[GREEN_TIERS.length - 1]
  return { $bg: tier.$bg, $fg: tier.$fg }
}
