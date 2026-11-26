#!/usr/bin/env node
// Checks for the WS Ticket Tracker sheet parser and the lot-title matcher.
//
//   node scripts/check-ws-ticket-matcher.mjs
//
// Pure, offline: inline fixtures only (synthetic rows shaped like the real
// sheet; no sheet data or credentials). Requires Node >= 22.18 (TS stripping).

import assert from 'node:assert/strict'
import { parseTrackerValues } from '../supabase/functions/ws-ticket-tracker/sheet.ts'
import { EXTENDED_BIDDING_GRACE_MS, buildWsOpportunities, isLotPossiblyOpen, parseWsTicketLotTitle, wsTrackerRowUrl } from '../src/lib/wsTicketOpportunities.js'

let passed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { console.error(`✗ ${name}\n  ${e.message}`); process.exitCode = 1 }
}

// ── Lot-title matcher: known positives ───────────────────────────────────────

const POSITIVE = [
  ['1941 World Series Game 4 – Mickey Owen Drops Third Strike – Ticket Stub PSA VG-EX 4 (Pop 2, One Higher)', 1941, [4]],
  ['1960 World Series Game 1 ticket stub, Clemente debut', 1960, [1]],
  ['1963 Yankees–Dodgers World Series Games 1 and 2 ticket stub pair, Koufax 15 strikeouts in Game 1', 1963, [1, 2]],
  ['1963 World Series Game 1 Koufax-signed ticket stub', 1963, [1]],
  ['1963 World Series Game 2 full ticket', 1963, [2]],
  ['1956 World Series Game 6 ticket stub, Jackie Robinson walk-off', 1956, [6]],
  ['1947 Brooklyn Dodgers–Yankees World Series Game 4 ticket stub, Jackie Robinson\'s first World Series', 1947, [4]],
  ['2000 Mets–Yankees World Series Game 5 full ticket PSA MINT 9, Derek Jeter MVP', 2000, [5]],
  ['1996 Yankees–Braves World Series Game 1 full ticket PSA MINT 9, Smoltz vs. Pettitte', 1996, [1]],
  ['1923 WORLD SERIES GAMES 2 & 6 TICKET STUBS', 1923, [2, 6]],
  ['1951 World Series Games 1, 2 and 3 ticket stubs', 1951, [1, 2, 3]],
]
for (const [title, year, games] of POSITIVE) {
  check(`match: ${title}`, () => assert.deepEqual(parseWsTicketLotTitle(title), { year, games }))
}

// ── Lot-title matcher: false positives that must NOT match ──────────────────

const NEGATIVE = [
  '1952–1961 Yankees World Series ticket stub PSA-graded trio', // year range
  '1927 Yankees World Series program', // not a ticket
  '1926 Ruth and Hornsby World Series Type I photo',
  '1961 Mantle and Maris program and ticket collection', // no WS / collection
  'July 6, 1941 Yankees program and ticket stub pair, DiMaggio 47th and 48th consecutive hits',
  'June 16, 1941 DiMaggio hit-streak ticket stub', // no World Series
  'October 21, 1956 Brooklyn Dodgers Tour of Japan ticket stub PSA VG 3, Jackie Robinson pictured',
  '9/21/90 Ken Griffey Jr. Steals Fly Ball from Ken Griffey Sr. Ticket Stub PSA NM 7',
  '1941 World Series ticket stub', // no game number
  '1960 World Series Game 7 program and ticket stub', // program + ticket combo
  '1960 World Series Game 7 press pin',
  '1955 World Series Games 3-5 ticket stubs', // game range
  '1955 World Series Game 3 through 5 ticket stubs',
  '1962 World Series Game 7 ticket stub with 1963 Game 1 stub', // two years
  '1958 World Series Game 7 ticket stub, Game 6 rain check', // conflicting game mention
  '1957 Little League World Series Game 2 ticket',
  '1977 College World Series Game 1 ticket stub',
  '1943 Negro League World Series Game 2 ticket stub',
  '1936 World Series Game 2 phantom ticket',
  '1932 World Series Game 3 reprint ticket stub',
  'World Series Game 4 ticket stub', // no year
  '1977 World Series Game 6 ticket stub collection',
  '1999 World Series Game 10 ticket', // impossible game
  '1964 World Series Game 7 unused ticket and baseball',
  '',
]
for (const title of NEGATIVE) {
  check(`no match: ${title || '(empty)'}`, () => assert.equal(parseWsTicketLotTitle(title), null))
}
check('no match: non-string', () => assert.equal(parseWsTicketLotTitle(null), null))

