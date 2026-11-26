// Auction watchlist helpers — house registry, strict lot-URL validation,
// time/price formatting. Pure functions, no React.
//
// URL validation mirrors the CHECK constraints in migration 0039 and the
// fixed-host adapters in supabase/functions/auction-watchlist-refresh.

// Per-lot refresh caps, mirrored from the Edge Function. Direct fetches
// (REA, H&S) are cheap; Grey Flannel / Love of the Game / Leland's / Heritage go through Firecrawl, which
// costs credits, so they are checked at most hourly.
export const REFRESH_INTERVAL_MIN = 10
export const SCRAPED_REFRESH_INTERVAL_MIN = 60

/**
 * liveRefresh: the Edge Function has an adapter for this house.
 * scraped:     fetched via Firecrawl. Only works when FIRECRAWL_API_KEY is set
 *              server-side; otherwise lots come back `unsupported` and stay
 *              manual-entry.
 */
export const HOUSES = {
  rea: {
    label: 'Robert Edward Auctions',
    short: 'REA',
    liveRefresh: true,
    scraped: false,
    refreshIntervalMin: REFRESH_INTERVAL_MIN,
    closeCaveat: 'Until extended bidding',
  },
  huggins_scott: {
    label: 'Huggins & Scott',
    short: 'H&S',
    liveRefresh: true,
    scraped: false,
    refreshIntervalMin: REFRESH_INTERVAL_MIN,
    closeCaveat: 'Until extended bidding',
  },
  grey_flannel: {
    label: 'Grey Flannel Auctions',
    short: 'Grey Flannel',
    liveRefresh: true,
    scraped: true,
    refreshIntervalMin: SCRAPED_REFRESH_INTERVAL_MIN,
    closeCaveat: 'Extended bidding may apply',
  },
  love_of_the_game: {
    label: 'Love of the Game Auctions',
    short: 'Love of the Game',
    liveRefresh: true,
    scraped: true,
    refreshIntervalMin: SCRAPED_REFRESH_INTERVAL_MIN,
    closeCaveat: 'Extended bidding may apply',
  },
  lelands: {
    label: "Leland's",
    short: "Leland's",
    liveRefresh: true,
    scraped: true,
    refreshIntervalMin: SCRAPED_REFRESH_INTERVAL_MIN,
    closeCaveat: 'Extended bidding may apply',
  },
  heritage: {
    label: 'Heritage Auctions',
    short: 'Heritage',
    liveRefresh: true,
    scraped: true,
    refreshIntervalMin: SCRAPED_REFRESH_INTERVAL_MIN,
    closeCaveat: 'Extended bidding may apply',
  },
}

/** True when the lot's house can refresh and its per-lot cap has elapsed. */
export function isRefreshDue(lot, nowMs) {
  const house = HOUSES[lot.house]
  if (!house?.liveRefresh) return false
  // Server said scraping isn't configured — don't auto-trigger for it.
  if (house.scraped && lot.refresh_status === 'unsupported') return false
  if (!lot.refresh_attempted_at) return true
  return nowMs - new Date(lot.refresh_attempted_at).getTime() > house.refreshIntervalMin * 60000
}

export const HOUSE_KEYS = Object.keys(HOUSES)

/** "Grey Flannel, Love of the Game and Heritage" — short names of houses matching `pred`. */
export function houseNames(pred) {
  const names = Object.values(HOUSES).filter(pred).map(h => h.short)
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names.join('')
}

export const CLOSE_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'UTC', label: 'UTC' },
]

const MAX_URL_LENGTH = 1000

const CREATE_AUCTION_HOSTS = {
  'bid.greyflannelauctions.com': 'grey_flannel',
  'bid.loveofthegameauctions.com': 'love_of_the_game',
  'auction.lelands.com': 'lelands',
}

/**
 * Validate a pasted lot URL against the allow-listed auction hosts.
 * Returns { house, lotId, canonicalUrl, sourceUrl } or { error }.
 * Only exact hostnames over https on the default port are accepted.
 */
