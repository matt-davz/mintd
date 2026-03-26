import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useItems } from '../../hooks/useItems'
import { ItemCard } from '../../components/public/ItemCard'
import { FilterBar } from '../../components/public/FilterBar'

const PAGE_SIZE = 16

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

function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function Gallery() {
  const [activeTag, setActiveTag] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { items, loading, error } = useItems()

  const filtered = items.filter(item => {
    const matchesTag = !activeTag || (item.tag_slugs ?? []).includes(activeTag)
    const matchesSearch = !search.trim() || item.title.toLowerCase().includes(search.trim().toLowerCase())
    return matchesTag && matchesSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pages = buildPages(page, totalPages)

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [activeTag, search])

  return (
    <Page>
      <Hero>
        <Heading>The Archive</Heading>
        <FilterBar
          activeTag={activeTag}
          onTagChange={setActiveTag}
          search={search}
          onSearchChange={setSearch}
        />
      </Hero>

      {error && <StatusText>Error loading collection: {error}</StatusText>}

      {!error && (
        <>
          {!loading && (
            <ResultsMeta>
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
              {totalPages > 1 && ` — page ${page} of ${totalPages}`}
            </ResultsMeta>
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
              <NavBtn onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                Previous
              </NavBtn>

              {pages.map((p, i) =>
                p === '...' ? (
                  <Ellipsis key={`ellipsis-${i}`}>...</Ellipsis>
                ) : (
                  <PageBtn key={p} $active={p === page} onClick={() => setPage(p)}>
                    {p}
                  </PageBtn>
                )
              )}

              <NavBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                Next
              </NavBtn>
            </Pagination>
          )}
        </>
      )}
    </Page>
  )
}