// ── Sheet parser ────────────────────────────────────────────────────────────

const HEADER = ['Game', 'Have', 'Don\'t Have']
const SHEET = [
  HEADER,
  ['1941 Yankees vs Dodgers — Yankees Win 9th World Series'],
  ['GM 1   Oct. 1st — Yankees - 3, Dodgers - 2', '✓'],
  ['GM 4   Oct. 5th — Yankees - 7, Dodgers - 4', '', '✓'],
  ['1960 Yankees vs Pirates — Pirates Win'],
  ['GM 1   Oct. 5th — Pirates - 6, Yankees - 4', '', '✓'],
  ['GM 2   Oct. 6th — Yankees - 16, Pirates - 3', '✓', '✓'], // contradictory → skipped
  ['GM 3   Oct. 8th — Yankees - 10, Pirates - 0', '?', ''], // unclear → skipped
  ['1963 Yankees vs Dodgers — Dodgers Win'],
  ['GM 1   Oct. 2nd — Dodgers - 5, Yankees - 2', '', '✓'],
  ['GM 2   Oct. 3rd — Dodgers - 4, Yankees - 1', 'FALSE', 'TRUE'],
  ['1934 Tour of Japan — All-Americans'], // not a World Series section
  ['GM 1   Nov. 2nd', '', '✓'],
  ['1955 Yankees vs Dodgers — Dodgers Win'],
  ['GM 3   Sep. 30th', '', '✓'],
  ['GM 3   Oct. 1st', '', '✓'], // duplicate game → dropped
  ['TOTALS', '141', '98'],
  ['GM 9   orphan after totals', '', '✓'],
]

check('sheet: missing games, rows, skips', () => {
  const r = parseTrackerValues(SHEET)
  assert.equal(r.ok, true)
  assert.deepEqual(r.missing, [
    { year: 1941, game: 4, row: 4 },
    { year: 1960, game: 1, row: 6 },
    { year: 1963, game: 1, row: 10 },
    { year: 1963, game: 2, row: 11 },
  ])
  assert.equal(r.gamesParsed, 5) // 1941 G1/G4, 1960 G1, 1963 G1/G2
})
check('sheet: curly apostrophe header accepted', () => {
  assert.equal(parseTrackerValues([['Game', 'Have', 'Don’t Have']]).ok, true)
})
check('sheet: changed layout rejected', () => {
  assert.equal(parseTrackerValues([['Series', 'Owned', 'Missing']]).ok, false)
  assert.equal(parseTrackerValues([]).ok, false)
  assert.equal(parseTrackerValues(null).ok, false)
})
check('sheet: duplicate year section dropped', () => {
  const r = parseTrackerValues([HEADER, ['1941 Yankees vs Dodgers'], ['GM 4', '', '✓'], ['1941 Yankees vs Dodgers'], ['GM 5', '', '✓']])
  assert.deepEqual(r.missing, [])
})

// ── Cross-reference ─────────────────────────────────────────────────────────

