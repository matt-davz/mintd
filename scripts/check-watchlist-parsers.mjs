#!/usr/bin/env node
// Parser checks for the auction-watchlist Firecrawl adapters.
//
//   node scripts/check-watchlist-parsers.mjs [greyJson] [heritageNoBidJson] [heritageActiveJson]
//
// Every check runs against the small inline fixtures below, so a clean checkout
// always runs (and must pass) the full set of assertions. The fixtures are
// minimal synthetic snippets that mirror the structure of real Firecrawl
// markdown observed for these pages (same labels, line breaks, URL shapes);
// they are not copies of the pages.
//
// Optional: saved full Firecrawl responses (CLI JSON or REST v2 JSON, never
// committed) are also run through the same lot checks when present. Defaults
// are /tmp/mintd-*-firecrawl.json; a default that doesn't exist is reported and
// left out, but a path passed explicitly on the command line must exist.
// Requires Node >= 22.18 (built-in TypeScript type stripping).

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildGreyFlannelUrl, extractFirecrawlDoc, parseGreyFlannel, parseHeritage, validateHeritageUrl,
} from '../supabase/functions/auction-watchlist-refresh/parsers.ts'

const MIN_FIXTURE_CHECKS = 10

// ── Inline fixtures ──────────────────────────────────────────────────────────

const GREY_URL = 'https://bid.greyflannelauctions.com/bids/bidplace?itemid=59791'
const GREY_IMG = (n, id) => `https://bid.greyflannelauctions.com/images_items/item_59791_${n}_${id}.jpg`

// CLI-style JSON ({ markdown, metadata }).
const GREY_FIXTURE = {
  markdown: [
    `- [Auction](${GREY_URL}#_)`,
    '',
    'End:',
    '12/13/2026 8:00 PM EST',
    '',
    '[Prev](https://bid.greyflannelauctions.com/bids/bidplace.aspx?itemid=59790 "Previous Lot") [Next](https://bid.greyflannelauctions.com/bids/bidplace.aspx?itemid=59792 "Next Lot")',
    '',
    '## Lot \\#  150:  2017 Shohei Ohtani Nippon-Ham Fighters Game-Used Jersey (Final Season In Japan)',
    '',
    'Category:',
    'Baseball',
    '',
    'Starting Bid: **$1,000.00**',
    '',
    'Bids: **5**(Bid History)',
    '',
    'Time Left: **17 days 14:46:32**',
    '',
    'Add To Watchlist',
    '',
    '### CURRENT BID:  $1,464.00',
    '',
    'Bidder Number: \\*',
    '',
    `[![](${GREY_IMG(1, 230175)})\\\\`,
    '',
    `Zoom](${GREY_IMG(1, 230175)} "")`,
    '',
    `![](${GREY_IMG(1, 230175)})![](${GREY_IMG(2, 230176)})`,
  ].join('\n'),
  metadata: { url: GREY_URL, sourceURL: GREY_URL, statusCode: 200 },
}

const HERITAGE_NOBID_URL = 'https://sports.ha.com/itm/baseball-collectibles/balls/1937-new-york-yankees-team-signed-baseball-with-lou-gehrig-sweet-spot/a/50089-81460.s'
const HERITAGE_SESSION = [
  '2026 December 18 - 20 Winter Sports Catalog Auction #50089 [(go to Auction Home page)](https://sports.ha.com/c/auction-home.zx?saleNo=50089)',
  '',
  '**This lot is in: 2 - [Signature Internet Extended Bid Session](https://sports.ha.com/c/search.zx?saleNo=50089&sessionNo=2) \\- Extended Bidding**:',
  '',
  '(Lots 81422-82181) - 10:00 PM Central Time, Saturday, December 19, 2026.',
]

