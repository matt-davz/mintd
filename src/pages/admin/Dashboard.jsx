import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'
import { useItems } from '../../hooks/useItems'
import { ItemViewerModal } from '../../components/admin/ItemViewerModal'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'

// ─── Page heading ─────────────────────────────────────────────────────────────

const PageHeading = styled.div`
  margin-bottom: var(--space-12);
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
  letter-spacing: 0.03em;
`

// ─── Yankees WS progress ──────────────────────────────────────────────────────

const YANKEES_WS_YEARS = [
  1921, 1922, 1923, 1927, 1928, 1932, 1936, 1937, 1938, 1939,
  1941, 1942, 1943, 1947, 1949, 1950, 1951, 1952, 1953, 1955,
  1956, 1957, 1958, 1960, 1961, 1962, 1963, 1964, 1976, 1977,
  1978, 1981, 1996, 1998, 1999, 2000, 2001, 2003, 2009, 2024,
]

const WsProgressCard = styled.div`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  padding: var(--space-6) var(--space-8);
  margin-bottom: var(--space-6);
`

const WsProgressTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-5);
`

const WsProgressLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.4);
  font-weight: 700;
`

const WsProgressCount = styled.span`
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--color-on-surface);
`

const WsProgressPct = styled.span`
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--color-primary);
  margin-left: var(--space-3);
`

const WsBarTrack = styled.div`
  width: 100%;
  height: 5px;
  background-color: rgba(140, 144, 159, 0.12);
  border-radius: var(--radius-pill);
  overflow: hidden;
  margin-bottom: var(--space-4);
`

const WsBarFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, var(--color-primary), rgba(173, 198, 255, 0.55));
  border-radius: var(--radius-pill);
  transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
`

const WsSegmentRow = styled.div`
  display: flex;
  gap: 2px;
`

const WsSegment = styled.div`
  flex: 1;
  height: 3px;
  border-radius: 1px;
  background-color: ${({ $owned }) => $owned ? 'var(--color-primary)' : 'rgba(140, 144, 159, 0.18)'};
  position: relative;
  cursor: default;

  &::after {
    content: attr(data-year);
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-mono);
    font-size: 0.5rem;
    color: var(--color-on-surface);
    white-space: nowrap;
    background: var(--color-surface-high);
    padding: 1px 3px;
    border-radius: 2px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.1s;
  }

  &:hover::after { opacity: 1; }
`

// ─── Stat cards ───────────────────────────────────────────────────────────────

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-12);

  @media (min-width: 768px) { grid-template-columns: repeat(2, 1fr); }
`

const StatCard = styled.div`
  position: relative;
  overflow: hidden;
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  padding: var(--space-6);

  .card-icon {
    position: absolute;
    right: -1rem;
    bottom: -1rem;
    opacity: 0.03;
    transition: opacity var(--transition-base);
    pointer-events: none;
    .material-symbols-outlined { font-size: 6rem; }
  }

  &:hover .card-icon { opacity: 0.08; }
`

const StatLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.4);
  font-weight: 700;
  margin-bottom: var(--space-4);
`

const StatValue = styled.h3`
  font-family: var(--font-mono);
  font-size: 1.875rem;
  font-weight: 500;
  color: ${({ $accent }) => $accent === 'blue' ? 'var(--color-primary)' : 'var(--color-on-surface)'};
`

const StatSub = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-4);
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--color-outline);

  .material-symbols-outlined { font-size: 1rem; }
`

// ─── Table section ────────────────────────────────────────────────────────────

const TableSection = styled.section`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  overflow: hidden;
`

const TableHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`

const TableTitle = styled.h2`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-on-surface);
  margin-right: auto;
`


const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  padding: var(--space-4) var(--space-8);
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.3);
  text-align: ${({ $right }) => $right ? 'right' : 'left'};
  background-color: rgba(255, 255, 255, 0.02);
`

