import { useState, useMemo } from 'react'
import styled from 'styled-components'
import wantlistData from '../../data/wantlist.json'

// Read-only view of the static want list (src/data/wantlist.json).

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

const Summary = styled.p`
  margin-top: var(--space-3);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-outline);

  strong { color: var(--color-on-surface-variant); font-weight: 700; }
`

// ─── Controls ─────────────────────────────────────────────────────────────────

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
`

const SearchBox = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1 1 18rem;
  max-width: 32rem;
  padding: 0 var(--space-3);
  height: 2.5rem;
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-md);
  color: var(--color-outline);

  .material-symbols-outlined { font-size: 1.125rem; }
  &:focus-within { border-color: rgba(173, 198, 255, 0.4); }
`

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-on-surface);

  &::placeholder { color: var(--color-outline); }
`

const Select = styled.select`
  height: 2.5rem;
  padding: 0 var(--space-3);
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  cursor: pointer;

  &:focus { outline: none; border-color: rgba(173, 198, 255, 0.4); }
`

const ResultsMeta = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-left: auto;
`

// ─── Table ────────────────────────────────────────────────────────────────────

const HEADER_HEIGHT = '2.5rem'
const MUST_ACCENT = 'rgba(214, 112, 96, 0.75)'

const TableWrap = styled.div`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-lg);
  overflow: auto;
  max-height: calc(100vh - 16rem);
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  min-width: 1400px;
`

const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 3;
  height: ${HEADER_HEIGHT};
  padding: 0 var(--space-5);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.35);
  background-color: #202020;
  text-align: left;
`

const GroupHeaderCell = styled.td`
  position: sticky;
  top: ${HEADER_HEIGHT};
  z-index: 2;
  padding: var(--space-3) var(--space-5);
  background-color: var(--color-surface-high);
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-on-surface);
`

const GroupMeta = styled.span`
  margin-left: var(--space-3);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 400;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-outline);
`

const Td = styled.td`
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: ${({ $dim }) => ($dim ? 'var(--color-outline)' : 'var(--color-on-surface-variant)')};
  vertical-align: top;
`

const Tr = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  background-color: ${({ $must }) => ($must ? 'rgba(214, 112, 96, 0.04)' : 'transparent')};
  transition: background-color var(--transition-base);

  & > td:first-child {
    box-shadow: ${({ $must }) => ($must ? `inset 3px 0 0 ${MUST_ACCENT}` : 'none')};
  }

  &:hover {
    background-color: ${({ $must }) => ($must ? 'rgba(214, 112, 96, 0.07)' : 'rgba(255, 255, 255, 0.025)')};
  }
`

const MustBadge = styled.span`
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-sm);
  background-color: rgba(214, 112, 96, 0.12);
  color: #e8a598;
  border: 1px solid rgba(214, 112, 96, 0.3);
`

const TitleLink = styled.a`
  display: block;
  min-width: 22rem;
  max-width: 32rem;
  white-space: normal;
  word-break: break-word;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-on-surface);
  transition: color var(--transition-base);

  &:hover { color: var(--color-primary); }
`

const Muted = styled.span`
  margin-left: var(--space-2);
  color: var(--color-outline);
`

const NotesText = styled.span`
  display: block;
  max-width: 24rem;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StatusRow = styled.tr`
  td {
    padding: var(--space-12);
    text-align: center;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-outline);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLUMNS = ['Importance', 'Title', 'Auction House', 'Auction', 'Closes', 'Cert', 'Grade', 'Auto Grade', 'Current Bid', 'Notes']
const NOTES_MAX = 80
const DASH = '—'

// Parse "YYYY-MM-DD" as a local calendar date (avoid UTC off-by-one).
function parseDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatClose(str) {
  const date = parseDate(str)
  return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : DASH
}

function daysRemaining(str) {
  const date = parseDate(str)
  if (!date) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((date - today) / 86400000)
  if (days < 0) return '(closed)'
  if (days === 0) return '(today)'
  return `(${days} day${days === 1 ? '' : 's'})`
}

