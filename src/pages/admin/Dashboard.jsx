import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'
import { useItems } from '../../hooks/useItems'
import { ItemViewerModal } from '../../components/admin/ItemViewerModal'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { gradeColors, gradeToNumber, gradeBucket } from '../../utils/gradeColors'

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

const YANKEES_WS_GAMES = {
  1921: 8, 1922: 5, 1923: 6, 1926: 7, 1927: 4, 1928: 4, 1932: 4,
  1936: 6, 1937: 5, 1938: 4, 1939: 4, 1941: 5, 1942: 5, 1943: 5,
  1947: 7, 1949: 5, 1950: 4, 1951: 6, 1952: 7, 1953: 6, 1955: 7,
  1956: 7, 1957: 7, 1958: 7, 1960: 7, 1961: 5, 1962: 7, 1963: 4,
  1964: 7, 1976: 4, 1977: 6, 1978: 6, 1981: 6, 1996: 6, 1998: 4,
  1999: 4, 2000: 5, 2001: 7, 2003: 6, 2009: 6, 2024: 5,
}

const WsProgressCard = styled.div`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  padding: var(--space-6) var(--space-8);
  margin-bottom: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`

const WsTier = styled.div`
  display: flex;
  flex-direction: column;
`

const WsTierHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-3);
`

const WsProgressLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.4);
  font-weight: 700;
`

const WsTierLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.28);
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

// Tier 3 (top) — overall progress bar
const WsOverallTrack = styled.div`
  width: 100%;
  height: 6px;
  background-color: rgba(140, 144, 159, 0.12);
  border-radius: var(--radius-pill);
  overflow: hidden;
`

const WsOverallFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, var(--color-primary), rgba(173, 198, 255, 0.55));
  border-radius: var(--radius-pill);
  transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
`

// Tier 2 (middle) — one proportional bar per series year
const WsYearBarsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(22px, 1fr));
  gap: 4px;
`

const WsYearBarCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: default;
`

const WsYearBarTrack = styled.div`
  width: 100%;
  height: 32px;
  background-color: rgba(140, 144, 159, 0.12);
  border-radius: 2px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
`

const WsYearBarFill = styled.div`
  width: 100%;
  height: ${({ $pct }) => $pct}%;
  background: linear-gradient(180deg, rgba(173, 198, 255, 0.55), var(--color-primary));
  transition: height 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
`

const WsYearBarLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.4375rem;
  color: rgba(229, 226, 225, 0.35);
  white-space: nowrap;
`

// Tier 1 (bottom) — individual game slots, grouped by series year
const WsGameSlotsScroll = styled.div`
  overflow-x: auto;
  padding-bottom: var(--space-2);

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(140, 144, 159, 0.2); border-radius: 2px; }
`

const WsGameSlotsRow = styled.div`
  display: flex;
  gap: var(--space-4);
  min-width: min-content;
`

const WsYearGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`

const WsYearGroupLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5rem;
  letter-spacing: 0.05em;
  color: rgba(229, 226, 225, 0.35);
`

const WsGameSlotsGrid = styled.div`
  display: flex;
  gap: 2px;
`

