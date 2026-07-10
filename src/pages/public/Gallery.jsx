import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { useItems } from '../../hooks/useItems'
import { ItemCard } from '../../components/public/ItemCard'
import { FilterBar } from '../../components/public/FilterBar'

const PAGE_SIZE_OPTIONS = [16, 32, 64]
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0]

function buildCleanParams({ search, activeTypes, activeTeams, sortBy, page, pageSize }) {
  const params = new URLSearchParams()
  if (search) params.set('q', search)
  if (activeTypes.length > 0) params.set('types', activeTypes.join(','))
  if (activeTeams.length > 0) params.set('teams', activeTeams.join(','))
  if (sortBy) params.set('sort', sortBy)
  if (page !== 1) params.set('page', String(page))
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set('size', String(pageSize))
  return params
}

const Page = styled.div`
  max-width: 1536px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-8) var(--space-12);
`

const Hero = styled.div`
  margin-bottom: var(--space-12);
`

const Heading = styled.h1`
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: clamp(3.5rem, 10vw, 7rem);
  letter-spacing: -0.04em;
  text-transform: uppercase;
  line-height: 1;
  color: var(--color-on-background);
  opacity: 0.9;
  margin-bottom: var(--space-12);
`

const ResultsMeta = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #6b7280;
  margin-top: var(--space-6);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-6);

  @media (min-width: 640px)  { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
  @media (min-width: 1280px) { grid-template-columns: repeat(4, 1fr); }
`

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-16);
  font-family: var(--font-headline);
`

const PageBtn = styled.button`
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-base), color var(--transition-base);

  ${({ $active }) => $active ? `
    background-color: var(--color-primary-container);
    color: var(--color-on-primary-container);
  ` : `
    background-color: var(--color-surface-high);
    color: var(--color-on-background);
    border: 1px solid rgba(255,255,255,0.05);
    &:hover { background-color: var(--color-surface-bright); }
  `}

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`

const NavBtn = styled(PageBtn)`
  width: auto;
  padding: 0 var(--space-4);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
`

const Ellipsis = styled.span`
  color: #4b5563;
  padding: 0 var(--space-1);
`

const StatusText = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #6b7280;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: var(--space-16);
  text-align: center;
`

const ResultsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-6);
`

const PageSizeSelect = styled.select`
  background-color: var(--color-surface-high);
  color: var(--color-on-background);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  padding: 0.375rem 0.5rem;
  cursor: pointer;

  &:hover { background-color: var(--color-surface-bright); }

  option {
    background-color: var(--color-surface);
    color: var(--color-on-background);
  }
`

function gradeToNumber(grade) {
  if (!grade) return -1
  const match = grade.match(/(\d+(?:\.\d+)?)$/)
  return match ? parseFloat(match[1]) : -1
}

function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Derive all filter/sort/page state from URL params
  const search = searchParams.get('q') ?? ''
  const typesParam = searchParams.get('types') ?? ''
  const teamsParam = searchParams.get('teams') ?? ''
  const sortBy = searchParams.get('sort') ?? ''
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(searchParams.get('size')))
    ? Number(searchParams.get('size'))
    : DEFAULT_PAGE_SIZE
  const activeTypes = typesParam ? typesParam.split(',') : []
  const activeTeams = teamsParam ? teamsParam.split(',') : []

  const { items, loading, error } = useItems()

  const availableTypes = useMemo(() => {
    const seen = new Set(items.map(item => item.item_type).filter(Boolean))
    return [...seen].sort()
  }, [items])

  const availableTeams = useMemo(() => {
    const seen = new Set(items.flatMap(item => item.team_slugs ?? []))
    const sorted = [...seen].sort()
    return ['yankees', ...sorted.filter(t => t !== 'yankees')]
  }, [items])

  // Use primitive param strings as deps so the memo doesn't recompute on every render
  // due to activeTypes/activeTeams being new array instances each time
  const filtered = useMemo(() => items.filter(item => {
    const matchesType = activeTypes.length === 0 || activeTypes.includes(item.item_type)
    const matchesTeam = activeTeams.length === 0 || (item.team_slugs ?? []).some(s => activeTeams.includes(s))
    const matchesSearch = !search.trim() || item.title.toLowerCase().includes(search.trim().toLowerCase())
    return matchesType && matchesTeam && matchesSearch
  }), [items, typesParam, teamsParam, search]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const totalPages = Math.ceil(displayed.length / pageSize)
  const paginated = displayed.slice((page - 1) * pageSize, page * pageSize)
  const pages = buildPages(page, totalPages)

  // Scroll to top when page changes
  useEffect(() => { window.scrollTo(0, 0) }, [page])

  // Filter/sort handlers — reset page to 1 and use replace so history stays clean
  function handleSearchChange(val) {
    setSearchParams(buildCleanParams({ search: val, activeTypes, activeTeams, sortBy, page: 1, pageSize }), { replace: true })
  }

  function handleTypeToggle(type) {
    const next = activeTypes.includes(type) ? activeTypes.filter(t => t !== type) : [...activeTypes, type]
    setSearchParams(buildCleanParams({ search, activeTypes: next, activeTeams, sortBy, page: 1, pageSize }), { replace: true })
  }

  function handleTeamToggle(team) {
    const next = activeTeams.includes(team) ? activeTeams.filter(t => t !== team) : [...activeTeams, team]
    setSearchParams(buildCleanParams({ search, activeTypes, activeTeams: next, sortBy, page: 1, pageSize }), { replace: true })
  }

  function handleSortChange(val) {
    setSearchParams(buildCleanParams({ search, activeTypes, activeTeams, sortBy: val, page: 1, pageSize }), { replace: true })
  }

  function handlePageSizeChange(val) {
    setSearchParams(buildCleanParams({ search, activeTypes, activeTeams, sortBy, page: 1, pageSize: val }), { replace: true })
  }

  // Page changes push to history so back/forward navigate between pages
  function handlePageChange(newPage) {
    setSearchParams(buildCleanParams({ search, activeTypes, activeTeams, sortBy, page: newPage, pageSize }))
  }

  return (
    <Page>
      <Hero>
        <Heading>The Archive</Heading>
        <FilterBar
          availableTypes={availableTypes}
          activeTypes={activeTypes}
          onTypeToggle={handleTypeToggle}
          onTypeClear={() => setSearchParams(buildCleanParams({ search, activeTypes: [], activeTeams, sortBy, page: 1, pageSize }), { replace: true })}
          availableTeams={availableTeams}
          activeTeams={activeTeams}
          onTeamToggle={handleTeamToggle}
          onTeamClear={() => setSearchParams(buildCleanParams({ search, activeTypes, activeTeams: [], sortBy, page: 1, pageSize }), { replace: true })}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          search={search}
          onSearchChange={handleSearchChange}
        />
      </Hero>

      {error && <StatusText>Error loading collection: {error}</StatusText>}

      {!error && (
        <>
          {!loading && (
            <ResultsBar>
              <ResultsMeta>
                {displayed.length} {displayed.length === 1 ? 'item' : 'items'}
                {totalPages > 1 && ` — page ${page} of ${totalPages}`}
              </ResultsMeta>
              <PageSizeSelect
                value={pageSize}
                onChange={e => handlePageSizeChange(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n} per page</option>
                ))}
              </PageSizeSelect>
            </ResultsBar>
          )}

          <Grid>
            {paginated.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </Grid>

          {!loading && filtered.length === 0 && (
            <StatusText>No items found.</StatusText>
          )}

          {loading && <StatusText>Loading...</StatusText>}

          {totalPages > 1 && (
            <Pagination>
              <NavBtn onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                Previous
              </NavBtn>

              {pages.map((p, i) =>
                p === '...' ? (
                  <Ellipsis key={`ellipsis-${i}`}>...</Ellipsis>
                ) : (
                  <PageBtn key={p} $active={p === page} onClick={() => handlePageChange(p)}>
                    {p}
                  </PageBtn>
                )
              )}

              <NavBtn onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                Next
              </NavBtn>
            </Pagination>
          )}
        </>
      )}
    </Page>
  )
}