function formatBid(bid) {
  if (bid == null || bid === '') return DASH
  const n = Number(bid)
  return Number.isFinite(n) ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : DASH
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

const isMust = lot => lot.importance === 'must_win'

function compareLots(a, b) {
  const byDate = (a.auction_close_date || '9999').localeCompare(b.auction_close_date || '9999')
  if (byDate !== 0) return byDate
  return Number(isMust(b)) - Number(isMust(a))
}

// Group by auction house; groups ordered by earliest close, must_win first within each group.
function groupLots(lots) {
  const groups = new Map()
  for (const lot of [...lots].sort(compareLots)) {
    if (!groups.has(lot.auction_house)) groups.set(lot.auction_house, [])
    groups.get(lot.auction_house).push(lot)
  }
  return [...groups.entries()].map(([house, items]) => ({
    house,
    closeDate: items[0].auction_close_date,
    lots: [...items].sort((a, b) => Number(isMust(b)) - Number(isMust(a)) || compareLots(a, b)),
  }))
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function LotRow({ lot }) {
  const must = isMust(lot)
  return (
    <Tr $must={must}>
      <Td $dim={!must}>{must ? <MustBadge>🔴 Must Have</MustBadge> : DASH}</Td>
      <Td>
        <TitleLink href={lot.url} target="_blank" rel="noopener noreferrer">{lot.title}</TitleLink>
      </Td>
      <Td>{lot.auction_house}</Td>
      <Td>{lot.auction_name || DASH}</Td>
      <Td>
        {formatClose(lot.auction_close_date)}
        <Muted>{daysRemaining(lot.auction_close_date)}</Muted>
      </Td>
      <Td $dim={!lot.cert_service}>{lot.cert_service || DASH}</Td>
      <Td $dim={!lot.grade}>{lot.grade || DASH}</Td>
      <Td $dim={!lot.auto_grade}>{lot.auto_grade || DASH}</Td>
      <Td $dim={lot.current_bid == null}>{formatBid(lot.current_bid)}</Td>
      <Td $dim={!lot.notes}>
        {lot.notes ? <NotesText title={lot.notes}>{truncate(lot.notes, NOTES_MAX)}</NotesText> : DASH}
      </Td>
    </Tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WantList() {
  const [search, setSearch] = useState('')
  const [importance, setImportance] = useState('all')

  const totalCount = wantlistData.length
  const mustCount = useMemo(() => wantlistData.filter(isMust).length, [])

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = wantlistData.filter(lot => {
      const matchesSearch = !q
        || lot.title?.toLowerCase().includes(q)
        || lot.auction_house?.toLowerCase().includes(q)
      const matchesImportance = importance === 'all' || lot.importance === importance
      return matchesSearch && matchesImportance
    })
    return groupLots(filtered)
  }, [search, importance])

  const shownCount = groups.reduce((n, g) => n + g.lots.length, 0)

  return (
    <>
      <PageHeading>
        <PageTitle>Want List</PageTitle>
        <PageSub>Active lots across upcoming auctions</PageSub>
        <Summary>
          <strong>{totalCount}</strong> lots · <strong>{mustCount}</strong> must have
        </Summary>
      </PageHeading>

      <Controls>
        <SearchBox>
          <span className="material-symbols-outlined">search</span>
          <SearchInput
            type="search"
            placeholder="Search title or auction house"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchBox>
        <Select value={importance} onChange={e => setImportance(e.target.value)} aria-label="Importance">
          <option value="all">All</option>
          <option value="must_win">Must Have</option>
          <option value="normal">Normal</option>
        </Select>
        <ResultsMeta>{shownCount} of {totalCount} lots</ResultsMeta>
      </Controls>

      <TableWrap>
        <Table>
          <thead>
            <tr>{COLUMNS.map(col => <Th key={col}>{col}</Th>)}</tr>
          </thead>
          {groups.length === 0 ? (
            <tbody>
              <StatusRow><td colSpan={COLUMNS.length}>No lots match</td></StatusRow>
            </tbody>
          ) : groups.map(group => (
            <tbody key={group.house}>
              <tr>
                <GroupHeaderCell colSpan={COLUMNS.length}>
                  {group.house}
                  <GroupMeta>
                    Closes {formatClose(group.closeDate)} {daysRemaining(group.closeDate)} · {group.lots.length} lot{group.lots.length === 1 ? '' : 's'}
                  </GroupMeta>
                </GroupHeaderCell>
              </tr>
              {group.lots.map(lot => <LotRow key={lot.id} lot={lot} />)}
            </tbody>
          ))}
        </Table>
      </TableWrap>
    </>
  )
}
