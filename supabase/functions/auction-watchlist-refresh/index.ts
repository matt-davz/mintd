/// <reference lib="deno.ns" />
// auction-watchlist-refresh
//
// Refreshes current bid / close time / status / image for lots already
// registered in public.auction_watchlist_lots. Called from the signed-in
// admin page (/admin/auction-watchlist).
//
// Security model
// - Auth: the caller's Clerk session JWT (Supabase third-party auth) is
//   forwarded to PostgREST. All reads/writes run as `authenticated` under
//   RLS — the service role key is NOT used. An anon/invalid token can't read
//   the table, so it gets 401 and nothing is fetched.
//   Deploy with --no-verify-jwt: the Edge gateway's legacy JWT check doesn't
//   understand Clerk tokens; verification happens at PostgREST instead.
// - SSRF: we never fetch a URL stored in the table or supplied by the
//   client. The fetch URL is rebuilt from (house, lot_id) using a fixed
//   https host per house, lot_id must be all digits, redirects are not
//   followed, responses are size-capped, and requests time out.
// - Rate limit: each lot is fetched at most once per REFRESH_INTERVAL_MS
//   (tracked in refresh_attempted_at), with bounded concurrency.
// - Honesty: prices are only written when parsed from a fresh 200 response.
//   On failure the last verified price is kept and the error is recorded.
//   Grey Flannel (Cloudflare) and Heritage (DataDome) block server fetches
//   with bot challenges; we don't try to get around them. Those lots are
//   marked `unsupported` and are updated manually in the UI.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const REFRESH_INTERVAL_MS = 10 * 60 * 1000
const REQUEST_TIMEOUT_MS = 12_000
const MAX_BODY_BYTES = 2_000_000
const CONCURRENCY = 3
const MAX_LOTS_PER_CALL = 60
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

type Adapter = {
  buildUrl: (lotId: string) => string | null
  imageAccount: string
}

const NUMERIC_ID = /^[0-9]{1,10}$/

// REA and Huggins & Scott run the same Laravel/Livewire bidding platform.
const ADAPTERS: Record<string, Adapter> = {
  rea: {
    buildUrl: (id) => NUMERIC_ID.test(id) ? `https://bid.collectrea.com/lots/${id}` : null,
    imageAccount: 'robertedwardauctions',
  },
  huggins_scott: {
    buildUrl: (id) => NUMERIC_ID.test(id) ? `https://bid.hugginsandscott.com/lots/${id}` : null,
    imageAccount: 'hugginsandscott',
  },
}

const UNSUPPORTED_REASON: Record<string, string> = {
  grey_flannel: 'Live refresh unavailable: Grey Flannel blocks server requests (Cloudflare challenge). Update manually from the lot page.',
  heritage: 'Live refresh unavailable: Heritage blocks server requests (bot challenge). Update manually from the lot page.',
}

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
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new Error('Response too large')
    }
    chunks.push(value)
  }
  const buf = new Uint8Array(total)
  let off = 0
  for (const c of chunks) { buf.set(c, off); off += c.byteLength }
  return { status: 200, body: new TextDecoder().decode(buf) }
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

type LotRow = {
  id: string
  house: string
  lot_id: string
  title: string | null
  lot_number: string | null
  image_url: string | null
  refresh_attempted_at: string | null
}

type Outcome = { id: string; result: 'updated' | 'skipped_recent' | 'unsupported' | 'blocked' | 'error'; message?: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) return json(req, { error: 'Function is not configured' }, 500)

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
    .select('id, house, lot_id, title, lot_number, image_url, refresh_attempted_at')
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

  const outcomes = await mapLimit<LotRow, Outcome>((lots ?? []) as LotRow[], CONCURRENCY, async (lot) => {
    const adapter = ADAPTERS[lot.house]
    if (!adapter) {
      const message = UNSUPPORTED_REASON[lot.house] ?? 'Live refresh unavailable for this auction house.'
      await db.from('auction_watchlist_lots')
        .update({ refresh_status: 'unsupported', last_error: message })
        .eq('id', lot.id)
        .not('refresh_status', 'in', '(manual,unsupported)')
      return { id: lot.id, result: 'unsupported', message }
    }

    const last = lot.refresh_attempted_at ? Date.parse(lot.refresh_attempted_at) : 0
    if (now - last < REFRESH_INTERVAL_MS) return { id: lot.id, result: 'skipped_recent' }

    const url = adapter.buildUrl(lot.lot_id)
    if (!url) {
      await db.from('auction_watchlist_lots')
        .update({ refresh_status: 'error', refresh_attempted_at: nowIso, last_error: 'Invalid lot id' })
        .eq('id', lot.id)
      return { id: lot.id, result: 'error', message: 'Invalid lot id' }
    }

    // Claim the slot first so concurrent callers don't double-fetch.
    await db.from('auction_watchlist_lots').update({ refresh_attempted_at: nowIso }).eq('id', lot.id)

    try {
      const { status, body } = await fetchBounded(url)
      if (status !== 200) {
        const blocked = status === 401 || status === 403 || status === 429 || status === 503
        const message = blocked ? `Blocked by auction site (HTTP ${status})` : `Lot page returned HTTP ${status}`
        await db.from('auction_watchlist_lots')
          .update({ refresh_status: blocked ? 'blocked' : 'error', last_error: message })
          .eq('id', lot.id)
        return { id: lot.id, result: blocked ? 'blocked' : 'error', message }
      }

      const p = parseLivewireLot(body, lot.lot_id, adapter.imageAccount)
      if (p.currentBid === null) {
        const message = 'Could not find current bid on lot page (layout may have changed)'
        await db.from('auction_watchlist_lots')
          .update({ refresh_status: 'error', last_error: message, ...(p.status !== 'unknown' ? { lot_status: p.status } : {}) })
          .eq('id', lot.id)
        return { id: lot.id, result: 'error', message }
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
      const message = e instanceof DOMException && e.name === 'TimeoutError'
        ? 'Auction site timed out'
        : `Fetch failed: ${e instanceof Error ? e.message.slice(0, 160) : 'unknown error'}`
      await db.from('auction_watchlist_lots')
        .update({ refresh_status: 'error', last_error: message })
        .eq('id', lot.id)
      return { id: lot.id, result: 'error', message }
    }
  })

  const count = (r: Outcome['result']) => outcomes.filter((o) => o.result === r).length
  return json(req, {
    checked_at: nowIso,
    total: outcomes.length,
    updated: count('updated'),
    skipped_recent: count('skipped_recent'),
    unsupported: count('unsupported'),
    blocked: count('blocked'),
    errors: count('error'),
    results: outcomes,
    min_interval_minutes: REFRESH_INTERVAL_MS / 60_000,
  })
})