const lot = (id, title, extra = {}) => ({ id, title, house: 'rea', lot_number: id, scheduled_close_at: '2026-12-05T03:00:00Z', ...extra })
const LOTS = [
  lot('a', '1941 World Series Game 4 – Mickey Owen Drops Third Strike – Ticket Stub PSA VG-EX 4', { house: 'lelands' }),
  lot('b', '1960 World Series Game 1 ticket stub, Clemente debut', { house: 'huggins_scott' }),
  lot('c', '1963 Yankees–Dodgers World Series Games 1 and 2 ticket stub pair, Koufax 15 strikeouts in Game 1'),
  lot('d', '1963 World Series Game 1 Koufax-signed ticket stub', { scheduled_close_at: '2026-12-01T03:00:00Z' }),
  lot('e', '1941 World Series Game 1 ticket stub'), // sheet says Have → no entry
  lot('f', '1963 World Series Game 2 full ticket', { lot_status: 'closed' }), // closed → hidden
  lot('g', '1927 Yankees World Series program'),
]

const NOW = Date.parse('2026-11-26T12:00:00Z')
const HOUR = 3600 * 1000

check('cross-reference: multi-lot game, multi-game lot, closed hidden, Have ignored', () => {
  const { missing } = parseTrackerValues(SHEET)
  const out = buildWsOpportunities(missing, LOTS, NOW)
  assert.deepEqual(out.map(e => [e.year, e.game, e.row, e.lots.map(l => l.lot.id)]), [
    [1941, 4, 4, ['a']],
    [1960, 1, 6, ['b']],
    [1963, 1, 10, ['d', 'c']], // nearest close first
    [1963, 2, 11, ['c']],
  ])
  assert.deepEqual(out[2].lots[1].games, [1, 2])
})

// ── Close-time window ───────────────────────────────────────────────────────

const MISSING_1960 = [{ year: 1960, game: 1, row: 6 }]
const at = (closeMs, extra = {}) =>
  lot('x', '1960 World Series Game 1 ticket stub', { scheduled_close_at: new Date(closeMs).toISOString(), lot_status: 'live', ...extra })
const shown = l => buildWsOpportunities(MISSING_1960, [l], NOW).length === 1

check('window: before scheduled close → shown', () => assert.equal(shown(at(NOW + 2 * HOUR)), true))
check('window: past close, within grace → shown', () => assert.equal(shown(at(NOW - 23 * HOUR)), true))
check('window: exactly at grace edge → shown', () => assert.equal(shown(at(NOW - EXTENDED_BIDDING_GRACE_MS)), true))
check('window: past grace → hidden', () => assert.equal(shown(at(NOW - 25 * HOUR)), false))
check('window: long past (2020) → hidden', () => assert.equal(shown(at(Date.parse('2020-01-01T00:00:00Z'))), false))
check('window: confirmed closed before close → hidden', () => assert.equal(shown(at(NOW + 2 * HOUR, { lot_status: 'closed' })), false))
check('window: confirmed closed within grace → hidden', () => assert.equal(shown(at(NOW - HOUR, { lot_status: 'closed' })), false))
check('window: no scheduled close → hidden', () => {
  assert.equal(shown(at(NOW, { scheduled_close_at: null })), false)
  assert.equal(shown(at(NOW, { scheduled_close_at: 'not a date' })), false)
  assert.equal(isLotPossiblyOpen(null, NOW), false)
})
check('window: now is required', () => {
  assert.throws(() => buildWsOpportunities(MISSING_1960, [], undefined), TypeError)
})
check('cross-reference: empty inputs', () => {
  assert.deepEqual(buildWsOpportunities([], LOTS, NOW), [])
  assert.deepEqual(buildWsOpportunities(null, null, NOW), [])
})
check('sheet row link: exact row on gid=0', () => {
  assert.equal(wsTrackerRowUrl(42), 'https://docs.google.com/spreadsheets/d/120JePbptof1PYYnld1HPsNnMzAoyxGBrf0GWBq7EuSU/edit#gid=0&range=A42')
})

const MIN_CHECKS = POSITIVE.length + NEGATIVE.length + 16
assert.ok(passed >= MIN_CHECKS || process.exitCode, `expected ≥ ${MIN_CHECKS} checks, ran ${passed}`)
console.log(process.exitCode ? `FAILED (${passed} passed)` : `✓ ${passed} checks passed`)