const Tr = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color var(--transition-base);

  &:last-child { border-bottom: none; }
  &:hover { background-color: rgba(255, 255, 255, 0.02); }
`

const Td = styled.td`
  padding: var(--space-5) var(--space-8);
  text-align: ${({ $right }) => $right ? 'right' : 'left'};
`

const AssetCell = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4);
`

const Thumb = styled.div`
  width: 3rem;
  height: 4rem;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.15);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(20%);
    transition: filter var(--transition-base);
  }

  ${Tr}:hover & img { filter: grayscale(0%); }

  .material-symbols-outlined {
    font-size: 1.25rem;
    color: var(--color-surface-bright);
  }
`

const AssetName = styled.div`
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-on-surface);
`

const CategoryPill = styled.span`
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  background-color: var(--color-surface-high);
  color: rgba(229, 226, 225, 0.6);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border-radius: var(--radius-sm);
`

const GradeBadge = styled.span`
  display: inline-block;
  background-color: ${p => p.$bg ?? 'var(--color-secondary-container)'};
  color: ${p => p.$fg ?? 'var(--color-secondary-fixed)'};
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
`

const CertIdWrap = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`

const CertId = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: rgba(173, 198, 255, 0.8);
`

const CertLink = styled.a`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: opacity var(--transition-base);
  &:hover { opacity: 0.7; }
`

const CopyBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-outline);
  transition: color var(--transition-base);
  flex-shrink: 0;

  .material-symbols-outlined { font-size: 0.875rem; }
  &:hover { color: var(--color-primary); }
`

const Muted = styled.span`
  color: var(--color-outline);
  font-size: 0.75rem;
`

const ActionBtn = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-high);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(229, 226, 225, 0.4);
  transition: color var(--transition-base);

  .material-symbols-outlined { font-size: 1rem; }
  &:hover { color: var(--color-primary); }
`

const TableFooter = styled.div`
  padding: var(--space-4) var(--space-8);
  background-color: rgba(255, 255, 255, 0.01);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`