export function parseLotUrl(input) {
  const raw = (input ?? '').trim()
  if (!raw) return { error: 'Paste a lot URL.' }
  if (raw.length > MAX_URL_LENGTH) return { error: 'URL is too long.' }

  let url
  try {
    url = new URL(raw)
  } catch {
    return { error: 'That is not a valid URL.' }
  }
  if (url.protocol === 'http:') url.protocol = 'https:'
  if (url.protocol !== 'https:') return { error: 'Only https auction links are supported.' }
  if (url.username || url.password || url.port) return { error: 'Unsupported URL format.' }

  const host = url.hostname.toLowerCase()
  const path = url.pathname

  if (host === 'bid.collectrea.com' || host === 'bid.hugginsandscott.com') {
    const m = path.match(/^\/lots\/([0-9]{1,10})\/?$/)
    if (!m) return { error: 'Expected a lot page like /lots/123456.' }
    const house = host === 'bid.collectrea.com' ? 'rea' : 'huggins_scott'
    const canonicalUrl = `https://${host}/lots/${m[1]}`
    return { house, lotId: m[1], canonicalUrl, sourceUrl: canonicalUrl }
  }

  // Grey Flannel, Love of the Game and Leland's share CreateAuction's bidplace
  // page. Both /bids/bidplace and /bids/bidplace.aspx are accepted; the stored
  // URL is always the no-extension form on the fixed host.
  const createAuction = CREATE_AUCTION_HOSTS[host]
  if (createAuction) {
    const itemId = url.searchParams.get('itemid') ?? url.searchParams.get('itemId')
    if (!/^\/bids\/bidplace(?:\.aspx|\/)?$/i.test(path) || !itemId || !/^[0-9]{1,10}$/.test(itemId)) {
      return { error: `Expected a ${HOUSES[createAuction].short} bidplace?itemid=… link.` }
    }
    const canonicalUrl = `https://${host}/bids/bidplace?itemid=${itemId}`
    return { house: createAuction, lotId: itemId, canonicalUrl, sourceUrl: canonicalUrl }
  }

  if (host === 'sports.ha.com' || host === 'www.ha.com') {
    const m = path.match(/^\/itm\/[A-Za-z0-9/_-]+\/a\/([0-9]{1,8}-[0-9]{1,10})\.s$/)
    if (!m) return { error: 'Expected a Heritage lot link ending in /a/<sale>-<lot>.s.' }
    const canonicalUrl = `https://${host}${path}`
    return { house: 'heritage', lotId: m[1], canonicalUrl, sourceUrl: url.href }
  }

  return { error: `Supported sites: ${Object.values(HOUSES).map(h => h.short).join(', ')}.` }
}

/** Lot number guess from the lot id when the site doesn't tell us. */
export function defaultLotNumber(house, lotId) {
  if (house === 'heritage') return lotId.split('-')[1] ?? null
  return null
}

// ── Time ─────────────────────────────────────────────────────────────────────

function tzOffsetMs(instantMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(instantMs))
  const get = (t) => Number(parts.find(p => p.type === t)?.value)
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return wall - Math.floor(instantMs / 1000) * 1000
}

/** Convert a datetime-local value ("2026-12-13T20:00") in `timeZone` to an ISO UTC string. */
export function zonedLocalToUtcIso(localValue, timeZone) {
  const m = (localValue ?? '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!m) return null
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  let utc = asUtc - tzOffsetMs(asUtc, timeZone)
  const second = tzOffsetMs(utc, timeZone)
  utc = asUtc - second
  return new Date(utc).toISOString()
}

/** "Sun, Dec 6, 9:00 PM EST" in the viewer's local timezone. */
export function formatCloseTime(iso) {
  if (!iso) return null
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(iso))
}

/** Compact countdown, or null once the scheduled time has passed. */
export function formatRemaining(iso, nowMs) {
  if (!iso) return null
  const diff = new Date(iso).getTime() - nowMs
  if (diff <= 0) return null
  const mins = Math.floor(diff / 60000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return '<1m'
}

export function formatAgo(iso, nowMs) {
  if (!iso) return null
  const mins = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 48) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/**
 * A bid reading is stale after 60 min, or after 15 min once the lot is
 * within 24h of its scheduled close (prices move fast near the end).
 * Firecrawl-scraped houses can only refresh hourly, so for them the
 * threshold is never below 1.5× that interval (90 min) — otherwise they'd
 * read as stale right after a successful check.
 */
export function isBidStale(lot, nowMs) {
  if (!lot.bid_checked_at) return true
  const age = nowMs - new Date(lot.bid_checked_at).getTime()
  const close = lot.scheduled_close_at ? new Date(lot.scheduled_close_at).getTime() : null
  const nearClose = close !== null && close - nowMs < 24 * 3600 * 1000
  const base = nearClose ? 15 : 60
  const floor = HOUSES[lot.house]?.scraped ? SCRAPED_REFRESH_INTERVAL_MIN * 1.5 : 0
  return age > Math.max(base, floor) * 60000
}

/**
 * Last live check succeeded and found no bids: current_bid is NULL by design
 * (the opening bid is in opening_bid and must never be shown as current).
 */
export function hasNoBids(lot) {
  return lot.current_bid == null && lot.bid_source === 'live' && !!lot.bid_checked_at
}

export function formatMoney(amount, currency = 'USD') {
  if (amount === null || amount === undefined) return null
  const n = Number(amount)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n)
}
