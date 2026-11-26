#!/usr/bin/env node
// Parser checks for the auction-watchlist Firecrawl adapters.
//
//   node scripts/check-watchlist-parsers.mjs [greyJson] [heritageNoBidJson] [heritageActiveJson] [lotg49085Json] [lotg49605Json] [lelands138859Json]
//
// Every check runs against the small inline fixtures below, so a clean checkout
// always runs (and must pass) the full set of assertions. The fixtures are
// minimal synthetic snippets that mirror the structure of real Firecrawl
// markdown observed for these pages (same labels, line breaks, URL shapes);
// they are not copies of the pages.
//
// Optional: saved full Firecrawl responses (CLI JSON or REST v2 JSON, never
// committed) are also run through the same lot checks when present. Defaults
// are /tmp/mintd-*-firecrawl.json, /tmp/lotg-<itemid>.json and /tmp/lelands-<itemid>.json; a default that doesn't exist is reported and
// left out, but a path passed explicitly on the command line must exist.
// Requires Node >= 22.18 (built-in TypeScript type stripping).

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildGreyFlannelUrl, buildLelandsUrl, buildLoveOfTheGameUrl, extractFirecrawlDoc, parseGreyFlannel, parseHeritage,
  parseLelands, parseLoveOfTheGame, validateHeritageUrl,
} from '../supabase/functions/auction-watchlist-refresh/parsers.ts'
import { parseLotUrl } from '../src/lib/auctionWatchlist.js'

const MIN_FIXTURE_CHECKS = 24

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

// Love of the Game (same CreateAuction page as Grey Flannel). No-bid lots echo
// "CURRENT BID: $0.00", and the auction header prints EDT even in December.
const LOTG_HOST = 'https://bid.loveofthegameauctions.com'
function lotgFixture({ itemId, lotNo, title, starting, imgId, prev, next }) {
  const url = `${LOTG_HOST}/bids/bidplace?itemid=${itemId}`
  const img = (n, id) => `${LOTG_HOST}/images_items/item_${itemId}_${n}_${id}.jpg`
  return {
    markdown: [
      `- [Auction](${url}#_)`,
      '',
      '##### •  Fall, 2026 Premier Auction - Closes December 12',
      '',
      'Start:',
      '11/8/2026 12:00 PM EDT',
      '',
      '',
      'End:',
      '12/12/2026 9:00 PM EDT',
      '',
      '##LOC\\[OK\\]##',
      '',
      `[Prev](${LOTG_HOST}/bids/bidplace.aspx?itemid=${prev} "Previous Lot") [Next](${LOTG_HOST}/bids/bidplace.aspx?itemid=${next} "Next Lot")`,
      '',
      `## Lot \\#  ${lotNo}:  ${title}`,
      '',
      'Category:',
      'Featured Items',
      '',
      `Starting Bid: **${starting}**`,
      '',
      'Bids: **0**(Bid History)',
      '',
      'Time Left: **16 days 15:32:27**',
      '',
      `[**I have one to sell!**](${LOTG_HOST}//makeoffer/haveonetosell.aspx?itemid=${itemId})`,
      '',
      '### CURRENT BID:  $0.00',
      '',
      `[![](${img(1, imgId)})\\\\`,
      '',
      `Zoom](${img(1, imgId)} "")`,
      '',
      `![](${img(1, imgId)})![](${img(2, imgId + 1)})`,
    ].join('\n'),
    metadata: { url, sourceURL: url, statusCode: 200, title: '\n\tLove of the Game Auctions\n' },
  }
}
const LOTG_49085_FIXTURE = lotgFixture({
  itemId: '49085', lotNo: '17', title: 'Stunning 1921 W551 Complete 10-Card Set Strip w/Ruth/Cobb/Speaker/Johnson (HOF)',
  starting: '$2,500.00', imgId: 168812, prev: '49784', next: '49792',
})
const LOTG_49605_FIXTURE = lotgFixture({
  itemId: '49605', lotNo: '41', title: '1923 Fleer \\#47 Babe Ruth (HOF) - SGC AUTHENTIC',
  starting: '$1,000.00', imgId: 170325, prev: '49816', next: '47672',
})

