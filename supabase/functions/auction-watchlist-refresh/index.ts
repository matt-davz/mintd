/// <reference lib="deno.ns" />
// auction-watchlist-refresh
//
// Refreshes current bid / opening bid / close time / status / image for lots
// already registered in public.auction_watchlist_lots. Called from the
// signed-in admin page (/admin/auction-watchlist).
//
// Security model
// - Auth: the caller's Clerk session JWT (Supabase third-party auth) is
//   forwarded to PostgREST. All reads/writes run as `authenticated` under
//   RLS — the service role key is NOT used. An anon/invalid token can't read
//   the table, so it gets 401 and nothing is fetched.
//   Deploy with --no-verify-jwt: the Edge gateway's legacy JWT check doesn't
//   understand Clerk tokens; verification happens at PostgREST instead.
// - SSRF: we never fetch a URL supplied by the client, and never use
//   source_url. REA / H&S / Grey Flannel / Love of the Game / Leland's URLs
//   are rebuilt from (house, lot_id) with a fixed https host; lot_id must be
//   all digits.
//   Heritage URLs carry a slug, so the stored canonical_url is validated with
//   the URL parser (exact host, https, default port, no credentials/query,
//   path ends in the stored lot_id) — see parsers.ts. Direct fetches don't
//   follow redirects, are size-capped and time out. Grey Flannel / Love of the
//   Game / Leland's / Heritage are fetched through Firecrawl (Grey Flannel,
//   Love of the Game and Heritage bot-block direct server requests; Leland's
//   shares the CreateAuction path); the scraped page must identify the expected lot before
//   anything is written.
// - Credits / rate limit: each lot is fetched at most once per its house's
//   interval (10 min direct, 60 min Firecrawl), tracked in
//   refresh_attempted_at and claimed BEFORE the fetch so failures also wait.
//   Concurrency is bounded (3 direct, 2 Firecrawl) and at most
//   MAX_FIRECRAWL_PER_CALL Firecrawl scrapes run per call.
// - Secrets: FIRECRAWL_API_KEY is read from Edge Function secrets only and is
//   never returned or logged. Without it, the Firecrawl houses stay manual.
// - Honesty: prices are only written when parsed from a fresh, verified page.
//   current_bid comes only from a "Current Bid" label; a no-bid lot gets
//   current_bid = NULL with opening_bid stored separately. On failure the
//   last verified price is kept and the error is recorded.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  type FirecrawlDoc, type ParseFailure, type ParsedLot,
  buildGreyFlannelUrl, buildLelandsUrl, buildLoveOfTheGameUrl, extractFirecrawlDoc, parseGreyFlannel, parseHeritage,
  parseLelands, parseLoveOfTheGame, targetStatusCode, validateHeritageUrl,
} from './parsers.ts'

const DIRECT_INTERVAL_MS = 10 * 60 * 1000
const FIRECRAWL_INTERVAL_MS = 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 12_000
const FIRECRAWL_TIMEOUT_MS = 45_000
const MAX_BODY_BYTES = 2_000_000
const MAX_FIRECRAWL_BYTES = 4_000_000
const CONCURRENCY = 3
const FIRECRAWL_CONCURRENCY = 2
const MAX_LOTS_PER_CALL = 60
const MAX_FIRECRAWL_PER_CALL = 6
const FIRECRAWL_ENDPOINT = 'https://api.firecrawl.dev/v2/scrape'
const USER_AGENT = 'MintdWatchlist/1.0 (+private collection watchlist; low-frequency)'

const ALLOWED_ORIGINS = (Deno.env.get('WATCHLIST_ALLOWED_ORIGINS') ?? '*')
  .split(',').map((s) => s.trim()).filter(Boolean)

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allow = ALLOWED_ORIGINS.includes('*') ? '*' : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? '')
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

// ── Adapters ─────────────────────────────────────────────────────────────────

type LotRow = {
  id: string
  house: string
  lot_id: string
  canonical_url: string
  title: string | null
  lot_number: string | null
  image_url: string | null
  refresh_attempted_at: string | null
}

type DirectAdapter = {
  kind: 'direct'
  intervalMs: number
  buildUrl: (lotId: string) => string | null
  imageAccount: string
}

type FirecrawlAdapter = {
  kind: 'firecrawl'
  intervalMs: number
  buildUrl: (lot: LotRow) => string | null
  parse: (doc: FirecrawlDoc, lot: LotRow) => ParsedLot | ParseFailure
}

const NUMERIC_ID = /^[0-9]{1,10}$/