// REST v2 envelope ({ success, data: { markdown, metadata } }).
const HERITAGE_NOBID_FIXTURE = {
  success: true,
  data: {
    markdown: [
      'Lot #81460',
      '',
      'LOT #81460  \\|',
      '',
      '',
      'Starting Bid: $2,000',
      '',
      '# 1937 New York Yankees Team Signed Baseball with Lou Gehrig Sweet Spot. ...',
      '',
      '- ![1937 New York Yankees Team Signed Baseball with Lou Gehrig Sweet Spot. ...](https://dyn1.heritagestatic.com/ha?p=3-5-6-3-1-35631860&w=850&h=600&it=product)',
      '',
      'Starting Bid:',
      '',
      `**$2,000** w/ Buyer's Premium (BP) : $2,440.00 [Reload to see live data](${HERITAGE_NOBID_URL})`,
      '',
      'Status: Starting Bid Not Met',
      '',
      'Time Left:23d17h46m23 days',
      '',
      'Bid Next Minimum: $2,000 ($2,440.00 w/ BP)',
      '',
      ...HERITAGE_SESSION,
      '',
      'Bids + Registered Phone Bidders: 0',
      '',
      'Starting Bid:',
      '',
      '',
      '**$2,000**',
      '',
      "w/ Buyer's Premium (BP) : $2,440.00Minimum Next Bid: **$2,000 ($2,440.00 w/ BP)**",
    ].join('\n'),
    metadata: {
      url: HERITAGE_NOBID_URL, sourceURL: HERITAGE_NOBID_URL, ogUrl: HERITAGE_NOBID_URL,
      ogImage: 'https://dyn1.heritagestatic.com/ha?p=3-5-6-3-1-35631860&it=product', statusCode: 200,
    },
  },
}

// Parser fixture only: 50089-81457 is NOT a watchlist lot and must never be seeded.
const HERITAGE_ACTIVE_URL = 'https://sports.ha.com/itm/baseball-collectibles/balls/1934-tour-of-japan-team-signed-baseball/a/50089-81457.s'
const HERITAGE_ACTIVE_FIXTURE = {
  success: true,
  data: {
    markdown: [
      'Lot #81457',
      '',
      'LOT #81457  \\|',
      '',
      'Current Bid: $3,000',
      '',
      '# 1934 Tour of Japan Team Signed Baseball....',
      '',
      'Current Bid:',
      '',
      `**$3,000** w/ Buyer's Premium (BP) : $3,660.00 [Reload to see live data](${HERITAGE_ACTIVE_URL})`,
      '',
      'Status: Reserve (If Any) Will post on 12/15/2026 7pm CT',
      '',
      'Time Left:23d17h45m23 days',
      '',
      'Bid Next Minimum: $3,100 ($3,782.00 w/ BP)',
      '',
      ...HERITAGE_SESSION,
      '',
      'Bids + Registered Phone Bidders: 1',
    ].join('\n'),
    metadata: {
      url: HERITAGE_ACTIVE_URL, sourceURL: HERITAGE_ACTIVE_URL, ogUrl: HERITAGE_ACTIVE_URL,
      ogImage: 'https://dyn1.heritagestatic.com/ha?p=3-5-7-0-6-35706845&it=product', statusCode: 200,
    },
  },
}

// ── Runner ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const samplePaths = [
  args[0] ?? '/tmp/mintd-grey-firecrawl.json',
  args[1] ?? '/tmp/mintd-heritage-firecrawl.json',
  args[2] ?? '/tmp/mintd-heritage-active-firecrawl.json',
]

let fixtureChecks = 0
let sampleChecks = 0
let failed = 0
function check(name, fn, kind = 'fixture') {
  try {
    fn()
    if (kind === 'fixture') fixtureChecks++
    else sampleChecks++
    console.log(`ok   ${name}`)
  } catch (err) {
    failed++
    console.log(`FAIL ${name}\n     ${err.message.split('\n').join('\n     ')}`)
  }
}

function toDoc(json, label) {
  const doc = extractFirecrawlDoc(json)
  assert.ok(doc, `${label}: not a Firecrawl document`)
  return doc
}

/** Load an optional full sample; null if a default path is absent. */
function loadSample(i) {
  const path = samplePaths[i]
  if (!existsSync(path)) {
    if (args[i] !== undefined) throw new Error(`Sample file not found: ${path}`)
    console.log(`note optional sample ${path} not present (inline fixture only)`)
    return null
  }
  return { path, doc: toDoc(JSON.parse(readFileSync(path, 'utf8')), path) }
}

