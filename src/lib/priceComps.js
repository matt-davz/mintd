// Price comps helpers — pure functions, no React.
//
// A comp is an auction lot tracked only to learn its verified closing price
// (not purchase intent). Mirrors the CHECK constraints in migration 0041.

export const PRICE_BASES = {
  hammer: { label: 'Hammer', long: "Hammer price (excludes buyer's premium)" },
  buyer_premium_inclusive: { label: 'Incl. BP', long: "Includes buyer's premium" },
  unknown: { label: 'Basis unknown', long: 'Basis unknown (source did not say)' },
}

export const PRICE_BASIS_KEYS = Object.keys(PRICE_BASES)

export const COMP_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
]

const MAX_URL_LENGTH = 1000

/** A comp is verified only once a final price has been recorded from results. */
export const isVerified = comp => comp.final_price != null

/** True while the scheduled close is still in the future — no final price can exist yet. */
export function isBeforeScheduledClose(comp, nowMs) {
  return !!comp.scheduled_close_at && new Date(comp.scheduled_close_at).getTime() > nowMs
}

/** Validate an https link (same shape as the DB CHECK). Returns { url } or { error }. */
export function validateHttpsUrl(input, label = 'URL') {
  const raw = (input ?? '').trim()
  if (!raw) return { error: `${label} is required.` }
  if (raw.length > MAX_URL_LENGTH) return { error: `${label} is too long.` }
  let url
  try {
    url = new URL(raw)
  } catch {
    return { error: `${label} is not a valid URL.` }
  }
  if (url.protocol !== 'https:') return { error: `${label} must start with https://.` }
  if (url.username || url.password || !url.hostname.includes('.')) return { error: `${label} is not supported.` }
  return { url: url.href }
}

/** "$1,250" / "1250.50" → 1250 / 1250.5; null when not a valid dollar amount. */
export function parseDollarAmount(input) {
  const cleaned = String(input ?? '').replace(/[$,\s]/g, '')
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(cleaned)) return null
  return Number(cleaned)
}

/** Pending first (soonest close first), then verified (most recently verified first). */
export function sortComps(comps) {
  const time = iso => (iso ? new Date(iso).getTime() : Infinity)
  return [...comps].sort((a, b) => {
    const va = isVerified(a)
    const vb = isVerified(b)
    if (va !== vb) return va ? 1 : -1
    if (!va) return time(a.scheduled_close_at) - time(b.scheduled_close_at) || a.title.localeCompare(b.title)
    return time(b.verified_at) - time(a.verified_at) || a.title.localeCompare(b.title)
  })
}