const ADAPTERS: Record<string, DirectAdapter | FirecrawlAdapter> = {
  // REA and Huggins & Scott run the same Laravel/Livewire bidding platform.
  rea: {
    kind: 'direct',
    intervalMs: DIRECT_INTERVAL_MS,
    buildUrl: (id) => NUMERIC_ID.test(id) ? `https://bid.collectrea.com/lots/${id}` : null,
    imageAccount: 'robertedwardauctions',
  },
  huggins_scott: {
    kind: 'direct',
    intervalMs: DIRECT_INTERVAL_MS,
    buildUrl: (id) => NUMERIC_ID.test(id) ? `https://bid.hugginsandscott.com/lots/${id}` : null,
    imageAccount: 'hugginsandscott',
  },
  // Cloudflare blocks direct server fetches → Firecrawl. URL rebuilt from the numeric item id.
  grey_flannel: {
    kind: 'firecrawl',
    intervalMs: FIRECRAWL_INTERVAL_MS,
    buildUrl: (lot) => buildGreyFlannelUrl(lot.lot_id),
    parse: (doc, lot) => parseGreyFlannel(doc, { lotId: lot.lot_id, lotNumber: lot.lot_number }),
  },
  // Same CreateAuction platform as Grey Flannel; direct server fetches get HTTP 403 → Firecrawl.
  // URL rebuilt from the numeric item id on the fixed host; page must show the stored lot number.
  love_of_the_game: {
    kind: 'firecrawl',
    intervalMs: FIRECRAWL_INTERVAL_MS,
    buildUrl: (lot) => buildLoveOfTheGameUrl(lot.lot_id),
    parse: (doc, lot) => parseLoveOfTheGame(doc, { lotId: lot.lot_id, lotNumber: lot.lot_number }),
  },
  // Same CreateAuction platform; scraped via Firecrawl like the other CreateAuction
  // houses. URL rebuilt from the numeric item id on the fixed auction.lelands.com
  // host; page must show the stored lot number.
  lelands: {
    kind: 'firecrawl',
    intervalMs: FIRECRAWL_INTERVAL_MS,
    buildUrl: (lot) => buildLelandsUrl(lot.lot_id),
    parse: (doc, lot) => parseLelands(doc, { lotId: lot.lot_id, lotNumber: lot.lot_number }),
  },
  // DataDome blocks direct server fetches → Firecrawl. Stored canonical_url validated (never source_url).
  heritage: {
    kind: 'firecrawl',
    intervalMs: FIRECRAWL_INTERVAL_MS,
    buildUrl: (lot) => validateHeritageUrl(lot.canonical_url, lot.lot_id),
    parse: (doc, lot) => parseHeritage(doc, { lotId: lot.lot_id }),
  },
}

const NO_FIRECRAWL_REASON =
  'Live refresh off: server-side scraping is not configured for this site. Update the price manually from the lot page.'

type Parsed = {
  currentBid: number | null
  endTime: string | null
  status: 'live' | 'extended' | 'closed' | 'unknown'
  imageUrl: string | null
  title: string | null
  lotNumber: string | null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
}

