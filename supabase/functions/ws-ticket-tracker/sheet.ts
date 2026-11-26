// Pure parser for the "WS Ticket Tracker" Google Sheet (tab Sheet1, A1:C1000).
//
// Layout (observed 2026-11-26):
//   row 1            Game | Have | Don't Have
//   section header   "1941 Yankees vs Dodgers — Yankees Win 9th World Series"
//   game row         "GM 4   Oct. 5th — Yankees - 7, Dodgers - 4" | ✓ | (blank)
//   footer           "TOTALS" | 141 | 98
//
// Only World Series sections ("YEAR Team vs Team …") are read. Anything that
// isn't confidently a World Series game row (tours, exhibitions, unknown
// headers, duplicate years/games, unclear or contradictory checkmarks) is
// skipped, never guessed. Imported by the Edge Function and by
// scripts/check-ws-ticket-matcher.mjs (Node type stripping), so keep this
// file to erasable TypeScript only.

export type TrackerGame = { year: number; game: number; row: number }

export type TrackerParse =
  | { ok: true; gamesParsed: number; missing: TrackerGame[] }
  | { ok: false; error: string }

const SECTION_RE = /^((?:18|19|20)\d{2})\s+(\S.*?)\s+vs\.?\s+(\S.*?)(?:\s+[—–-]\s+.*)?$/i
const NOT_WORLD_SERIES_RE = /\b(tour|japan|exhibition|all[- ]?star|spring|barnstorm)/i
const GAME_RE = /^(?:GM|Game)\.?\s*(\d{1,2})(?!\d)/i
const CHECKED_RE = /^(?:✓|✔|✔️|☑|☑️|✅|x|true|yes)$/i
const UNCHECKED_RE = /^(?:|false|no)$/i

function cell(row: unknown[], i: number): string {
  const v = row?.[i]
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim()
}

function mark(v: string): 'on' | 'off' | 'unclear' {
  if (UNCHECKED_RE.test(v)) return 'off'
  if (CHECKED_RE.test(v)) return 'on'
  return 'unclear'
}

function normHeader(v: string): string {
  return v.toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim()
}

/** Parse the raw `values` array from the Sheets API (majorDimension = ROWS). */
export function parseTrackerValues(values: unknown): TrackerParse {
  if (!Array.isArray(values) || values.length === 0) return { ok: false, error: 'Sheet returned no rows' }
  const head = values[0] as unknown[]
  if (normHeader(cell(head, 0)) !== 'game' || normHeader(cell(head, 1)) !== 'have' || normHeader(cell(head, 2)) !== "don't have") {
    return { ok: false, error: 'Sheet layout changed (expected header Game / Have / Don\'t Have)' }
  }

  // Pass 1: collect candidate games per year; track duplicate years/games.
  const games = new Map<string, TrackerGame & { status: 'have' | 'missing' | 'skip' }>()
  const dupGames = new Set<string>()
  const yearsSeen = new Set<number>()
  const dupYears = new Set<number>()
  let year: number | null = null

  for (let i = 1; i < values.length; i++) {
    const row = values[i] as unknown[]
    const a = cell(row, 0)
    if (!a) continue
    const g = a.match(GAME_RE)
    if (!g) {
      const s = a.match(SECTION_RE)
      year = s && !NOT_WORLD_SERIES_RE.test(a) ? Number(s[1]) : null
      if (year !== null) {
        if (yearsSeen.has(year)) dupYears.add(year)
        yearsSeen.add(year)
      }
      continue
    }
    if (year === null) continue
    const game = Number(g[1])
    if (game < 1 || game > 9) continue
    const key = `${year}:${game}`
    if (games.has(key)) dupGames.add(key)
    const have = mark(cell(row, 1))
    const dont = mark(cell(row, 2))
    const status = have === 'off' && dont === 'on' ? 'missing' : have === 'on' && dont === 'off' ? 'have' : 'skip'
    games.set(key, { year, game, row: i + 1, status })
  }

  const usable = [...games.entries()]
    .filter(([k, v]) => !dupGames.has(k) && !dupYears.has(v.year) && v.status !== 'skip')
    .map(([, v]) => v)
  const missing = usable
    .filter(v => v.status === 'missing')
    .map(({ year: y, game, row }) => ({ year: y, game, row }))
    .sort((p, q) => p.year - q.year || p.game - q.game)
  return { ok: true, gamesParsed: usable.length, missing }
}
