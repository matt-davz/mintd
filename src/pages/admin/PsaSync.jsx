import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'

// ─── Layout ───────────────────────────────────────────────────────────────────

const PageHeading = styled.div`
  margin-bottom: var(--space-8);
`

const PageTitle = styled.h1`
  font-family: var(--font-headline);
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-on-surface);
  margin-bottom: var(--space-2);
`

const PageSub = styled.p`
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: rgba(229, 226, 225, 0.4);
`

// ─── Stat cards ───────────────────────────────────────────────────────────────

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`

const StatCard = styled.div`
  background: var(--color-surface-low);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
`

const StatLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-2);
`

const StatValue = styled.p`
  font-family: var(--font-mono);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: ${({ $accent }) =>
    $accent === 'primary' ? 'var(--color-primary)' :
    $accent === 'error'   ? 'var(--color-error)' :
    $accent === 'warn'    ? 'var(--color-secondary-fixed)' :
    'var(--color-on-surface)'};
`

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressWrap = styled.div`
  margin-bottom: var(--space-8);
`

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-3);
`

const ProgressLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
`

const ProgressPct = styled.span`
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-primary);
`

const ProgressTrack = styled.div`
  height: 4px;
  background: var(--color-surface-low);
  border-radius: 2px;
  overflow: hidden;
`

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, var(--color-primary-container), var(--color-primary));
  border-radius: 2px;
  transition: width 600ms ease;
`

// ─── Trigger panel ────────────────────────────────────────────────────────────

const Panel = styled.div`
  background: var(--color-surface-low);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  margin-bottom: var(--space-6);
`

const PanelTitle = styled.h2`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-6);
`

const SyncRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
`

const SyncBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  color: var(--color-on-primary);
  font-family: var(--font-headline);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity var(--transition-base);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .material-symbols-outlined {
    font-size: 1.125rem;
    animation: ${({ $spinning }) => $spinning ? 'spin 1s linear infinite' : 'none'};
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const SyncMeta = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-outline);
  letter-spacing: 0.05em;
  line-height: 1.6;
`

// ─── Result / alert panels ────────────────────────────────────────────────────

const AlertPanel = styled.div`
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  margin-bottom: var(--space-4);
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;

  background: ${({ $type }) =>
    $type === 'warn'    ? 'rgba(143, 113, 0, 0.12)' :
    $type === 'error'   ? 'rgba(147, 0, 10, 0.1)' :
    'rgba(77, 142, 255, 0.07)'};
  border: 1px solid ${({ $type }) =>
    $type === 'warn'    ? 'rgba(255, 224, 141, 0.2)' :
    $type === 'error'   ? 'rgba(147, 0, 10, 0.25)' :
    'rgba(77, 142, 255, 0.15)'};

  .material-symbols-outlined {
    font-size: 1.25rem;
    flex-shrink: 0;
    color: ${({ $type }) =>
      $type === 'warn'  ? 'var(--color-secondary-fixed)' :
      $type === 'error' ? 'var(--color-error)' :
      'var(--color-primary)'};
    margin-top: 1px;
  }
`

const AlertBody = styled.div``

const AlertTitle = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-on-surface);
  margin-bottom: var(--space-1);
`

const AlertSub = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-outline);
  line-height: 1.6;
`

const ErrorList = styled.ul`
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  list-style: none;
  padding: 0;
`

const ErrorItem = styled.li`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-error);
  padding: var(--space-2) var(--space-3);
  background: rgba(147, 0, 10, 0.1);
  border-radius: var(--radius-sm, 4px);
