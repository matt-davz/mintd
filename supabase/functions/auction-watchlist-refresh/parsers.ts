// Pure parsers for the Firecrawl-backed adapters (Grey Flannel, Heritage).
//
// No Deno/Node APIs here: the Edge Function imports this module, and
// scripts/check-watchlist-parsers.mjs runs the same functions under Node
// against saved Firecrawl responses.
//
// Honesty rules:
// - A lot is only accepted when the scraped page identifies the expected lot.
// - current bid is read only from a line explicitly labelled "Current Bid".
//   "Starting Bid" / "Bid Next Minimum" / "Minimum Next Bid" are never used
//   as the current bid. A no-bid lot returns currentBid = null with the
//   opening bid captured separately.

export type LotStatus = 'live' | 'extended' | 'closed' | 'unknown'

export type FirecrawlDoc = { markdown: string; metadata: Record<string, unknown> }

export type ParsedLot = {
  ok: true
  currentBid: number | null
  openingBid: number | null
  noBids: boolean
  endTime: string | null
  status: LotStatus
  imageUrl: string | null
  title: string | null
  lotNumber: string | null
}

export type ParseFailure = { ok: false; reason: string }

const NUMERIC_ID = /^[0-9]{1,10}$/
const HERITAGE_LOT_ID = /^([0-9]{1,8})-([0-9]{1,10})$/
const HERITAGE_HOSTS = new Set(['sports.ha.com', 'www.ha.com'])
const GREY_HOST = 'bid.greyflannelauctions.com'
const MONEY = String.raw`\$\s*([0-9][0-9,]{0,12}(?:\.[0-9]{1,2})?)`

// ── URL builders / validators ────────────────────────────────────────────────

/** Grey Flannel fetch URL, rebuilt from the numeric item id only. */
export function buildGreyFlannelUrl(lotId: string): string | null {
  return NUMERIC_ID.test(lotId) ? `https://${GREY_HOST}/bids/bidplace?itemid=${lotId}` : null
}

/**
 * Heritage URLs carry a slug we can't rebuild, so the stored canonical_url is
 * validated instead: https, exact host sports.ha.com / www.ha.com, default
 * port, no credentials/query/fragment, path /itm/.../a/<sale>-<lot>.s with
 * <sale>-<lot> equal to the stored lot_id, and no normalisation tricks (the
 * parsed URL must serialise back to exactly the stored string).
 * source_url is never used.
 */
export function validateHeritageUrl(canonicalUrl: unknown, lotId: string): string | null {
  if (typeof canonicalUrl !== 'string' || canonicalUrl.length > 500) return null
  if (!HERITAGE_LOT_ID.test(lotId)) return null
  let u: URL
  try { u = new URL(canonicalUrl) } catch { return null }
  if (u.protocol !== 'https:' || u.username || u.password || u.port || u.search || u.hash) return null
  if (!HERITAGE_HOSTS.has(u.hostname)) return null
  const m = u.pathname.match(/^\/itm\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\/a\/([0-9]{1,8}-[0-9]{1,10})\.s$/)
  if (!m || m[1] !== lotId) return null
  const rebuilt = `https://${u.hostname}${u.pathname}`
  return rebuilt === canonicalUrl ? rebuilt : null
}

// ── Firecrawl response ───────────────────────────────────────────────────────

/**
 * Accepts the REST v2 response ({ success, data: { markdown, metadata } }) or
 * the CLI's local JSON ({ markdown, metadata }).
 */
export function extractFirecrawlDoc(json: unknown): FirecrawlDoc | null {
  if (!json || typeof json !== 'object') return null
  const j = json as Record<string, unknown>
  let doc: Record<string, unknown> | null = null
  if ('data' in j || 'success' in j) {
    if (j.success !== true || !j.data || typeof j.data !== 'object') return null
    doc = j.data as Record<string, unknown>
  } else {
    doc = j
  }
  if (typeof doc.markdown !== 'string' || doc.markdown.length === 0) return null
  const metadata = doc.metadata && typeof doc.metadata === 'object' ? doc.metadata as Record<string, unknown> : {}
  return { markdown: doc.markdown, metadata }
}

