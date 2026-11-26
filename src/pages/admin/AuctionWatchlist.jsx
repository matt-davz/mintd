import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { useAuctionWatchlist } from '../../hooks/useAuctionWatchlist'
import { HOUSES, REFRESH_INTERVAL_MIN } from '../../lib/auctionWatchlist'
import { ErrorBanner, PageHeading, PageSub, PageTitle } from '../../components/admin/FormFields'
import { AddLotForm } from '../../components/admin/watchlist/AddLotForm'
import { WatchlistToolbar } from '../../components/admin/watchlist/WatchlistToolbar'
import { AuctionGroup } from '../../components/admin/watchlist/AuctionGroup'
import { GhostBtn, StateBox } from '../../components/admin/watchlist/styles'

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);

  ${PageHeading} { margin-bottom: 0; }
`

const HeaderActions = styled.div`
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
`

const Summary = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-on-surface-variant);
  margin-bottom: var(--space-4);
`

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-top: var(--space-6);
`

function summarize(r) {
  const parts = [`${r.updated} updated`]
  if (r.skipped_recent) parts.push(`${r.skipped_recent} checked <${r.min_interval_minutes ?? REFRESH_INTERVAL_MIN}m ago`)
  if (r.unsupported) parts.push(`${r.unsupported} manual-only`)
  if (r.blocked) parts.push(`${r.blocked} blocked`)
  if (r.errors) parts.push(`${r.errors} failed`)
  return parts.join(' · ')
}

const isDue = (lot, now) => HOUSES[lot.house]?.liveRefresh
  && (!lot.refresh_attempted_at || now - new Date(lot.refresh_attempted_at).getTime() > REFRESH_INTERVAL_MIN * 60000)

export default function AuctionWatchlist() {
  const { lots, loading, error, refresh, addLot, removeLot, updateLot, setManualPrice } = useAuctionWatchlist()
  const [now, setNow] = useState(() => Date.now())
  const [search, setSearch] = useState('')
  const [houseFilter, setHouseFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState(null)
  const autoRefreshed = useRef(false)

  // Local countdown tick — once a minute.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])

  async function runRefresh() {
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const r = await refresh()
      setRefreshMsg({ text: `Refreshed: ${summarize(r)}` })
    } catch (e) {
      setRefreshMsg({ text: `Refresh failed: ${e.message}`, error: true })
    } finally {
      setRefreshing(false)
      setNow(Date.now())
    }
  }

  // Auto-refresh once per visit when live lots are due (server enforces the 10-min cap anyway).
  useEffect(() => {
    if (loading || error || autoRefreshed.current) return
    autoRefreshed.current = true
    const start = Date.now()
    if (lots.some(l => isDue(l, start))) Promise.resolve().then(runRefresh)
    // runRefresh intentionally excluded — run once after first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, lots])

  const availableHouses = useMemo(() => [...new Set(lots.map(l => l.house))], [lots])

  const auctionsByHouse = useMemo(() => {
    const out = {}
    for (const l of lots) (out[l.house] ??= new Set()).add(l.auction_name)
    return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]))
  }, [lots])

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = lots.filter(l =>
      (!houseFilter || l.house === houseFilter) &&
      (!q || [l.title, l.lot_number, l.lot_id, l.auction_name, HOUSES[l.house]?.label]
        .some(v => v && String(v).toLowerCase().includes(q))))
    const closeMs = (l) => (l.scheduled_close_at ? new Date(l.scheduled_close_at).getTime() : Infinity)
    const map = new Map()
    for (const l of filtered) {
      const key = `${l.house}::${l.auction_name}`
      if (!map.has(key)) map.set(key, { key, house: l.house, auctionName: l.auction_name, lots: [] })
      map.get(key).lots.push(l)
    }
    const list = [...map.values()]
    for (const g of list) {
      g.lots.sort((a, b) => closeMs(a) - closeMs(b)
        || (b.priority === 'must_win') - (a.priority === 'must_win')
        || String(a.lot_number ?? '').localeCompare(String(b.lot_number ?? ''), undefined, { numeric: true }))
      g.firstClose = Math.min(...g.lots.map(closeMs))
    }
    return list.sort((a, b) => a.firstClose - b.firstClose)
  }, [lots, search, houseFilter])

  const handleTogglePriority = (lot) => updateLot(lot.id, { priority: lot.priority === 'must_win' ? 'normal' : 'must_win' })

  return (
    <>
      <HeaderRow>
        <PageHeading>
          <PageTitle>Auction Watchlist</PageTitle>
          <PageSub>Private · {lots.length} lot{lots.length === 1 ? '' : 's'} across upcoming auctions. Times shown in your local time zone.</PageSub>
        </PageHeading>
        <HeaderActions>
          <GhostBtn type="button" onClick={runRefresh} disabled={refreshing || loading || !!error || lots.length === 0}>
            <span className="material-symbols-outlined">refresh</span>{refreshing ? 'Refreshing…' : 'Refresh prices'}
          </GhostBtn>
          <GhostBtn type="button" onClick={() => setShowAdd(s => !s)} aria-expanded={showAdd}>
            <span className="material-symbols-outlined">{showAdd ? 'close' : 'add'}</span>Add lot
          </GhostBtn>
        </HeaderActions>
      </HeaderRow>

      {refreshMsg && (refreshMsg.error
        ? <ErrorBanner role="alert" style={{ marginBottom: 'var(--space-4)' }}>{refreshMsg.text}</ErrorBanner>
        : <Summary role="status">{refreshMsg.text}. Live prices: REA &amp; Huggins &amp; Scott; each lot is checked at most every {REFRESH_INTERVAL_MIN} min.</Summary>)}

      {showAdd && <AddLotForm auctionsByHouse={auctionsByHouse} onAdd={addLot} onClose={() => setShowAdd(false)} />}

      {loading ? (
        <StateBox><span className="material-symbols-outlined">hourglass_empty</span>Loading watchlist…</StateBox>
      ) : error ? (
        <StateBox role="alert"><span className="material-symbols-outlined">error</span>Couldn’t load the watchlist. {error}</StateBox>
      ) : lots.length === 0 ? (
        <StateBox><span className="material-symbols-outlined">gavel</span>No lots yet. Use “Add lot” to paste a lot URL.</StateBox>
      ) : (
        <>
          <WatchlistToolbar
            search={search}
            onSearchChange={setSearch}
            houses={availableHouses}
            activeHouse={houseFilter}
            onHouseChange={setHouseFilter}
          />
          <Stack>
            {groups.length === 0
              ? <StateBox><span className="material-symbols-outlined">search_off</span>No lots match your filters.</StateBox>
              : groups.map(g => (
                <AuctionGroup
                  key={g.key}
                  group={g}
                  now={now}
                  onRemove={removeLot}
                  onManualPrice={setManualPrice}
                  onTogglePriority={handleTogglePriority}
                />
              ))}
          </Stack>
        </>
      )}
    </>
  )
}
