import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'

// ─── Heading ──────────────────────────────────────────────────────────────────

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

// ─── Inventory table ──────────────────────────────────────────────────────────

const TableSection = styled.section`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  overflow: hidden;
`

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-6) var(--space-8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`

const TableTitle = styled.h2`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-on-surface);
`

const ViewAllLink = styled(Link)`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-primary);
  transition: opacity var(--transition-base);
  &:hover { opacity: 0.7; }
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

const TagPill = styled.span`
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

const CertId = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: rgba(173, 198, 255, 0.8);
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
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [costRes, itemsRes] = await Promise.all([
        supabase.from('items').select('id, acquisition_cost'),
        supabase.from('item_cards').select().order('created_at', { ascending: false }).limit(10),
      ])

      if (cancelled) return

      if (!costRes.error && costRes.data) {
        const count = costRes.data.length
        const totalCost = costRes.data.reduce((sum, i) => sum + (i.acquisition_cost ?? 0), 0)
        setStats({ count, totalCost })
      }

      if (!itemsRes.error) setItems(itemsRes.data ?? [])
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

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
          {loading
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
          <StatValue>{loading ? '—' : stats.count.toLocaleString()}</StatValue>
          {!loading && (
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
          <StatValue $accent="blue">{loading ? '—' : formatCost(stats.totalCost)}</StatValue>
          {!loading && (
            <StatSub>
              <span className="material-symbols-outlined">receipt_long</span>
              Acquisition cost basis
            </StatSub>
          )}
        </StatCard>
      </StatsGrid>

      <TableSection>
        <TableHeader>
          <TableTitle>Active Inventory Feed</TableTitle>
          <ViewAllLink to="/admin/items">View all →</ViewAllLink>
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
            {loading ? (
              <StatusRow><td colSpan={5}>Loading...</td></StatusRow>
            ) : items.length === 0 ? (
              <StatusRow><td colSpan={5}>No items found.</td></StatusRow>
            ) : items.map(item => (
              <Tr key={item.id}>
                <Td>
                  <AssetCell>
                    <Thumb>
                      {item.primary_image_url
                        ? <img src={item.primary_image_url} alt={item.title} />
                        : <span className="material-symbols-outlined">image</span>}
                    </Thumb>
                    <AssetName>{item.title}</AssetName>
                  </AssetCell>
                </Td>
                <Td>
                  {item.tag_slugs?.[0]
                    ? <TagPill>{item.tag_slugs[0].replace(/-/g, ' ')}</TagPill>
                    : <Muted>—</Muted>}
                </Td>
                <Td>
                  {item.cert_grade
                    ? <GradeBadge>{item.cert_service ? `${item.cert_service} ` : ''}{item.cert_grade}</GradeBadge>
                    : <Muted>—</Muted>}
                </Td>
                <Td>
                  {item.cert_id ? <CertId>#{item.cert_id}</CertId> : <Muted>—</Muted>}
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
      </TableSection>
    </>
  )
}