function parseLivewireLot(html: string, lotId: string, imageAccount: string): Parsed {
  // 1) currentBid from the lots.lot-bidding Livewire snapshot (most reliable)
  let currentBid: number | null = null
  const snapRe = /wire:snapshot="([^"]*)"/g
  for (const m of html.matchAll(snapRe)) {
    const raw = decodeEntities(m[1])
    if (!raw.includes('currentBid')) continue
    try {
      const snap = JSON.parse(raw)
      const keyMatches = String(snap?.data?.lot?.[1]?.key ?? '') === lotId
      const name = String(snap?.memo?.name ?? '')
      const v = snap?.data?.currentBid
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && (keyMatches || name === 'lots.lot-bidding')) {
        currentBid = v
        break
      }
    } catch { /* malformed snapshot — try next */ }
  }
  // 2) Fallback: x-data `currentBid: 325`
  if (currentBid === null) {
    const m = html.match(/currentBid:\s*([0-9]+(?:\.[0-9]+)?)\s*[,}\n]/)
    if (m) currentBid = Number(m[1])
  }

  // miniCountdown({ lotId: N, endTime: '...', status: 'live' }) for THIS lot
  let endTime: string | null = null
  let status: Parsed['status'] = 'unknown'
  const cdRe = /miniCountdown\(\{([\s\S]{0,600}?)\}\)/g
  for (const m of html.matchAll(cdRe)) {
    const body = m[1]
    const idM = body.match(/lotId:\s*(\d+)/)
    if (!idM || idM[1] !== lotId) continue
    const endM = body.match(/endTime:\s*'([0-9T:+\-.Z]{10,40})'/)
    if (endM && !Number.isNaN(Date.parse(endM[1]))) endTime = new Date(endM[1]).toISOString()
    const stM = body.match(/status:\s*'([a-z_]+)'/i)
    const periodM = body.match(/auctionPeriod:\s*'([a-z_]+)'/i)
    const st = stM?.[1]?.toLowerCase() ?? ''
    const period = periodM?.[1]?.toLowerCase() ?? ''
    if (/closed|ended|sold|unsold|passed/.test(st)) status = 'closed'
    else if (/extend/.test(period) || /extend/.test(st)) status = 'extended'
    else if (st === 'live' || st === 'open' || st === 'active') status = 'live'
    break
  }

  // First image for this lot on the house's own Cloudinary account
  let imageUrl: string | null = null
  const imgRe = new RegExp(
    `https://res\\.cloudinary\\.com/${imageAccount}/image/upload/[A-Za-z0-9_,:./-]+/${lotId}-1\\.(?:jpg|jpeg|png|webp)`,
    'g',
  )
  const imgs = [...html.matchAll(imgRe)].map((m) => m[0])
  imageUrl = imgs.find((u) => u.includes('c_fit')) ?? imgs[0] ?? null

  // "Lot # 3682: Title" in the H1
  let title: string | null = null
  let lotNumber: string | null = null
  const h1 = html.match(/<h1[^>]*>\s*Lot\s*#\s*([0-9A-Za-z-]{1,12})\s*:\s*([\s\S]{1,500}?)<\/h1>/)
  if (h1) {
    lotNumber = h1[1]
    title = decodeEntities(h1[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).slice(0, 300) || null
  }

  return { currentBid, endTime, status, imageUrl, title, lotNumber }
}

async function readBounded(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return ''
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new Error('Response too large')
    }
    chunks.push(value)
  }
  const buf = new Uint8Array(total)
  let off = 0
  for (const c of chunks) { buf.set(c, off); off += c.byteLength }
  return new TextDecoder().decode(buf)
}

async function fetchBounded(url: string): Promise<{ status: number; body: string }> {
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html' },
  })
  if (res.status !== 200 || !res.body) {
    await res.body?.cancel()
    return { status: res.status, body: '' }
  }
  return { status: 200, body: await readBounded(res, MAX_BODY_BYTES) }
}

type ScrapeResult =
  | { ok: true; doc: FirecrawlDoc }
  | { ok: false; kind: 'blocked' | 'error'; message: string }

/** One Firecrawl scrape (1 credit). Never includes the API key in any message. */
async function firecrawlScrape(url: string, apiKey: string): Promise<ScrapeResult> {
  const res = await fetch(FIRECRAWL_ENDPOINT, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(FIRECRAWL_TIMEOUT_MS),
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown'], maxAge: 0, timeout: FIRECRAWL_TIMEOUT_MS - 5_000 }),
  })
  if (res.status !== 200) {
    await res.body?.cancel()
    const message =
      res.status === 401 || res.status === 403 ? 'Scraping service rejected the server key (check FIRECRAWL_API_KEY)'
      : res.status === 402 ? 'Scraping service is out of credits'
      : res.status === 429 ? 'Scraping service rate limit reached; try again later'
      : `Scraping service returned HTTP ${res.status}`
    return { ok: false, kind: 'error', message }
  }
  let body: unknown
  try { body = JSON.parse(await readBounded(res, MAX_FIRECRAWL_BYTES)) } catch (e) {
    return { ok: false, kind: 'error', message: e instanceof Error && e.message === 'Response too large' ? 'Scraped page too large' : 'Scraping service returned invalid JSON' }
  }
  const doc = extractFirecrawlDoc(body)
  if (!doc) return { ok: false, kind: 'error', message: 'Scraping service returned no page content' }
  const target = targetStatusCode(doc)
  if (target !== null && target !== 200) {
    const blocked = target === 401 || target === 403 || target === 429 || target === 503
    return {
      ok: false,
      kind: blocked ? 'blocked' : 'error',
      message: blocked ? `Blocked by auction site via scraper (HTTP ${target})` : `Lot page returned HTTP ${target}`,
    }
  }
  return { ok: true, doc }
}

// ── Concurrency helper ───────────────────────────────────────────────────────

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return out
}

// ── JWT pre-check (signature is verified by PostgREST) ──────────────────────

function readJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)))
  } catch {
    return null
  }
}


// ── Handler ─────────────────────────────────────────────────────────────────

type Result = 'updated' | 'skipped_recent' | 'deferred' | 'unsupported' | 'blocked' | 'error'
type Outcome = { id: string; result: Result; message?: string }
type Db = ReturnType<typeof createClient>