/** HTTP status Firecrawl saw from the auction site, if reported. */
export function targetStatusCode(doc: FirecrawlDoc): number | null {
  const s = doc.metadata.statusCode
  return typeof s === 'number' ? s : null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function parseMoney(raw: string): number | null {
  const n = Number(raw.replace(/,/g, ''))
  return Number.isFinite(n) && n >= 0 && n < 1e10 ? n : null
}

/** All distinct amounts captured by `re` (group 1). */
function moneyMatches(md: string, re: RegExp): number[] {
  const out = new Set<number>()
  for (const m of md.matchAll(re)) {
    const v = parseMoney(m[1])
    if (v !== null) out.add(v)
  }
  return [...out]
}

/** Single labelled amount; null if absent, 'conflict' if the page disagrees with itself. */
function labelledAmount(md: string, label: string): number | null | 'conflict' {
  // "Label: $1,234" on one line, or "Label:" followed by "**$1,234**" a line or two below.
  // Anchored at line start so "Bid Next Minimum" / "Minimum Next Bid" never match.
  const inline = new RegExp(String.raw`^[#\s]*${label}:[ \t]*\**[ \t]*${MONEY}`, 'gim')
  const block = new RegExp(String.raw`^[#\s]*${label}:[ \t]*\n(?:[ \t]*\n){0,3}[ \t]*\*\*${MONEY}\*\*`, 'gim')
  const vals = [...new Set([...moneyMatches(md, inline), ...moneyMatches(md, block)])]
  if (vals.length === 0) return null
  return vals.length === 1 ? vals[0] : 'conflict'
}

function metaString(meta: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = meta[k]
    if (typeof v === 'string' && v) return v
    if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  }
  return null
}