const FooterMeta = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.3);
`

const StatusRow = styled.tr`
  td {
    padding: var(--space-8);
    text-align: center;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-outline);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`

function gradeToNumber(grade) {
  if (!grade) return -1
  const match = grade.match(/(\d+(?:\.\d+)?)$/)
  return match ? parseFloat(match[1]) : -1
}

function gradeColors(grade) {
  const n = gradeToNumber(grade)
  if (n >= 1 && n <= 4) return { $bg: 'rgba(220, 60, 60, 0.25)',  $fg: '#ff8a8a' }
  if (n >= 5 && n <= 7) return { $bg: 'rgba(200, 140, 30, 0.25)', $fg: '#f5c060' }
  if (n > 7)            return { $bg: 'rgba(40, 160, 80, 0.25)',  $fg: '#6ee09a' }
  return {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState({ count: 0, totalCost: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [wsOwnedYears, setWsOwnedYears] = useState(null)
  const [activeTypes, setActiveTypes] = useState([])
  const [activeTeams, setActiveTeams] = useState([])
  const [sortBy, setSortBy] = useState('')
  const [search, setSearch] = useState('')
  const [selectedItemId, setSelectedItemId] = useState(null)

  const { items, loading: itemsLoading } = useItems()

  const availableTypes = useMemo(() => {
    const seen = new Set(items.map(item => item.item_type).filter(Boolean))
    return [...seen].sort()
  }, [items])

  const availableTeams = useMemo(() => {
    const seen = new Set(items.flatMap(item => item.team_slugs ?? []))
    const sorted = [...seen].sort()
    return ['yankees', ...sorted.filter(t => t !== 'yankees')]
  }, [items])

  function handleTypeToggle(type) {
    setActiveTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function handleTeamToggle(team) {
    setActiveTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    )
  }

  useEffect(() => {
    let cancelled = false

    supabase.from('items').select('id, price').then(({ data, error }) => {
      if (cancelled) return
      if (!error && data) {
        setStats({
          count: data.length,
          totalCost: data.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0),
        })
      }
      setStatsLoading(false)
    })

    async function fetchWsProgress() {
      const { data: wsTickets, error: wsError } = await supabase
        .from('item_tickets')
        .select('item_id, game_context!inner(season_year, game_type)')
        .eq('game_context.game_type', 'world_series')

      if (cancelled) return
      if (wsError || !wsTickets) { setWsOwnedYears(new Set()); return }

      const wsItemIds = wsTickets.map(t => t.item_id)
      if (wsItemIds.length === 0) { setWsOwnedYears(new Set()); return }

      const { data: yankeeItems } = await supabase
        .from('item_teams')
        .select('item_id, teams!inner(slug)')
        .in('item_id', wsItemIds)
        .eq('teams.slug', 'yankees')

      if (cancelled) return

      const yankeeSet = new Set((yankeeItems ?? []).map(t => t.item_id))
      const owned = new Set(
        wsTickets
          .filter(t => yankeeSet.has(t.item_id) && t.game_context?.season_year)
          .map(t => t.game_context.season_year)
      )
      setWsOwnedYears(owned)
    }

    fetchWsProgress()

    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => items.filter(item => {
    const matchesType = activeTypes.length === 0 || activeTypes.includes(item.item_type)
    const matchesTeam = activeTeams.length === 0 || (item.team_slugs ?? []).some(s => activeTeams.includes(s))
    const matchesSearch = !search.trim() || item.title.toLowerCase().includes(search.trim().toLowerCase())
    return matchesType && matchesTeam && matchesSearch
  }), [items, activeTypes, activeTeams, search])

  const displayed = useMemo(() => {
    if (!sortBy) return filtered
    return [...filtered].sort((a, b) => {
      if (sortBy === 'year_desc') return (b.season_year ?? 0) - (a.season_year ?? 0)
      if (sortBy === 'year_asc')  return (a.season_year ?? 0) - (b.season_year ?? 0)
      if (sortBy === 'grade_desc') return gradeToNumber(b.cert_grade) - gradeToNumber(a.cert_grade)
      if (sortBy === 'grade_asc')  return gradeToNumber(a.cert_grade) - gradeToNumber(b.cert_grade)
      return 0
    })
  }, [filtered, sortBy])

  function formatCost(n) {
    return `$${n.toLocaleString()}`
  }

  return (
    <>
      {selectedItemId && (
        <ItemViewerModal
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
          onOpenItem={setSelectedItemId}
        />
      )}

      <PageHeading>
        <PageTitle>Collection Management</PageTitle>
        <PageSub>
          {statsLoading
            ? 'Loading collection...'
            : null }
        </PageSub>
      </PageHeading>

      {wsOwnedYears !== null && (
        <WsProgressCard>
          <WsProgressTop>
            <WsProgressLabel>Yankees WS Ticket Quest</WsProgressLabel>
            <div>
              <WsProgressCount>
                {wsOwnedYears.size} / {YANKEES_WS_YEARS.length}
              </WsProgressCount>
              <WsProgressPct>
                {Math.round((wsOwnedYears.size / YANKEES_WS_YEARS.length) * 100)}%
              </WsProgressPct>
            </div>
          </WsProgressTop>
          <WsBarTrack>
            <WsBarFill $pct={(wsOwnedYears.size / YANKEES_WS_YEARS.length) * 100} />
          </WsBarTrack>
          <WsSegmentRow>
            {YANKEES_WS_YEARS.map(year => (
              <WsSegment
                key={year}
                $owned={wsOwnedYears.has(year)}
                data-year={year}
                title={year}
              />
            ))}
          </WsSegmentRow>
        </WsProgressCard>
      )}

      <StatsGrid>
        <StatCard>
          <div className="card-icon">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <StatLabel>Total Assets</StatLabel>
          <StatValue>{statsLoading ? '—' : stats.count.toLocaleString()}</StatValue>
          {!statsLoading && (
            <StatSub>
              <span className="material-symbols-outlined">check_circle</span>
              All items in archive
            </StatSub>
          )}
        </StatCard>

        <StatCard>
          <div className="card-icon">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <StatLabel>Total Cost</StatLabel>
          <StatValue $accent="blue">{statsLoading ? '—' : formatCost(stats.totalCost)}</StatValue>
          {!statsLoading && (
            <StatSub>
              <span className="material-symbols-outlined">receipt_long</span>
              Acquisition cost basis
            </StatSub>
          )}
        </StatCard>
      </StatsGrid>

      <AdminFilterBar
        availableTypes={availableTypes}
        activeTypes={activeTypes}
        onTypeToggle={handleTypeToggle}
        onTypeClear={() => setActiveTypes([])}
        availableTeams={availableTeams}
        activeTeams={activeTeams}
        onTeamToggle={handleTeamToggle}
        onTeamClear={() => setActiveTeams([])}
        sortBy={sortBy}
        onSortChange={setSortBy}
        search={search}
        onSearchChange={setSearch}
      />

      <TableSection>
        <TableHeader>
          <TableTitle>Active Inventory</TableTitle>
        </TableHeader>

        <Table>
          <thead>
            <tr>
              <Th>Asset</Th>
              <Th>Category</Th>
              <Th>Grade</Th>
              <Th>Certification ID</Th>
              <Th $right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {itemsLoading ? (
              <StatusRow><td colSpan={5}>Loading...</td></StatusRow>
            ) : displayed.length === 0 ? (
              <StatusRow><td colSpan={5}>No items found.</td></StatusRow>
            ) : displayed.map(item => (
              <Tr key={item.id}>
                <Td>
                  <AssetCell>
                    <Thumb>
                      {item.primary_image_url
                        ? <img src={item.primary_image_url} alt={item.title} />
                        : <span className="material-symbols-outlined">image</span>}
                    </Thumb>
                    {item.reference_link ? (
                      <AssetName as="a" href={item.reference_link} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer' }}>
                        {item.title}
                      </AssetName>
                    ) : (
                      <AssetName>{item.title}</AssetName>
                    )}
                  </AssetCell>
                </Td>
                <Td>
                  {item.tag_slugs?.[0]
                    ? <CategoryPill>{item.tag_slugs[0].replace(/-/g, ' ')}</CategoryPill>
                    : <Muted>—</Muted>}
                </Td>
                <Td>
                  {item.cert_grade
                    ? <GradeBadge {...gradeColors(item.cert_grade)}>{item.cert_service ? `${item.cert_service} ` : ''}{item.cert_grade}</GradeBadge>
                    : <Muted>—</Muted>}
                </Td>
                <Td>
                  {item.cert_id ? (
                    <CertIdWrap>
                      {['PSA', 'PSA/DNA'].includes(item.cert_service) ? (
                        <CertLink
                          href={`https://www.psacard.com/cert/${item.cert_id}/psa`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          #{item.cert_id}
                        </CertLink>
                      ) : (
                        <CertId>#{item.cert_id}</CertId>
                      )}
                      <CopyBtn
                        title="Copy cert ID"
                        onClick={() => navigator.clipboard.writeText(item.cert_id)}
                      >
                        <span className="material-symbols-outlined">content_copy</span>
                      </CopyBtn>
                    </CertIdWrap>
                  ) : <Muted>—</Muted>}
                </Td>
                <Td $right>
                  <ActionBtn onClick={() => setSelectedItemId(item.id)}>
                    <span className="material-symbols-outlined">open_in_new</span>
                  </ActionBtn>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        {!itemsLoading && (
          <TableFooter>
            <FooterMeta>
              {displayed.length} {displayed.length === 1 ? 'item' : 'items'}
              {displayed.length !== items.length && ` (filtered from ${items.length})`}
            </FooterMeta>
          </TableFooter>
        )}
      </TableSection>
    </>
  )
}