/** Run a lot check on the inline fixture, then on the full sample if present. */
function lotCheck(name, fixture, sampleIndex, fn) {
  check(`${name} [fixture]`, () => fn(toDoc(fixture, 'fixture')))
  const sample = samples[sampleIndex]
  if (sample) check(`${name} [sample ${sample.path}]`, () => fn(sample.doc), 'sample')
}

const samples = samplePaths.map((_, i) => loadSample(i))

// ── Lot checks (fixture, + optional full sample) ─────────────────────────────

lotCheck('Grey Flannel: labelled CURRENT BID, lot, image, end time', GREY_FIXTURE, 0, (doc) => {
  const r = parseGreyFlannel(doc, { lotId: '59791', lotNumber: '150' })
  assert.equal(r.ok, true, r.reason)
  assert.equal(r.currentBid, 1464)
  assert.equal(r.openingBid, 1000)
  assert.equal(r.noBids, false)
  assert.equal(r.lotNumber, '150')
  assert.match(r.title, /^2017 Shohei Ohtani Nippon-Ham Fighters Game-Used Jersey/)
  assert.equal(r.imageUrl, 'https://bid.greyflannelauctions.com/images_items/item_59791_1_230175.jpg')
  assert.equal(r.endTime, '2026-12-14T01:00:00.000Z') // 12/13/2026 8:00 PM EST
  assert.equal(r.status, 'live')
})

lotCheck('Grey Flannel: rejects wrong lot number / item id', GREY_FIXTURE, 0, (doc) => {
  assert.equal(parseGreyFlannel(doc, { lotId: '59791', lotNumber: '151' }).ok, false)
  assert.equal(parseGreyFlannel(doc, { lotId: '59792', lotNumber: null }).ok, false)
  const bare = { markdown: doc.markdown, metadata: {} }
  assert.equal(parseGreyFlannel(bare, { lotId: '59791', lotNumber: '150' }).ok, true)
  assert.equal(parseGreyFlannel(bare, { lotId: '59792', lotNumber: null }).ok, false)
})

lotCheck('Heritage no-bid: no current bid, opening bid captured separately', HERITAGE_NOBID_FIXTURE, 1, (doc) => {
  const r = parseHeritage(doc, { lotId: '50089-81460' })
  assert.equal(r.ok, true, r.reason)
  assert.equal(r.currentBid, null) // never the $2,000 starting bid
  assert.equal(r.noBids, true)
  assert.equal(r.openingBid, 2000)
  assert.equal(r.lotNumber, '81460')
  assert.equal(r.endTime, '2026-12-20T04:00:00.000Z') // 10:00 PM Central, Dec 19 2026
  assert.equal(r.imageUrl, 'https://dyn1.heritagestatic.com/ha?p=3-5-6-3-1-35631860&it=product')
  assert.match(r.title, /^1937 New York Yankees Team Signed Baseball with Lou Gehrig Sweet Spot/)
})

lotCheck('Heritage: rejects page for a different lot', HERITAGE_NOBID_FIXTURE, 1, (doc) => {
  assert.equal(parseHeritage(doc, { lotId: '50089-81461' }).ok, false)
  assert.equal(parseHeritage(doc, { lotId: '50090-81460' }).ok, false)
  // Markdown alone (no metadata URL) must still identify the lot.
  const bare = { markdown: doc.markdown, metadata: {} }
  assert.equal(parseHeritage(bare, { lotId: '50089-81460' }).ok, true)
  assert.equal(parseHeritage(bare, { lotId: '50089-81461' }).ok, false)
  assert.equal(parseHeritage(bare, { lotId: '50090-81460' }).ok, false)
})

// Parser fixture only (50089-81457 is not a watchlist lot; never seed it).
lotCheck('Heritage active: Current Bid parsed, Bid Next Minimum ignored', HERITAGE_ACTIVE_FIXTURE, 2, (doc) => {
  const r = parseHeritage(doc, { lotId: '50089-81457' })
  assert.equal(r.ok, true, r.reason)
  assert.equal(r.currentBid, 3000) // not the $3,100 next minimum
  assert.equal(r.noBids, false)
  assert.equal(r.openingBid, null)
  assert.equal(r.endTime, '2026-12-20T04:00:00.000Z')
  assert.equal(r.lotNumber, '81457')
})