function unescapeMd(s: string): string {
  return s.replace(/\\([\\`*_{}[\]()#+\-.!|])/g, '$1').replace(/\s+/g, ' ').trim()
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

function tzOffsetMs(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(instantMs))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) -
    Math.floor(instantMs / 1000) * 1000
}

/** Wall-clock time in an IANA zone → ISO UTC. */
export function zonedToUtcIso(y: number, mo: number, d: number, h: number, mi: number, timeZone: string): string | null {
  if (![y, mo, d, h, mi].every(Number.isFinite) || mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null
  const asUtc = Date.UTC(y, mo - 1, d, h, mi)
  let utc = asUtc - tzOffsetMs(asUtc, timeZone)
  utc = asUtc - tzOffsetMs(utc, timeZone)
  return new Date(utc).toISOString()
}

function to24h(h: number, ampm: string): number {
  const pm = ampm.toUpperCase() === 'PM'
  return (h % 12) + (pm ? 12 : 0)
}

// ── Grey Flannel ─────────────────────────────────────────────────────────────

export function parseGreyFlannel(
  doc: FirecrawlDoc,
  expected: { lotId: string; lotNumber?: string | null },
): ParsedLot | ParseFailure {
  const md = doc.markdown
  const { lotId } = expected
  if (!NUMERIC_ID.test(lotId)) return { ok: false, reason: 'Invalid Grey Flannel item id' }

  // 1) Page URL Firecrawl ended up on must be this item.
  const pageUrl = metaString(doc.metadata, 'url', 'sourceURL')
  if (pageUrl) {
    try {
      const u = new URL(pageUrl)
      const itemId = u.searchParams.get('itemid') ?? u.searchParams.get('itemId')
      if (u.hostname !== GREY_HOST || itemId !== lotId) return { ok: false, reason: 'Scraped page is not the expected Grey Flannel lot' }
    } catch {
      return { ok: false, reason: 'Scraped page URL is invalid' }
    }
  }

  // 2) Exactly one "## Lot # N: Title" heading, matching the stored lot number.
  const heads = [...md.matchAll(/^#{1,6}[ \t]*Lot[ \t]*\\?#[ \t]*([0-9]{1,10})[ \t]*:[ \t]*(.+)$/gim)]
  const lotNos = [...new Set(heads.map((m) => m[1]))]
  if (lotNos.length !== 1) return { ok: false, reason: 'Lot page did not identify a single lot (layout changed or bot check)' }
  const lotNumber = lotNos[0]
  if (expected.lotNumber && expected.lotNumber !== lotNumber) {
    return { ok: false, reason: `Page shows lot ${lotNumber}, expected lot ${expected.lotNumber}` }
  }
  // 3) Item id must appear on the page itself (image paths are item_<id>_N_…).
  if (!md.includes(`/images_items/item_${lotId}_`) && !pageUrl) {
    return { ok: false, reason: 'Lot page did not reference the expected item id' }
  }
  const title = unescapeMd(heads[0][2]).slice(0, 300) || null

  const bidsM = md.match(/^Bids:[ \t]*\**[ \t]*([0-9]{1,6})\b/im)
  const bidCount = bidsM ? Number(bidsM[1]) : null
  const current = labelledAmount(md, 'CURRENT BID')
  const opening = labelledAmount(md, 'Starting Bid')
  if (current === 'conflict' || opening === 'conflict') return { ok: false, reason: 'Lot page shows conflicting bid amounts' }

  let currentBid: number | null = null
  let noBids = false
  if (bidCount === 0) {
    noBids = true // the site may echo the opening bid as "current"; with 0 bids there is none
  } else if (current !== null) {
    currentBid = current
  } else {
    return { ok: false, reason: 'Could not find a labelled Current Bid on the lot page' }
  }

  // Auction end: "End:\n12/13/2026 8:00 PM EST"
  let endTime: string | null = null
  const endM = md.match(/^End:[ \t]*\n(?:[ \t]*\n)*[ \t]*([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})[ \t]+([0-9]{1,2}):([0-9]{2})[ \t]*(AM|PM)[ \t]*(EST|EDT|ET)\b/im)
  if (endM) {
    endTime = zonedToUtcIso(+endM[3], +endM[1], +endM[2], to24h(+endM[4], endM[6]), +endM[5], 'America/New_York')
  }

  let status: LotStatus = 'unknown'
  const leftM = md.match(/^Time Left:[ \t]*\**[ \t]*([^*\n]{1,60})/im)
  if (leftM) {
    const left = leftM[1].trim()
    if (/^(closed|ended|auction closed|bidding closed)\b/i.test(left)) status = 'closed'
    else if (/\d/.test(left)) status = 'live'
  }

  const imgRe = new RegExp(String.raw`https://bid\.greyflannelauctions\.com/images_items/item_${lotId}_([0-9]{1,3})_[0-9]{1,12}\.(?:jpg|jpeg|png)`, 'g')
  const imgs = [...md.matchAll(imgRe)]
  const imageUrl = (imgs.find((m) => m[1] === '1') ?? imgs[0])?.[0] ?? null

  return { ok: true, currentBid, openingBid: opening, noBids, endTime, status, imageUrl, title, lotNumber }
}

// ── Heritage ─────────────────────────────────────────────────────────────────

const HERITAGE_IMAGE = /^https:\/\/dyn1\.heritagestatic\.com\/ha\?p=([0-9-]{1,40})(?:&w=[0-9]{1,4}&h=[0-9]{1,4})?&it=product$/

const TIME_ZONES: Record<string, string> = {
  eastern: 'America/New_York', central: 'America/Chicago', mountain: 'America/Denver', pacific: 'America/Los_Angeles',
}

export function parseHeritage(doc: FirecrawlDoc, expected: { lotId: string }): ParsedLot | ParseFailure {
  const md = doc.markdown
  const idM = expected.lotId.match(HERITAGE_LOT_ID)
  if (!idM) return { ok: false, reason: 'Invalid Heritage lot id' }
  const [, saleNo, lotNo] = idM

  // 1) Page URL(s) must be this lot on an allowed Heritage host.
  for (const key of ['url', 'sourceURL', 'ogUrl', 'og:url']) {
    const v = metaString(doc.metadata, key)
    if (!v) continue
    let u: URL
    try { u = new URL(v) } catch { return { ok: false, reason: 'Scraped page URL is invalid' } }
    if (!HERITAGE_HOSTS.has(u.hostname) || !u.pathname.endsWith(`/a/${saleNo}-${lotNo}.s`)) {
      return { ok: false, reason: 'Scraped page is not the expected Heritage lot' }
    }
  }

  // 2) Every "LOT #N" marker on the page is this lot, and the sale is this sale.
  const lotMarks = [...new Set([...md.matchAll(/^[ \t]*LOT[ \t]*#[ \t]*([0-9]{1,10})\b/gim)].map((m) => m[1]))]
  if (lotMarks.length !== 1 || lotMarks[0] !== lotNo) {
    return { ok: false, reason: 'Lot page did not identify the expected lot (layout changed or bot check)' }
  }
  if (!md.includes(`saleNo=${saleNo}`) && !md.includes(`#${saleNo}`)) {
    return { ok: false, reason: 'Lot page did not identify the expected auction' }
  }

  const current = labelledAmount(md, 'Current Bid')
  const opening = labelledAmount(md, 'Starting Bid')
  if (current === 'conflict' || opening === 'conflict') return { ok: false, reason: 'Lot page shows conflicting bid amounts' }

  const statusLine = md.match(/^Status:[ \t]*(.+)$/im)?.[1]?.trim() ?? ''
  const bidsM = md.match(/Bids \+ Registered Phone Bidders:[ \t]*\**([0-9]{1,6})/i)
  const bidCount = bidsM ? Number(bidsM[1]) : null

  let currentBid: number | null = null
  let noBids = false
  if (current !== null) {
    currentBid = current
  } else if (opening !== null && (/starting bid not met/i.test(statusLine) || bidCount === 0)) {
    noBids = true
  } else {
    return { ok: false, reason: 'Could not find a labelled Current Bid on the lot page' }
  }

  // Scheduled cutoff from this lot's session:
  // "(Lots 81422-82181) - 10:00 PM Central Time, Saturday, December 19, 2026."
  let endTime: string | null = null
  const sessRe = /\(Lots[ \t]+([0-9]{1,10})[ \t]*-[ \t]*([0-9]{1,10})\)[ \t]*-[ \t]*([0-9]{1,2}):([0-9]{2})[ \t]*(AM|PM)[ \t]+(Eastern|Central|Mountain|Pacific)[ \t]+Time,[ \t]*[A-Za-z]+,[ \t]*([A-Za-z]{3,9})[ \t]+([0-9]{1,2}),[ \t]*([0-9]{4})/gi
  for (const m of md.matchAll(sessRe)) {
    const n = Number(lotNo)
    if (n < Number(m[1]) || n > Number(m[2])) continue
    const month = MONTHS[m[7].slice(0, 3).toLowerCase()]
    if (!month) continue
    endTime = zonedToUtcIso(+m[9], month, +m[8], to24h(+m[3], m[5]), +m[4], TIME_ZONES[m[6].toLowerCase()])
    break
  }

  let status: LotStatus = 'unknown'
  if (/^Time Left:[ \t]*[0-9]+d/im.test(md)) status = 'live'

  // Primary image: og:image (this lot's own image), else the first full-size gallery image.
  let imageUrl: string | null = null
  const candidates = [
    metaString(doc.metadata, 'ogImage', 'og:image', 'twitter:image'),
    md.match(/https:\/\/dyn1\.heritagestatic\.com\/ha\?p=[0-9-]{1,40}&w=850&h=600&it=product/)?.[0] ?? null,
  ]
  for (const c of candidates) {
    const m = c?.match(HERITAGE_IMAGE)
    if (m) { imageUrl = `https://dyn1.heritagestatic.com/ha?p=${m[1]}&it=product`; break }
  }

  const h1 = md.match(/^#[ \t]+(.+)$/m)?.[1]
  const title = h1 ? unescapeMd(h1).replace(/\s*\.{3}$/, '').slice(0, 300) || null : null

  return { ok: true, currentBid, openingBid: opening, noBids, endTime, status, imageUrl, title, lotNumber: lotNo }
}
