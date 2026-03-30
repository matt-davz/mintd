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

const SearchInput = styled.input`
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-md);
  color: var(--color-on-surface);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  padding: var(--space-2) var(--space-3);
  width: 14rem;
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
  font-size: 0.5625rem;
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
  background-color: var(--color-secondary-container);
  color: var(--color-secondary-fixed);
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

const ActionBtn = styled(Link)`
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
  const [activeTag, setActiveTag] = useState(null)
  const [search, setSearch] = useState('')

  const { items, loading: itemsLoading } = useItems()
  const { tags } = useTags()

  const itemTypeTags = tags.filter(t => t.category === 'item_type')

  useEffect(() => {
    let cancelled = false
    supabase.from('items').select('id, price').then(({ data, error }) => {
      if (cancelled) return
      console.log('stats query:', { data, error })
      if (!error && data) {
        setStats({
          count: data.length,
          totalCost: data.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0),
        })
      }
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
    return `$${n.toLocaleString()}`
  }

  return (
    <>
      <PageHeading>
        <PageTitle>Collection Management</PageTitle>
        <PageSub>
          {statsLoading
            ? 'Loading collection...'
            : null }
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

      <TableSection>
        <TableHeader>
          <TableTitle>Active Inventory</TableTitle>
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
            ) : filtered.length === 0 ? (
              <StatusRow><td colSpan={5}>No items found.</td></StatusRow>
            ) : filtered.map(item => (
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
                    ? <GradeBadge>{item.cert_service ? `${item.cert_service} ` : ''}{item.cert_grade}</GradeBadge>
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
                  <ActionBtn to={`/admin/items/${item.id}`}>
                    <span className="material-symbols-outlined">edit</span>
                  </ActionBtn>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        {!itemsLoading && (
          <TableFooter>
            <FooterMeta>
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
              {filtered.length !== items.length && ` (filtered from ${items.length})`}
            </FooterMeta>
          </TableFooter>
        )}
      </TableSection>
    </>
  )
}