// ── Pure checks (no files) ───────────────────────────────────────────────────

check('Grey Flannel URL rebuilt from numeric id only', () => {
  assert.equal(buildGreyFlannelUrl('59791'), 'https://bid.greyflannelauctions.com/bids/bidplace?itemid=59791')
  for (const bad of ['', '59791&x=1', '../1', '1'.repeat(11), '59791 ']) assert.equal(buildGreyFlannelUrl(bad), null, bad)
})

check('Heritage canonical URL validation', () => {
  const good = 'https://sports.ha.com/itm/baseball-collectibles/balls/1937-new-york-yankees-team-signed-baseball-with-lou-gehrig-sweet-spot/a/50089-81460.s'
  assert.equal(validateHeritageUrl(good, '50089-81460'), good)
  assert.equal(validateHeritageUrl(good.replace('sports.', 'www.'), '50089-81460'), good.replace('sports.', 'www.'))
  const bad = [
    [good, '50089-81461'],
    [good.replace('https:', 'http:'), '50089-81460'],
    [good.replace('sports.ha.com', 'sports.ha.com.evil.test'), '50089-81460'],
    [good.replace('sports.ha.com', 'evil.ha.com'), '50089-81460'],
    [good.replace('sports.ha.com', 'user:pw@sports.ha.com'), '50089-81460'],
    [good.replace('sports.ha.com', 'sports.ha.com:8443'), '50089-81460'],
    [good + '?ic4=x', '50089-81460'],
    [good + '#frag', '50089-81460'],
    [good.replace('/itm/', '/itm/../'), '50089-81460'],
    [good.replace('/itm/', '/itm/%2e%2e/'), '50089-81460'],
    ['https://SPORTS.HA.COM/itm/x/a/50089-81460.s', '50089-81460'],
    ['https://sports.ha.com/c/a/50089-81460.s', '50089-81460'],
    [null, '50089-81460'],
  ]
  for (const [url, id] of bad) assert.equal(validateHeritageUrl(url, id), null, String(url))
})

check('Labels other than "Current Bid" are never read as the current bid', () => {
  const md = [
    'LOT #81460', '[Auction #50089](https://sports.ha.com/c/auction-home.zx?saleNo=50089)',
    'Starting Bid: $2,000', 'Bid Next Minimum: $2,000 ($2,440.00 w/ BP)',
    "Minimum Next Bid: **$2,000 ($2,440.00 w/ BP)**", 'Status: Reserve Not Met',
  ].join('\n')
  const r = parseHeritage({ markdown: md, metadata: {} }, { lotId: '50089-81460' })
  // Not explicitly a no-bid lot (status unclear, no bid count) → refuse rather than guess.
  assert.equal(r.ok, false)
})

check('Grey Flannel with 0 bids reports no current bid', () => {
  const md = '## Lot \\#  9:  Thing\n\nStarting Bid: **$500.00**\n\nBids: **0**\n\n### CURRENT BID:  $500.00\n![](https://bid.greyflannelauctions.com/images_items/item_123_1_4.jpg)'
  const r = parseGreyFlannel({ markdown: md, metadata: {} }, { lotId: '123', lotNumber: '9' })
  assert.equal(r.ok, true, r.reason)
  assert.equal(r.currentBid, null)
  assert.equal(r.noBids, true)
  assert.equal(r.openingBid, 500)
})

check('REST v2 envelope unwrapped; unsuccessful responses rejected', () => {
  assert.equal(extractFirecrawlDoc({ success: true, data: { markdown: 'x', metadata: { statusCode: 200 } } }).markdown, 'x')
  assert.equal(extractFirecrawlDoc({ success: false, error: 'nope' }), null)
  assert.equal(extractFirecrawlDoc({ success: true, data: { markdown: '' } }), null)
})

console.log(`\n${fixtureChecks} fixture checks passed, ${sampleChecks} sample checks passed, ${failed} failed`)
if (failed > 0) process.exit(1)
if (fixtureChecks < MIN_FIXTURE_CHECKS) {
  console.error(`Expected at least ${MIN_FIXTURE_CHECKS} fixture checks, ran ${fixtureChecks}`)
  process.exit(1)
}
