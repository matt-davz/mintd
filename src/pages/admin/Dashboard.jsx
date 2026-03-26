import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'
import { useItems } from '../../hooks/useItems'
import { useTags } from '../../hooks/useTags'

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

// ─── Filter bar ───────────────────────────────────────────────────────────────

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
`

const SearchInput = styled.input`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-md);
  color: var(--color-on-surface);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: var(--space-2) var(--space-4);
  width: 16rem;
  transition: border-color var(--transition-base);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.4);
  }
`

const TagPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`

const TagPill = styled.button`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid ${({ $active }) => $active ? 'var(--color-primary)' : 'rgba(140, 144, 159, 0.2)'};
  background-color: ${({ $active }) => $active ? 'rgba(173, 198, 255, 0.1)' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--color-primary)' : 'var(--color-outline)'};
  transition: border-color var(--transition-base), color var(--transition-base), background-color var(--transition-base);

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`

const ResultsMeta = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-4);
`

// ─── Item grid ────────────────────────────────────────────────────────────────

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);

  @media (min-width: 768px)  { grid-template-columns: repeat(3, 1fr); }
  @media (min-width: 1280px) { grid-template-columns: repeat(4, 1fr); }
  @media (min-width: 1536px) { grid-template-columns: repeat(5, 1fr); }
`

const ItemCard = styled(Link)`
  display: block;
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color var(--transition-base), transform var(--transition-base);

  &:hover {
    border-color: rgba(173, 198, 255, 0.25);
    transform: translateY(-2px);
  }
`

const CardImage = styled.div`
  aspect-ratio: 4/5;
  background-color: var(--color-surface-high);
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(20%);
    transition: filter var(--transition-base), transform 400ms ease;
  }

  ${ItemCard}:hover & img {
    filter: grayscale(0%);
    transform: scale(1.03);
  }
`

const NoImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  .material-symbols-outlined {
    font-size: 2rem;
    color: var(--color-surface-bright);
  }
`

const CardBody = styled.div`
  padding: var(--space-3) var(--space-4);
`

const CardTitle = styled.p`
  font-family: var(--font-headline);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-on-surface);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  line-height: 1.3;
  margin-bottom: var(--space-2);

  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
`

const GradeBadge = styled.span`
  background-color: var(--color-secondary-container);
  color: var(--color-secondary-fixed);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-sm);
`

const ForSaleDot = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary);
`

const EmptyState = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-outline);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: var(--space-16) 0;
  text-align: center;
  grid-column: 1 / -1;
`

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState({ count: 0, totalCost: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeTag, setActiveTag] = useState(null)
  const [search, setSearch] = useState('')

  const { items, loading: itemsLoading } = useItems()
  const { tags } = useTags()

  const itemTypeTags = tags.filter(t => t.category === 'item_type')

  useEffect(() => {
    let cancelled = false
    supabase.from('items').select('id, acquisition_cost').then(({ data }) => {
      if (cancelled || !data) return
      setStats({
        count: data.length,
        totalCost: data.reduce((sum, i) => sum + (i.acquisition_cost ?? 0), 0),
      })
      setStatsLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const filtered = items.filter(item => {
    const matchesTag = !activeTag || (item.tag_slugs ?? []).includes(activeTag)
    const matchesSearch = !search.trim() || item.title.toLowerCase().includes(search.trim().toLowerCase())
    return matchesTag && matchesSearch
  })

  function formatCost(n) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
    return `$${n.toLocaleString()}`
  }

  return (
    <>
      <PageHeading>
        <PageTitle>Collection Management</PageTitle>
        <PageSub>
          {statsLoading
            ? 'Loading collection...'
            : `Overseeing ${stats.count.toLocaleString()} high-value historical assets in secure storage.`}
        </PageSub>
      </PageHeading>

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

      <Controls>
        <SearchInput
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <TagPills>
          <TagPill $active={!activeTag} onClick={() => setActiveTag(null)}>All</TagPill>
          {itemTypeTags.map(t => (
            <TagPill key={t.id} $active={activeTag === t.slug} onClick={() => setActiveTag(t.slug)}>
              {t.name}
            </TagPill>
          ))}
        </TagPills>
      </Controls>

      {!itemsLoading && (
        <ResultsMeta>{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</ResultsMeta>
      )}

      <Grid>
        {itemsLoading ? (
          <EmptyState>Loading...</EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState>No items found.</EmptyState>
        ) : filtered.map(item => (
          <ItemCard key={item.id} to={`/admin/items/${item.id}`}>
            <CardImage>
              {item.primary_image_url
                ? <img src={item.primary_image_url} alt={item.title} />
                : <NoImage><span className="material-symbols-outlined">image</span></NoImage>}
            </CardImage>
            <CardBody>
              <CardTitle>{item.title}</CardTitle>
              <CardMeta>
                {item.cert_grade && (
                  <GradeBadge>
                    {item.cert_service ? `${item.cert_service} ` : ''}{item.cert_grade}
                  </GradeBadge>
                )}
                {item.for_sale && <ForSaleDot>For Sale</ForSaleDot>}
              </CardMeta>
            </CardBody>
          </ItemCard>
        ))}
      </Grid>
    </>
  )
}