const WsGameSlot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background-color: ${({ $owned }) => $owned ? 'var(--color-primary)' : 'rgba(140, 144, 159, 0.15)'};
  box-shadow: ${({ $owned }) => $owned ? '0 0 4px rgba(173, 198, 255, 0.5)' : 'none'};
  cursor: default;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState({ count: 0, totalCost: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [wsOwnedGames, setWsOwnedGames] = useState(null)
  const [activeTypes, setActiveTypes] = useState([])
  const [activeTeams, setActiveTeams] = useState([])
  const [activeCertServices, setActiveCertServices] = useState([])
  const [activeGrades, setActiveGrades] = useState([])
  const [showDupesOnly, setShowDupesOnly] = useState(false)
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

  const availableCertServices = useMemo(() => {
    const seen = new Set(items.map(item => item.cert_service).filter(Boolean))
    return [...seen].sort()
  }, [items])

  const availableGrades = useMemo(() => {
    const seen = new Set(items.filter(item => item.cert_grade).map(item => gradeBucket(item.cert_grade)))
    const numeric = [...seen].filter(g => g !== 'authentic').sort((a, b) => parseFloat(a) - parseFloat(b))
    return seen.has('authentic') ? [...numeric, 'authentic'] : numeric
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

  function handleCertServiceToggle(cs) {
    setActiveCertServices(prev =>
      prev.includes(cs) ? prev.filter(c => c !== cs) : [...prev, cs]
    )
  }

  function handleGradeToggle(grade) {
    setActiveGrades(prev =>
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
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
        .select('item_id, game_context!inner(season_year, game_type, series_game_number)')
        .eq('game_context.game_type', 'world_series')

      if (cancelled) return
      if (wsError || !wsTickets) { setWsOwnedGames(new Map()); return }

      const wsItemIds = wsTickets.map(t => t.item_id)
      if (wsItemIds.length === 0) { setWsOwnedGames(new Map()); return }

      const { data: yankeeItems } = await supabase
        .from('item_teams')
        .select('item_id, teams!inner(slug)')
        .in('item_id', wsItemIds)
        .eq('teams.slug', 'yankees')

      if (cancelled) return

      const yankeeSet = new Set((yankeeItems ?? []).map(t => t.item_id))
      const owned = new Map()
      wsTickets
        .filter(t => yankeeSet.has(t.item_id) && t.game_context?.season_year && t.game_context?.series_game_number != null)
        .forEach(t => {
          const { season_year: year, series_game_number: game } = t.game_context
          if (!owned.has(year)) owned.set(year, new Set())
          owned.get(year).add(game)
        })
      setWsOwnedGames(owned)
    }

    fetchWsProgress()

    return () => { cancelled = true }
  }, [])

  const wsYearStats = useMemo(() => {
    if (!wsOwnedGames) return []
    return Object.entries(YANKEES_WS_GAMES).map(([yearStr, totalGames]) => {
      const year = Number(yearStr)
      const ownedSet = wsOwnedGames.get(year) ?? new Set()
      return { year, totalGames, ownedCount: ownedSet.size, ownedSet }
    })
  }, [wsOwnedGames])

  const wsTotals = useMemo(() => {
    const totalGames = wsYearStats.reduce((sum, y) => sum + y.totalGames, 0)
    const ownedGames = wsYearStats.reduce((sum, y) => sum + y.ownedCount, 0)
    return { totalGames, ownedGames }
  }, [wsYearStats])

  const filtered = useMemo(() => items.filter(item => {
    const matchesType = activeTypes.length === 0 || activeTypes.includes(item.item_type)
    const matchesTeam = activeTeams.length === 0 || (item.team_slugs ?? []).some(s => activeTeams.includes(s))
    const matchesCertService = activeCertServices.length === 0 || (item.cert_service && activeCertServices.includes(item.cert_service))
    const matchesGrade = activeGrades.length === 0 || activeGrades.includes(gradeBucket(item.cert_grade))
    const matchesDupes = !showDupesOnly || item.is_duplicate === true
    const matchesSearch = !search.trim() || item.title.toLowerCase().includes(search.trim().toLowerCase())
    return matchesType && matchesTeam && matchesCertService && matchesGrade && matchesDupes && matchesSearch
  }), [items, activeTypes, activeTeams, activeCertServices, activeGrades, showDupesOnly, search])

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

      {wsOwnedGames !== null && (
        <WsProgressCard>
          {/* Tier 3 (top) — overall progress */}
          <WsTier>
            <WsTierHeader>
              <WsProgressLabel>Yankees WS Ticket Quest</WsProgressLabel>
              <div>
                <WsProgressCount>
                  {wsTotals.ownedGames} / {wsTotals.totalGames} games
                </WsProgressCount>
                <WsProgressPct>
                  {Math.round((wsTotals.ownedGames / wsTotals.totalGames) * 100)}%
                </WsProgressPct>
              </div>
            </WsTierHeader>
            <WsOverallTrack>
              <WsOverallFill $pct={(wsTotals.ownedGames / wsTotals.totalGames) * 100} />
            </WsOverallTrack>
          </WsTier>

          {/* Tier 2 (middle) — proportional bar per series year */}
          <WsTier>
            <WsTierLabel>By Series</WsTierLabel>
            <WsYearBarsGrid>
              {wsYearStats.map(({ year, totalGames, ownedCount }) => (
                <WsYearBarCol
                  key={year}
                  title={`${year} WS — ${ownedCount}/${totalGames} games (${Math.round((ownedCount / totalGames) * 100)}%)`}
                >
                  <WsYearBarTrack>
                    <WsYearBarFill $pct={(ownedCount / totalGames) * 100} />
                  </WsYearBarTrack>
                  <WsYearBarLabel>{String(year).slice(2)}</WsYearBarLabel>
                </WsYearBarCol>
              ))}
            </WsYearBarsGrid>
          </WsTier>

          {/* Tier 1 (bottom) — individual game slots grouped by year */}
          <WsTier>
            <WsTierLabel>By Game</WsTierLabel>
            <WsGameSlotsScroll>
              <WsGameSlotsRow>
                {wsYearStats.map(({ year, totalGames, ownedSet }) => (
                  <WsYearGroup key={year}>
                    <WsGameSlotsGrid>
                      {Array.from({ length: totalGames }, (_, i) => i + 1).map(gameNum => (
                        <WsGameSlot
                          key={gameNum}
                          $owned={ownedSet.has(gameNum)}
                          title={`${year} WS Game ${gameNum} ${ownedSet.has(gameNum) ? '✓' : '✗'}`}
                        />
                      ))}
                    </WsGameSlotsGrid>
                    <WsYearGroupLabel>{year}</WsYearGroupLabel>
                  </WsYearGroup>
                ))}
              </WsGameSlotsRow>
            </WsGameSlotsScroll>
          </WsTier>
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
        availableCertServices={availableCertServices}
        activeCertServices={activeCertServices}
        onCertServiceToggle={handleCertServiceToggle}
        onCertServiceClear={() => setActiveCertServices([])}
        availableGrades={availableGrades}
        activeGrades={activeGrades}
        onGradeToggle={handleGradeToggle}
        onGradeClear={() => setActiveGrades([])}
        showDupesOnly={showDupesOnly}
        onDupesToggle={() => setShowDupesOnly(v => !v)}
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
                    <AssetName as={Link} to={`/item/${item.id}`} style={{ textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer' }}>
                      {item.title}
                    </AssetName>
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
                  {item.reference_link ? (
                    <ActionBtn as="a" href={item.reference_link} target="_blank" rel="noreferrer">
                      <span className="material-symbols-outlined">open_in_new</span>
                    </ActionBtn>
                  ) : (
                    <ActionBtn as="a" aria-disabled="true" style={{ opacity: 0.4, pointerEvents: 'none' }}>
                      <span className="material-symbols-outlined">open_in_new</span>
                    </ActionBtn>
                  )}
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
