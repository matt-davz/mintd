/// <reference lib="deno.ns" />
// ws-ticket-tracker
//
// Reads the private "WS Ticket Tracker" Google Sheet and returns ONLY the
// World Series games currently marked "Don't Have" as { year, game, row }.
// Called from the signed-in /admin/auction-watchlist page, which matches them
// against watchlist lots client-side.
//
// Security model
// - Auth: same as auction-watchlist-refresh. The caller's Clerk JWT must be a
//   non-expired `role: authenticated` token, and is then proven by a read of
//   auction_watchlist_lots through PostgREST AS THE CALLER (anon key + caller
//   JWT, RLS enforced). PostgREST verifies the signature; anon/forged tokens
//   get 401 and the sheet is never read. The service role key is NOT used.
//   Deploy with --no-verify-jwt (the gateway's legacy check rejects Clerk tokens).
// - Fixed target: spreadsheet id, tab and bounded range are constants. Nothing
//   from the request is used to build the Google request.
// - Secret: GOOGLE_SERVICE_ACCOUNT (service-account JSON) is read only from
//   Edge Function secrets, used to mint a short-lived read-only OAuth token,
//   and never returned or logged. Without it the function answers 503
//   { configured: false } and the UI says the sheet is not connected.
// - Minimal output: no labels, scores, "Have" rows or totals are returned.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseTrackerValues } from './sheet.ts'

const SPREADSHEET_ID = '120JePbptof1PYYnld1HPsNnMzAoyxGBrf0GWBq7EuSU'
const SHEET_TAB = 'Sheet1'
const SHEET_RANGE = 'A1:C1000'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const VALUES_URL =
  `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/` +
  `${encodeURIComponent(`${SHEET_TAB}!${SHEET_RANGE}`)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`
const TIMEOUT_MS = 10_000
const MAX_SHEET_BYTES = 1_000_000

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
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

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

/** Errors whose message is safe to show the signed-in user. */
class SheetError extends Error {}

// ── Google service-account auth (RS256 JWT bearer grant, WebCrypto) ─────────

type ServiceAccount = { client_email: string; private_key: string }

function readServiceAccount(): ServiceAccount | null {
  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')?.trim()
  if (!raw) return null
  try {
    const sa = JSON.parse(raw)
    if (typeof sa?.client_email !== 'string' || typeof sa?.private_key !== 'string') return null
    return { client_email: sa.client_email, private_key: sa.private_key.replace(/\\n/g, '\n') }
  } catch {
    return null
  }
}

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64urlJson = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)))

let cachedToken: { email: string; token: string; expMs: number } | null = null

async function googleAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.email === sa.client_email && cachedToken.expMs - 60_000 > Date.now()) {
    return cachedToken.token
  }
  const pem = sa.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${b64urlJson({ alg: 'RS256', typ: 'JWT' })}.${b64urlJson({
    iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600,
  })}`
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)))
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${b64url(sig)}`,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new SheetError('Google rejected the service account credentials')
  const body = await res.json()
  if (typeof body?.access_token !== 'string') throw new SheetError('Google returned no access token')
  cachedToken = { email: sa.client_email, token: body.access_token, expMs: Date.now() + (Number(body.expires_in) || 3600) * 1000 }
  return body.access_token
}

async function readSheetValues(sa: ServiceAccount): Promise<unknown> {
  const token = await googleAccessToken(sa)
  const res = await fetch(VALUES_URL, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'error',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (res.status === 401 || res.status === 403) {
    cachedToken = null
    throw new SheetError('The service account cannot read the tracker sheet (check sharing)')
  }
  if (res.status === 404) throw new SheetError('Tracker sheet or tab not found')
  if (!res.ok) throw new SheetError(`Google Sheets error (HTTP ${res.status})`)
  const text = await res.text()
  if (text.length > MAX_SHEET_BYTES) throw new SheetError('Tracker sheet response too large')
  return JSON.parse(text)?.values ?? []
}

// ── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) return json(req, { error: 'Function is not configured' }, 500)

  const token = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i)?.[1] ?? ''
  const claims = token ? readJwtPayload(token) : null
  const exp = typeof claims?.exp === 'number' ? claims.exp : 0
  if (!claims || claims.role !== 'authenticated' || exp * 1000 < Date.now()) {
    return json(req, { error: 'Sign in required' }, 401)
  }

  // Prove the token through PostgREST as the caller (signature checked there; RLS applies).
  const db = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: authErr } = await db.from('auction_watchlist_lots').select('id').limit(1)
  if (authErr) {
    const authFail = /jwt|jws|token|permission|401/i.test(authErr.message)
    return json(req, { error: authFail ? 'Not authorized' : 'Could not verify session' }, authFail ? 401 : 500)
  }

  const sa = readServiceAccount()
  if (!sa) {
    return json(req, { configured: false, error: 'Tracker sheet is not connected (GOOGLE_SERVICE_ACCOUNT secret not set)' }, 503)
  }

  try {
    const parsed = parseTrackerValues(await readSheetValues(sa))
    if (!parsed.ok) return json(req, { configured: true, error: parsed.error }, 502)
    return json(req, {
      configured: true,
      read_at: new Date().toISOString(),
      source: `${SHEET_TAB}!${SHEET_RANGE}`,
      games_parsed: parsed.gamesParsed,
      missing: parsed.missing,
    })
  } catch (e) {
    const message = e instanceof SheetError ? e.message : 'Could not read the tracker sheet'
    return json(req, { configured: true, error: message }, 502)
  }
})
