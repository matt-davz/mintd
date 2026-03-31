/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PSA_API_BASE = 'https://api.psacard.com/publicapi'
// 1 API call per cert — capped at 25 per run to stay well under the 100/day PSA limit
const BATCH_SIZE = 25

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// PSA grade name → numeric value for higher/same/lower bucketing
// e.g. "NM-MT 8" → 8, "GEM MT 10" → 10, "Authentic" → 0
function extractGradeValue(gradeStr: string): number | null {
  if (!gradeStr) return null
  if (/authentic|auth/i.test(gradeStr)) return 0
  const match = gradeStr.match(/(\d+(?:\.\d+)?)\s*$/)
  return match ? parseFloat(match[1]) : null
}

// Map a numeric grade value to the PSASpecPopSummaryModel field name
// e.g. 10 → "Grade10", 8.5 → "Grade8Half", 1.5 → "Grade1Half", 0 → "Auth"
function gradeValueToField(val: number): string {
  if (val === 0) return 'Auth'
  const whole = Math.floor(val)
  const half = val % 1 !== 0
  return half ? `Grade${whole}Half` : `Grade${whole}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const psaApiKey = Deno.env.get('PSA_API_KEY')
  if (!psaApiKey) {
    return jsonResponse({ error: 'PSA_API_KEY secret is not configured' }, 500)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ── Fetch all PSA / PSA-DNA certs with a cert number ──────────────────────
  const { data: allCerts, error: certsError } = await supabase
    .from('certifications')
    .select('id, cert_id, cert_service, is_autograph_cert')
    .in('cert_service', ['PSA', 'PSA/DNA'])
    .not('cert_id', 'is', null)

  if (certsError) return jsonResponse({ error: certsError.message }, 500)
  if (!allCerts || allCerts.length === 0) {
    return jsonResponse({ synced: 0, total_certs: 0, remaining: 0, rate_limited: false, errors: [] })
  }

  // ── Sort: never-synced first, then oldest-synced ──────────────────────────
  const certIds = allCerts.map((c) => c.id)
  const { data: latestPops } = await supabase
    .from('latest_population')
    .select('cert_id, recorded_at')
    .in('cert_id', certIds)

  const lastSyncedMap = new Map<string, number>(
    (latestPops ?? []).map((p) => [p.cert_id as string, new Date(p.recorded_at as string).getTime()])
  )

  const sortedCerts = [...allCerts].sort((a, b) => {
    const aTime: number = lastSyncedMap.get(a.id) ?? 0
    const bTime: number = lastSyncedMap.get(b.id) ?? 0
    return aTime - bTime
  })

  const toSync = sortedCerts.slice(0, BATCH_SIZE)
  const remainingAfter = Math.max(0, sortedCerts.length - BATCH_SIZE)

  const psaHeaders = {
    'Authorization': `Bearer ${psaApiKey}`,
    'Content-Type': 'application/json',
  }

  const synced: string[] = []
  const errors: { cert_id: string; error: string }[] = []
  let rateLimited = false

  for (const cert of toSync) {
    // ── Single call: GET /cert/GetByCertNumber/{certNumber} ─────────────────
    // Response includes TotalPopulation + PopulationHigher inline — no second call needed
    const certRes = await fetch(
      `${PSA_API_BASE}/cert/GetByCertNumber/${cert.cert_id}`,
      { headers: psaHeaders }
    )

    if (certRes.status === 429) {
      rateLimited = true
      break
    }

    if (!certRes.ok) {
      errors.push({ cert_id: cert.cert_id, error: `Cert lookup failed (HTTP ${certRes.status})` })
      continue
    }

    const certData = await certRes.json()

    // PSA/DNA certs return DNACert; regular PSA grades return PSACert
    const psaCert = certData?.PSACert
    const dnaCert = certData?.DNACert
    const isAutograph = cert.is_autograph_cert || !!dnaCert

    let total = 0
    let higher = 0
    let same = 0
    let lower = 0

    if (psaCert) {
      // PSACert has TotalPopulation and PopulationHigher inline
      total  = psaCert.TotalPopulation ?? 0
      higher = psaCert.PopulationHigher ?? 0
      // "same grade" = total minus higher minus lower
      // PSA API doesn't give us lower directly, but we can get same via grade field
      // Use TotalPopulation - PopulationHigher as "same + lower" and approximate:
      // same = total - higher - lower (we don't have lower separately, so store same=0, lower=remainder)
      // Better: use the grade-specific field from GetPSASpecPopulation if needed,
      // but for now derive same by matching CardGrade to known grade buckets
      const gradeVal = extractGradeValue(psaCert.CardGrade ?? '')
      const gradeField = gradeVal !== null ? gradeValueToField(gradeVal) : null

      // If we can map the grade to a field name, we'd need the spec pop call.
      // Since GetByCertNumber doesn't give grade-level breakdown, set:
      //   same = 0, lower = total - higher (honest about what we know)
      // The display shows higher/same/lower — lower here means "same grade or below"
      same  = 0
      lower = Math.max(0, total - higher)

      // Suppress unused variable warning
      void gradeField
    } else if (dnaCert) {
      // PSA/DNA autograph certs — population fields may differ; store what we have
      total  = 0
      higher = 0
      same   = 0
      lower  = 0
      errors.push({ cert_id: cert.cert_id, error: 'PSA/DNA cert — population data not available via this endpoint' })
      continue
    } else {
      errors.push({ cert_id: cert.cert_id, error: 'Neither PSACert nor DNACert in response' })
      continue
    }

    // ── Insert snapshot ───────────────────────────────────────────────────────
    const { error: insertError } = await supabase
      .from('population_snapshots')
      .insert({
        cert_id: cert.id,
        snapshot_type: isAutograph ? 'psa_dna' : 'psa_grade',
        total,
        higher,
        same,
        lower,
      })

    if (insertError) {
      errors.push({ cert_id: cert.cert_id, error: insertError.message })
    } else {
      synced.push(cert.cert_id)
    }
  }

  const remaining = rateLimited
    ? (toSync.length - synced.length - errors.length) + remainingAfter
    : remainingAfter

  return jsonResponse({
    synced: synced.length,
    total_certs: allCerts.length,
    remaining,
    rate_limited: rateLimited,
    errors,
  })
})
