// Matches private auction-watchlist lots to World Series games that the
// WS Ticket Tracker sheet marks "Don't Have". Pure functions, no React.
//
// Deliberately conservative: a lot matches only when its TITLE explicitly
// names one year + "World Series" + "Game N" (or "Games 1 and 2") + a
// ticket/stub term. Anything else (non-ticket items, year ranges, game
// ranges, collections, other "World Series" leagues, conflicting game
// mentions) returns null rather than a guess. A lot never says anything
// about ownership — only the sheet does.

const YEAR_RE = /\b(18[6-9]\d|19\d{2}|20\d{2})\b/g
const WORLD_SERIES_RE = /\bworld\s+series\b/i
const TICKET_RE = /\b(?:tickets?|stubs?)\b/i
// The explicit game list right after "World Series": "Game 4", "Games 1 and 2",
// "Games 1, 2 & 3". A trailing "-N" (a range such as "Games 3-5") is rejected.
const GAME_LIST_RE = /\bworld\s+series\s*[,:–—-]?\s*games?\s+(\d{1,2}(?:\s*(?:,|&|and|\/)\s*\d{1,2})*)(?!\d)(?!\s*[-–—]\s*\d)/i
const ANY_GAME_RE = /\bgames?\s*#?\s*(\d{1,2})(?!\d)/gi
const GAME_RANGE_RE = /\bgames?\s*#?\s*\d{1,2}\s*(?:[-–—]|to|through|thru)\s*\d{1,2}\b/i
// Non-ticket items, multi-item lots and non-genuine tickets.
const EXCLUDE_RE = /\b(?:programs?|scorecards?|score\s*cards?|photos?|photographs?|pins?|pennants?|baseballs?|bats?|jerseys?|uniforms?|cards?|albums?|posters?|magazines?|lithographs?|press|pass(?:es)?|rings?|troph(?:y|ies)|letters?|reprints?|replicas?|facsimiles?|phantom|proofs?|collection|archive|group|lot\s+of)\b/i
// Other competitions also called "World Series".
const OTHER_SERIES_RE = /\b(?:little\s+league|college|negro|junior|women'?s|amateur|caribbean|softball|youth|senior)\b/i

/**
 * @returns {{ year: number, games: number[] } | null}
 */
export function parseWsTicketLotTitle(title) {
  if (typeof title !== 'string') return null
  const t = title.replace(/\s+/g, ' ').trim()
  if (!WORLD_SERIES_RE.test(t) || !TICKET_RE.test(t)) return null
  if (EXCLUDE_RE.test(t) || OTHER_SERIES_RE.test(t) || GAME_RANGE_RE.test(t)) return null

  const years = new Set([...t.matchAll(YEAR_RE)].map(m => Number(m[1])))
  if (years.size !== 1) return null
  const [year] = years

  const list = t.match(GAME_LIST_RE)
  if (!list) return null
  const games = [...new Set(list[1].split(/\s*(?:,|&|and|\/)\s*/i).map(Number))]
  if (games.some(g => !Number.isInteger(g) || g < 1 || g > 9)) return null

  // Any other "Game N" in the title must be one of the listed games.
  for (const m of t.matchAll(ANY_GAME_RE)) {
    if (!games.includes(Number(m[1]))) return null
  }
  return { year, games: games.sort((a, b) => a - b) }
}

// Mirrors SPREADSHEET_ID in supabase/functions/ws-ticket-tracker/index.ts.
const WS_TRACKER_SPREADSHEET_ID = '120JePbptof1PYYnld1HPsNnMzAoyxGBrf0GWBq7EuSU'

/** Link to one row of the WS Ticket Tracker sheet (Sheet1, gid=0). */
export function wsTrackerRowUrl(row) {
  return `https://docs.google.com/spreadsheets/d/${WS_TRACKER_SPREADSHEET_ID}/edit#gid=0&range=A${row}`
}

/**
 * How long after the SCHEDULED close a lot not confirmed closed is still
 * shown, to cover extended/soft-close bidding. After this it is hidden.
 */
export const EXTENDED_BIDDING_GRACE_MS = 24 * 3600 * 1000

/**
 * Whether a lot may still be up for auction at `now`:
 *  - lot_status 'closed' → no
 *  - no (or unparseable) scheduled close → no; there is no reliable rule to
 *    say it's currently up, so it isn't presented as an opportunity
 *  - otherwise yes until scheduled close + EXTENDED_BIDDING_GRACE_MS
 */
export function isLotPossiblyOpen(lot, now) {
  if (!lot || lot.lot_status === 'closed') return false
  const close = lot.scheduled_close_at ? new Date(lot.scheduled_close_at).getTime() : NaN
  if (!Number.isFinite(close)) return false
  return now <= close + EXTENDED_BIDDING_GRACE_MS
}

/**
 * Cross-reference sheet "Don't Have" games with watchlist lots. Only lots
 * passing isLotPossiblyOpen(lot, now) are considered.
 *
 * @param {{ year: number, game: number, row: number }[]} missing
 * @param {object[]} lots  auction_watchlist_lots rows
 * @param {number} now  epoch ms (required — passed from the page clock)
 * @returns {{ year, game, row, lots: { lot, games: number[] }[] }[]}  one entry per missing game with ≥1 lot
 */
export function buildWsOpportunities(missing, lots, now) {
  if (!Number.isFinite(now)) throw new TypeError('buildWsOpportunities: now (epoch ms) is required')
  const byKey = new Map()
  for (const m of missing ?? []) byKey.set(`${m.year}:${m.game}`, { ...m, lots: [] })

  for (const lot of lots ?? []) {
    if (!isLotPossiblyOpen(lot, now)) continue
    const parsed = parseWsTicketLotTitle(lot.title)
    if (!parsed) continue
    for (const g of parsed.games) {
      byKey.get(`${parsed.year}:${g}`)?.lots.push({ lot, games: parsed.games })
    }
  }

  const closeMs = l => new Date(l.scheduled_close_at).getTime()
  return [...byKey.values()]
    .filter(e => e.lots.length > 0)
    .map(e => ({ ...e, lots: e.lots.sort((a, b) => closeMs(a.lot) - closeMs(b.lot)) }))
    .sort((a, b) => a.year - b.year || a.game - b.game)
}