async function recordFailure(db: Db, lot: LotRow, kind: 'blocked' | 'error', message: string, extra: Record<string, unknown> = {}): Promise<Outcome> {
  // Keeps current_bid / opening_bid / bid_checked_at — the last verified reading stays visible (and goes stale).
  await db.from('auction_watchlist_lots')
    .update({ refresh_status: kind, last_error: message.slice(0, 300), ...extra })
    .eq('id', lot.id)
  return { id: lot.id, result: kind, message }
}

async function claim(db: Db, lot: LotRow, nowIso: string) {
  // Claim the slot first so concurrent callers (and retries after failures) don't re-fetch.
  await db.from('auction_watchlist_lots').update({ refresh_attempted_at: nowIso }).eq('id', lot.id)
}

function fetchErrorMessage(e: unknown, who: string): string {
  if (e instanceof DOMException && e.name === 'TimeoutError') return `${who} timed out`
  return `Fetch failed: ${e instanceof Error ? e.message.slice(0, 160) : 'unknown error'}`
}

async function refreshDirect(db: Db, lot: LotRow, adapter: DirectAdapter, nowIso: string): Promise<Outcome> {
  const url = adapter.buildUrl(lot.lot_id)
  if (!url) {
    await db.from('auction_watchlist_lots')
      .update({ refresh_status: 'error', refresh_attempted_at: nowIso, last_error: 'Invalid lot id' })
      .eq('id', lot.id)
    return { id: lot.id, result: 'error', message: 'Invalid lot id' }
  }
  await claim(db, lot, nowIso)

  try {
    const { status, body } = await fetchBounded(url)
    if (status !== 200) {
      const blocked = status === 401 || status === 403 || status === 429 || status === 503
      return await recordFailure(db, lot, blocked ? 'blocked' : 'error',
        blocked ? `Blocked by auction site (HTTP ${status})` : `Lot page returned HTTP ${status}`)
    }

    const p = parseLivewireLot(body, lot.lot_id, adapter.imageAccount)
    if (p.currentBid === null) {
      return await recordFailure(db, lot, 'error', 'Could not find current bid on lot page (layout may have changed)',
        p.status !== 'unknown' ? { lot_status: p.status } : {})
    }

    const patch: Record<string, unknown> = {
      current_bid: p.currentBid,
      currency: 'USD',
      bid_checked_at: new Date().toISOString(),
      bid_source: 'live',
      lot_status: p.status,
      refresh_status: 'ok',
      last_error: null,
    }
    if (p.endTime) patch.scheduled_close_at = p.endTime
    if (p.imageUrl) patch.image_url = p.imageUrl
    if (!lot.title && p.title) patch.title = p.title
    if (!lot.lot_number && p.lotNumber) patch.lot_number = p.lotNumber

    const { error: upErr } = await db.from('auction_watchlist_lots').update(patch).eq('id', lot.id)
    if (upErr) return { id: lot.id, result: 'error', message: 'Could not save refreshed data' }
    return { id: lot.id, result: 'updated' }
  } catch (e) {
    return await recordFailure(db, lot, 'error', fetchErrorMessage(e, 'Auction site'))
  }
}