// Leland's (same CreateAuction page). Mirrors the lot 4 / item 138859 page as
// scraped 2026-11-26: 17 bids, CURRENT BID $32,744.00 over a $15,000 start.
// Prev/Next links point at other item ids via the .aspx form.
const LELANDS_HOST = 'https://auction.lelands.com'
const LELANDS_URL = `${LELANDS_HOST}/bids/bidplace?itemid=138859`
const LELANDS_IMG = (n, id) => `${LELANDS_HOST}/images_items/item_138859_${n}_${id}.jpg`
const LELANDS_FIXTURE = {
  markdown: [
    `- [Current Auction](${LELANDS_HOST}/Lots/Gallery)`,
    '',
    '##### •  2026 Fall Classic',
    '',
    'Start:',
    '11/15/2026 12:00 PM EST',
    '',
    '',
    'End:',
    '12/5/2026 10:00 PM EST',
    '',
    '##LOC\\[OK\\]##',
    '',
    `[Prev](${LELANDS_HOST}/bids/bidplace.aspx?itemid=138725 "Previous Lot") [Next](${LELANDS_HOST}/bids/bidplace.aspx?itemid=138477 "Next Lot")`,
    '',
    "## Lot \\#  4:  Lou Gehrig's 1934 Tour of Japan Album with All-American Team Signatures and Original Photographs (PSA)",
    '',
    'Category:',
    'The Lost Gehrig Archive',
    '',
    'Starting Bid: **$15,000.00**',
    '',
    'Bids: **17**(Bid History)',
    '',
    'Time Left: **09 days 16:20:54**',
    '',
    'Add To Watchlist',
    '',
    '### CURRENT BID:  $32,744.00',
    '',
    `[Lot Description](${LELANDS_URL}#lot-desc)`,
    '',
    `[![](${LELANDS_IMG(1, 517672)})\\\\`,
    '',
    `Zoom](${LELANDS_IMG(1, 517672)} "")`,
    '',
    `![](${LELANDS_IMG(1, 517672)})![](${LELANDS_IMG(2, 517673)})`,
  ].join('\n'),
  metadata: { url: LELANDS_URL, sourceURL: LELANDS_URL, statusCode: 200, title: '\n\tLelands\n' },
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
  args[3] ?? '/tmp/lotg-49085.json',
  args[4] ?? '/tmp/lotg-49605.json',
  args[5] ?? '/tmp/lelands-138859.json',
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

const LOTG_LOTS = [
  { fixture: LOTG_49085_FIXTURE, sample: 3, lotId: '49085', lotNumber: '17', opening: 2500,
    title: /^Stunning 1921 W551 Complete 10-Card Set Strip/, image: 'item_49085_1_168812.jpg' },
  { fixture: LOTG_49605_FIXTURE, sample: 4, lotId: '49605', lotNumber: '41', opening: 1000,
    title: /^1923 Fleer #47 Babe Ruth \(HOF\) - SGC AUTHENTIC$/, image: 'item_49605_1_170325.jpg' },
]
for (const lot of LOTG_LOTS) {
  lotCheck(`Love of the Game ${lot.lotId}: 0 bids → no current bid (never $0), opening bid, close, image`, lot.fixture, lot.sample, (doc) => {
    const r = parseLoveOfTheGame(doc, { lotId: lot.lotId, lotNumber: lot.lotNumber })
    assert.equal(r.ok, true, r.reason)
    assert.equal(r.currentBid, null) // page says "CURRENT BID: $0.00" — not a live price
    assert.equal(r.noBids, true)
    assert.equal(r.openingBid, lot.opening)
    assert.equal(r.lotNumber, lot.lotNumber)
    assert.match(r.title, lot.title)
    assert.equal(r.imageUrl, `https://bid.loveofthegameauctions.com/images_items/${lot.image}`)
    assert.equal(r.endTime, '2026-12-13T02:00:00.000Z') // "12/12/2026 9:00 PM EDT" read as New York wall time (EST)
    assert.equal(r.status, 'live')
  })

  lotCheck(`Love of the Game ${lot.lotId}: rejects other lot / item id / house`, lot.fixture, lot.sample, (doc) => {
    const other = LOTG_LOTS.find((l) => l !== lot)
    assert.equal(parseLoveOfTheGame(doc, { lotId: lot.lotId, lotNumber: other.lotNumber }).ok, false)
    assert.equal(parseLoveOfTheGame(doc, { lotId: other.lotId, lotNumber: null }).ok, false)
    assert.equal(parseLoveOfTheGame(doc, { lotId: other.lotId, lotNumber: other.lotNumber }).ok, false)
    // A Love of the Game page must never satisfy the Grey Flannel adapter (host pinned per site).
    assert.equal(parseGreyFlannel(doc, { lotId: lot.lotId, lotNumber: lot.lotNumber }).ok, false)
    const bare = { markdown: doc.markdown, metadata: {} }
    assert.equal(parseLoveOfTheGame(bare, { lotId: lot.lotId, lotNumber: lot.lotNumber }).ok, true)
    assert.equal(parseLoveOfTheGame(bare, { lotId: other.lotId, lotNumber: null }).ok, false)
  })
}

check('Love of the Game: $0.00 current bid without a bid count is refused', () => {
  const md = LOTG_49085_FIXTURE.markdown.replace('Bids: **0**(Bid History)', '')
  const r = parseLoveOfTheGame({ markdown: md, metadata: LOTG_49085_FIXTURE.metadata }, { lotId: '49085', lotNumber: '17' })
  assert.equal(r.ok, false)
})

check('Love of the Game: labelled CURRENT BID used once bids exist', () => {
  const md = LOTG_49605_FIXTURE.markdown
    .replace('Bids: **0**', 'Bids: **3**')
    .replace('### CURRENT BID:  $0.00', '### CURRENT BID:  $1,200.00')
  const r = parseLoveOfTheGame({ markdown: md, metadata: LOTG_49605_FIXTURE.metadata }, { lotId: '49605', lotNumber: '41' })
  assert.equal(r.ok, true, r.reason)
  assert.equal(r.currentBid, 1200)
  assert.equal(r.openingBid, 1000)
  assert.equal(r.noBids, false)
})

lotCheck("Leland's 138859: labelled CURRENT BID, opening bid, lot, image, end time", LELANDS_FIXTURE, 5, (doc) => {
  const r = parseLelands(doc, { lotId: '138859', lotNumber: '4' })
  assert.equal(r.ok, true, r.reason)
  assert.equal(r.currentBid, 32744) // never the $15,000 starting bid
  assert.equal(r.openingBid, 15000)
  assert.equal(r.noBids, false)
  assert.equal(r.lotNumber, '4')
  assert.match(r.title, /^Lou Gehrig's 1934 Tour of Japan Album with All-American Team Signatures and Original Photographs \(PSA\)$/)
  assert.equal(r.imageUrl, 'https://auction.lelands.com/images_items/item_138859_1_517672.jpg')
  assert.equal(r.endTime, '2026-12-06T03:00:00.000Z') // 12/5/2026 10:00 PM EST
  assert.equal(r.status, 'live')
})

lotCheck("Leland's 138859: rejects other lot / item id / house", LELANDS_FIXTURE, 5, (doc) => {
  assert.equal(parseLelands(doc, { lotId: '138859', lotNumber: '5' }).ok, false)
  assert.equal(parseLelands(doc, { lotId: '138725', lotNumber: null }).ok, false) // Prev link's item id
  assert.equal(parseLelands(doc, { lotId: '138477', lotNumber: '4' }).ok, false) // Next link's item id
  // A Leland's page never satisfies another CreateAuction house's adapter (host pinned per site).
  assert.equal(parseGreyFlannel(doc, { lotId: '138859', lotNumber: '4' }).ok, false)
  assert.equal(parseLoveOfTheGame(doc, { lotId: '138859', lotNumber: '4' }).ok, false)
  const bare = { markdown: doc.markdown, metadata: {} }
  assert.equal(parseLelands(bare, { lotId: '138859', lotNumber: '4' }).ok, true)
  assert.equal(parseLelands(bare, { lotId: '138725', lotNumber: null }).ok, false)
})

check("Leland's: .aspx final URL accepted; other host / item id in metadata rejected", () => {
  const withUrl = (url) => ({ markdown: LELANDS_FIXTURE.markdown, metadata: { url, statusCode: 200 } })
  assert.equal(parseLelands(withUrl(`${LELANDS_HOST}/bids/bidplace.aspx?itemid=138859`), { lotId: '138859', lotNumber: '4' }).ok, true)
  for (const url of [
    `${LELANDS_HOST}/bids/bidplace.aspx?itemid=138725`,
    'https://auction.lelands.com.evil.test/bids/bidplace?itemid=138859',
    'https://lelands.com/bids/bidplace?itemid=138859',
    'https://bid.greyflannelauctions.com/bids/bidplace?itemid=138859',
    'not a url',
  ]) assert.equal(parseLelands(withUrl(url), { lotId: '138859', lotNumber: '4' }).ok, false, url)
})

check("Leland's: inconsistent prices refused (below start, conflicting, $0, missing)", () => {
  const variant = (from, to) => ({ markdown: LELANDS_FIXTURE.markdown.replace(from, to), metadata: LELANDS_FIXTURE.metadata })
  const exp = { lotId: '138859', lotNumber: '4' }
  assert.equal(parseLelands(variant('### CURRENT BID:  $32,744.00', '### CURRENT BID:  $14,000.00'), exp).ok, false)
  assert.equal(parseLelands(variant('### CURRENT BID:  $32,744.00', '### CURRENT BID:  $32,744.00\n\nCURRENT BID: $33,000.00'), exp).ok, false)
  assert.equal(parseLelands(variant('### CURRENT BID:  $32,744.00', '### CURRENT BID:  $0.00'), exp).ok, false)
  assert.equal(parseLelands(variant('### CURRENT BID:  $32,744.00', ''), exp).ok, false)
  // A second lot heading (layout change / wrong page) is refused.
  assert.equal(parseLelands(variant('Category:', '## Lot \\#  5:  Other lot\n\nCategory:'), exp).ok, false)
  // 0 bids → no current bid, opening bid kept separately.
  const none = parseLelands(variant('Bids: **17**', 'Bids: **0**'), exp)
  assert.equal(none.ok, true, none.reason)
  assert.equal(none.currentBid, null)
  assert.equal(none.noBids, true)
  assert.equal(none.openingBid, 15000)
})

check("Leland's: only same-item images on auction.lelands.com are used", () => {
  const md = LELANDS_FIXTURE.markdown
    .replaceAll(`${LELANDS_HOST}/images_items/item_138859_`, 'https://cdn.evil.test/images_items/item_138859_')
    + '\n![](https://auction.lelands.com/images_items/item_138725_1_1.jpg)'
  const r = parseLelands({ markdown: md, metadata: LELANDS_FIXTURE.metadata }, { lotId: '138859', lotNumber: '4' })
  assert.equal(r.ok, true, r.reason)
  assert.equal(r.imageUrl, null)
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

check('Love of the Game URL rebuilt from numeric id only', () => {
  assert.equal(buildLoveOfTheGameUrl('49085'), 'https://bid.loveofthegameauctions.com/bids/bidplace?itemid=49085')
  for (const bad of ['', '49085&x=1', '../1', '1'.repeat(11), '49085 ', 'https://evil.test/?itemid=1']) {
    assert.equal(buildLoveOfTheGameUrl(bad), null, bad)
  }
})

check("Leland's URL rebuilt from numeric id only (no-extension form)", () => {
  assert.equal(buildLelandsUrl('138859'), 'https://auction.lelands.com/bids/bidplace?itemid=138859')
  for (const bad of ['', '138859&x=1', '../1', '1'.repeat(11), '138859 ', 'https://evil.test/?itemid=1']) {
    assert.equal(buildLelandsUrl(bad), null, bad)
  }
})

check("Client parseLotUrl: Leland's .aspx and no-extension links canonicalise to one URL", () => {
  const canonical = 'https://auction.lelands.com/bids/bidplace?itemid=138859'
  for (const input of [
    'https://auction.lelands.com/bids/bidplace.aspx?itemid=138859',
    'https://auction.lelands.com/bids/bidplace?itemid=138859',
    'http://auction.lelands.com/bids/bidplace.aspx?itemid=138859#lot-desc',
    'https://AUCTION.lelands.com/bids/BidPlace.aspx?itemId=138859&utm=x',
  ]) {
    const r = parseLotUrl(input)
    assert.equal(r.error, undefined, `${input}: ${r.error}`)
    assert.deepEqual(r, { house: 'lelands', lotId: '138859', canonicalUrl: canonical, sourceUrl: canonical }, input)
  }
  for (const bad of [
    'https://auction.lelands.com.evil.test/bids/bidplace?itemid=138859',
    'https://lelands.com/bids/bidplace?itemid=138859',
    'https://auction.lelands.com:8443/bids/bidplace?itemid=138859',
    'https://user@auction.lelands.com/bids/bidplace?itemid=138859',
    'https://auction.lelands.com/bids/bidplace.asp?itemid=138859',
    'https://auction.lelands.com/bids/bidplace.aspx.evil?itemid=138859',
    'https://auction.lelands.com/x/bids/bidplace.aspx?itemid=138859',
    'https://auction.lelands.com/bids/bidplace.aspx?itemid=13885x',
    'https://auction.lelands.com/bids/bidplace.aspx',
    'ftp://auction.lelands.com/bids/bidplace?itemid=138859',
  ]) assert.ok(parseLotUrl(bad).error, bad)
  // The .aspx form is accepted for the other CreateAuction houses too, still canonicalised.
  assert.equal(parseLotUrl('https://bid.greyflannelauctions.com/bids/bidplace.aspx?itemid=59791').canonicalUrl,
    'https://bid.greyflannelauctions.com/bids/bidplace?itemid=59791')
})

check('Grey Flannel page never satisfies the Love of the Game adapter', () => {
  const doc = toDoc(GREY_FIXTURE, 'fixture')
  assert.equal(parseLoveOfTheGame(doc, { lotId: '59791', lotNumber: '150' }).ok, false)
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