`

// ─── Component ────────────────────────────────────────────────────────────────

export default function PsaSync() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState(null)
  const [meta, setMeta] = useState({
    totalCerts: null,
    syncedCerts: null,   // certs that have at least one snapshot
    lastSyncAt: null,
  })

  const loadMeta = async () => {
    const [certRes, syncedRes, snapRes] = await Promise.all([
      // Total PSA certs
      supabase
        .from('certifications')
        .select('id', { count: 'exact', head: true })
        .in('cert_service', ['PSA', 'PSA/DNA'])
        .not('cert_id', 'is', null),
      // Certs that have at least one population snapshot
      supabase
        .from('latest_population')
        .select('cert_id', { count: 'exact', head: true }),
      // Most recent snapshot timestamp
      supabase
        .from('population_snapshots')
        .select('recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    setMeta({
      totalCerts: certRes.count ?? null,
      syncedCerts: syncedRes.count ?? null,
      lastSyncAt: snapRes.data?.recorded_at ?? null,
    })
  }

  useEffect(() => {
    loadMeta()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)

    const { data, error } = await supabase.functions.invoke('psa-sync')

    setSyncing(false)

    if (error) {
      setResult({ fatalError: error.message })
      return
    }

    setResult(data)
    await loadMeta() // refresh counts after sync
  }

  const formatDate = (iso) => {
    if (!iso) return null
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  const { totalCerts, syncedCerts, lastSyncAt } = meta
  const pendingCerts = totalCerts !== null && syncedCerts !== null
    ? Math.max(0, totalCerts - syncedCerts)
    : null
  const progressPct = totalCerts && syncedCerts !== null
    ? Math.round((syncedCerts / totalCerts) * 100)
    : 0
  const estDaysRemaining = pendingCerts !== null
    ? Math.ceil(pendingCerts / 25)
    : null

  return (
    <>
      <PageHeading>
        <PageTitle>PSA Population Sync</PageTitle>
        <PageSub>
          Syncs 25 certs per run (25 PSA API calls). Prioritises certs that have never been
          synced or were synced longest ago. Up to 4 runs per day before hitting the 100-call limit.
        </PageSub>
      </PageHeading>

      {/* ── Stats ── */}
      <CardGrid>
        <StatCard>
          <StatLabel>Total PSA Certs</StatLabel>
          <StatValue>{totalCerts ?? '—'}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Synced</StatLabel>
          <StatValue $accent="primary">{syncedCerts ?? '—'}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Pending</StatLabel>
          <StatValue $accent={pendingCerts > 0 ? 'warn' : undefined}>
            {pendingCerts ?? '—'}
          </StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Est. Days Left</StatLabel>
          <StatValue $accent={estDaysRemaining > 0 ? 'warn' : undefined}>
            {estDaysRemaining !== null ? (estDaysRemaining === 0 ? '✓' : estDaysRemaining) : '—'}
          </StatValue>
        </StatCard>
      </CardGrid>

      {/* ── Progress bar ── */}
      {totalCerts > 0 && (
        <ProgressWrap>
          <ProgressHeader>
            <ProgressLabel>Sync coverage</ProgressLabel>
            <ProgressPct>{progressPct}%</ProgressPct>
          </ProgressHeader>
          <ProgressTrack>
            <ProgressFill $pct={progressPct} />
          </ProgressTrack>
        </ProgressWrap>
      )}

      {/* ── Trigger ── */}
      <Panel>
        <PanelTitle>Manual Sync</PanelTitle>
        <SyncRow>
          <SyncBtn onClick={handleSync} disabled={syncing} $spinning={syncing}>
            <span className="material-symbols-outlined">
              {syncing ? 'autorenew' : 'sync'}
            </span>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </SyncBtn>
          <SyncMeta>
            {lastSyncAt
              ? `Last synced ${formatDate(lastSyncAt)}`
              : 'Never synced'}
            {pendingCerts > 0 && ` · ${pendingCerts} cert${pendingCerts !== 1 ? 's' : ''} pending`}
          </SyncMeta>
        </SyncRow>
      </Panel>

      {/* ── Post-sync result alerts ── */}
      {result && !result.fatalError && (
        <>
          {result.rate_limited && (
            <AlertPanel $type="warn">
              <span className="material-symbols-outlined">schedule</span>
              <AlertBody>
                <AlertTitle>PSA daily limit reached</AlertTitle>
                <AlertSub>
                  Synced {result.synced} cert{result.synced !== 1 ? 's' : ''} before hitting
                  the 100-call limit. {result.remaining} cert{result.remaining !== 1 ? 's' : ''} still
                  pending — run Sync Now again tomorrow to continue.
                </AlertSub>
              </AlertBody>
            </AlertPanel>
          )}

          {!result.rate_limited && (
            <AlertPanel $type={result.errors?.length ? 'error' : 'info'}>
              <span className="material-symbols-outlined">
                {result.errors?.length ? 'warning' : 'check_circle'}
              </span>
              <AlertBody>
                <AlertTitle>
                  {result.synced} of {result.total_certs} cert{result.total_certs !== 1 ? 's' : ''} synced
                  {result.remaining > 0 ? ` · ${result.remaining} remaining` : ' — all up to date'}
                </AlertTitle>
                {result.remaining > 0 && (
                  <AlertSub>
                    Run Sync Now again to process the next batch of {Math.min(25, result.remaining)}.
                  </AlertSub>
                )}
              </AlertBody>
            </AlertPanel>
          )}

          {result.errors?.length > 0 && (
            <AlertPanel $type="error">
              <span className="material-symbols-outlined">error</span>
              <AlertBody>
                <AlertTitle>{result.errors.length} cert{result.errors.length !== 1 ? 's' : ''} failed</AlertTitle>
                <ErrorList>
                  {result.errors.map((e, i) => (
                    <ErrorItem key={i}>Cert {e.cert_id}: {e.error}</ErrorItem>
                  ))}
                </ErrorList>
              </AlertBody>
            </AlertPanel>
          )}
        </>
      )}

      {result?.fatalError && (
        <AlertPanel $type="error">
          <span className="material-symbols-outlined">error</span>
          <AlertBody>
            <AlertTitle>Sync failed</AlertTitle>
            <AlertSub>{result.fatalError}</AlertSub>
          </AlertBody>
        </AlertPanel>
      )}
    </>
  )
}