async function refreshFirecrawl(db: Db, lot: LotRow, adapter: FirecrawlAdapter, apiKey: string, nowIso: string): Promise<Outcome> {
  const url = adapter.buildUrl(lot)
  if (!url) {
    await db.from('auction_watchlist_lots')
      .update({ refresh_status: 'error', refresh_attempted_at: nowIso, last_error: 'Stored lot URL failed validation' })
      .eq('id', lot.id)
    return { id: lot.id, result: 'error', message: 'Stored lot URL failed validation' }
  }
  await claim(db, lot, nowIso)

  try {
    const scraped = await firecrawlScrape(url, apiKey)
    if (!scraped.ok) return await recordFailure(db, lot, scraped.kind, scraped.message)

    const p = adapter.parse(scraped.doc, lot)
    if (!p.ok) return await recordFailure(db, lot, 'error', p.reason)

    // Fresh, verified reading. A no-bid lot is a successful check with current_bid = NULL.
    const patch: Record<string, unknown> = {
      current_bid: p.currentBid,
      currency: 'USD',
      bid_checked_at: new Date().toISOString(),
      bid_source: 'live',
      refresh_status: 'ok',
      last_error: null,
    }
    if (p.openingBid !== null) patch.opening_bid = p.openingBid
    if (p.status !== 'unknown') patch.lot_status = p.status
    if (p.endTime) patch.scheduled_close_at = p.endTime
    if (p.imageUrl) patch.image_url = p.imageUrl
    if (!lot.title && p.title) patch.title = p.title
    if (!lot.lot_number && p.lotNumber) patch.lot_number = p.lotNumber

    const { error: upErr } = await db.from('auction_watchlist_lots').update(patch).eq('id', lot.id)
    if (upErr) return { id: lot.id, result: 'error', message: 'Could not save refreshed data' }
    return { id: lot.id, result: 'updated' }
  } catch (e) {
    return await recordFailure(db, lot, 'error', fetchErrorMessage(e, 'Scraping service'))
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) return json(req, { error: 'Function is not configured' }, 500)
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')?.trim() || null

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1] ?? ''
  const claims = token ? readJwtPayload(token) : null
  const exp = typeof claims?.exp === 'number' ? claims.exp : 0
  if (!claims || claims.role !== 'authenticated' || exp * 1000 < Date.now()) {
    return json(req, { error: 'Sign in required' }, 401)
  }

  let lotIds: string[] | null = null
  try {
    const body = await req.json()
    if (Array.isArray(body?.lot_ids)) {
      lotIds = body.lot_ids
        .filter((v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v))
        .slice(0, MAX_LOTS_PER_CALL)
      if (lotIds!.length === 0) return json(req, { error: 'No valid lot_ids' }, 400)
    }
  } catch { /* empty body → refresh all registered lots */ }

  // Runs as the caller (authenticated) — RLS enforced, no service role.
  const db = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let query = db
    .from('auction_watchlist_lots')
    .select('id, house, lot_id, canonical_url, title, lot_number, image_url, refresh_attempted_at')
    .order('scheduled_close_at', { ascending: true, nullsFirst: false })
    .limit(MAX_LOTS_PER_CALL)
  if (lotIds) query = query.in('id', lotIds)

  const { data: lots, error: readErr } = await query
  if (readErr) {
    // Invalid/expired/unsigned tokens surface here as PostgREST auth errors.
    const authFail = /jwt|jws|token|permission|401/i.test(readErr.message)
    return json(req, { error: authFail ? 'Not authorized' : 'Could not read watchlist' }, authFail ? 401 : 500)
  }

  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const outcomes: Outcome[] = []
  const direct: Array<[LotRow, DirectAdapter]> = []
  const scrape: Array<[LotRow, FirecrawlAdapter]> = []

  // Triage without network: unsupported / not-due / over-budget lots are decided here.
  for (const lot of (lots ?? []) as LotRow[]) {
    const adapter = ADAPTERS[lot.house]
    if (!adapter || (adapter.kind === 'firecrawl' && !firecrawlKey)) {
      const message = adapter ? NO_FIRECRAWL_REASON : 'Live refresh unavailable for this auction house.'
      await db.from('auction_watchlist_lots')
        .update({ refresh_status: 'unsupported', last_error: message })
        .eq('id', lot.id)
        .not('refresh_status', 'in', '(manual,unsupported)')
      outcomes.push({ id: lot.id, result: 'unsupported', message })
      continue
    }
    const last = lot.refresh_attempted_at ? Date.parse(lot.refresh_attempted_at) : 0
    if (now - last < adapter.intervalMs) {
      outcomes.push({ id: lot.id, result: 'skipped_recent' })
      continue
    }
    if (adapter.kind === 'direct') direct.push([lot, adapter])
    else if (scrape.length < MAX_FIRECRAWL_PER_CALL) scrape.push([lot, adapter])
    else outcomes.push({ id: lot.id, result: 'deferred', message: 'Scrape budget for this refresh reached; will be checked next time' })
  }

  const [directOut, scrapeOut] = await Promise.all([
    mapLimit(direct, CONCURRENCY, ([lot, a]) => refreshDirect(db, lot, a, nowIso)),
    mapLimit(scrape, FIRECRAWL_CONCURRENCY, ([lot, a]) => refreshFirecrawl(db, lot, a, firecrawlKey!, nowIso)),
  ])
  outcomes.push(...directOut, ...scrapeOut)

  const count = (r: Result) => outcomes.filter((o) => o.result === r).length
  return json(req, {
    checked_at: nowIso,
    total: outcomes.length,
    updated: count('updated'),
    skipped_recent: count('skipped_recent'),
    deferred: count('deferred'),
    unsupported: count('unsupported'),
    blocked: count('blocked'),
    errors: count('error'),
    results: outcomes,
    firecrawl_configured: !!firecrawlKey,
    min_interval_minutes: { direct: DIRECT_INTERVAL_MS / 60_000, scraped: FIRECRAWL_INTERVAL_MS / 60_000 },
  })
})
