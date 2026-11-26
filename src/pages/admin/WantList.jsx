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
  color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'rgba(229, 226, 225, 0.35)')};
  background-color: #202020;
  box-shadow: ${({ $active }) => ($active ? 'inset 0 -2px 0 var(--color-primary)' : 'none')};
  text-align: left;
`

const SortButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 100%;
  padding: 0;
  background: none;
  border: none;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
  cursor: pointer;
  transition: color var(--transition-base);

  .material-symbols-outlined {
    font-size: 0.875rem;
    opacity: ${({ $active }) => ($active ? 1 : 0.35)};
  }

  &:hover { color: var(--color-on-surface); }
  &:hover .material-symbols-outlined { opacity: 1; }
  &:focus-visible {
    outline: 1px solid rgba(173, 198, 255, 0.6);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
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

const AmountText = styled.span`
  font-size: 1.5rem;
  line-height: 1.2;
  white-space: nowrap;
`

const EstimateText = styled(AmountText)`
  color: var(--color-on-surface-variant);
  font-style: italic;
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

// Strip surrounding straight/curly quotes, e.g. "\"$5,000 - $10,000\"" → "$5,000 - $10,000".
function cleanEstimate(str) {
  return typeof str === 'string' ? str.trim().replace(/^["'“”]+|["'“”]+$/g, '').trim() : ''
}

// Lower bound of a price range string ("$5,000 - $10,000" → 5000); null when unparseable.
function estimateLowerBound(str) {
  const match = cleanEstimate(str).match(/\d[\d,]*(?:\.\d+)?/)
  if (!match) return null
  const n = Number(match[0].replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function toNumber(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const toText = value => (typeof value === 'string' && value.trim() ? value.trim() : null)

// Sortable columns. `value` returns a comparable value or null (missing → always sorted last).
const COLUMNS = [
  { key: 'importance', label: 'Importance', type: 'number', value: lot => (isMust(lot) ? 0 : 1) },
  { key: 'title', label: 'Title', type: 'text', value: lot => toText(lot.title) },
  { key: 'auction_house', label: 'Auction House', type: 'text', value: lot => toText(lot.auction_house) },
  { key: 'current_bid', label: 'Current Bid', type: 'number', value: lot => toNumber(lot.current_bid) },
  { key: 'close', label: 'Time Left', type: 'text', value: lot => toText(lot.auction_close_date) },
  { key: 'cert_service', label: 'Cert', type: 'text', value: lot => toText(lot.cert_service) },
  { key: 'grade', label: 'Grade', type: 'text', value: lot => toText(lot.grade) },
  { key: 'auto_grade', label: 'Auto Grade', type: 'text', value: lot => toText(lot.auto_grade) },
  { key: 'expected_price', label: 'Expected Price', type: 'number', value: lot => estimateLowerBound(lot.expected_price) },
  { key: 'notes', label: 'Notes', type: 'text', value: lot => toText(lot.notes) },
]
const COLUMNS_BY_KEY = Object.fromEntries(COLUMNS.map(col => [col.key, col]))
const DEFAULT_SORT = { key: 'close', dir: 'asc' }

const textCollator = new Intl.Collator('en-US', { sensitivity: 'base', numeric: true })

// Compare one column; missing values go last regardless of direction.
function compareByColumn(a, b, col, dir) {
  const va = col.value(a)
  const vb = col.value(b)
  const aMissing = va == null
  const bMissing = vb == null
  if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1
  const base = col.type === 'number' ? va - vb : textCollator.compare(va, vb)
  return dir === 'desc' ? -base : base
}

// Deterministic fallback: soonest close, must-have first, title, then id.
function compareDefault(a, b) {
  return compareByColumn(a, b, COLUMNS_BY_KEY.close, 'asc')
    || compareByColumn(a, b, COLUMNS_BY_KEY.importance, 'asc')
    || compareByColumn(a, b, COLUMNS_BY_KEY.title, 'asc')
    || String(a.id).localeCompare(String(b.id))
}

function sortLots(lots, { key, dir }) {
  const col = COLUMNS_BY_KEY[key] ?? COLUMNS_BY_KEY[DEFAULT_SORT.key]
  return [...lots].sort((a, b) => compareByColumn(a, b, col, dir) || compareDefault(a, b))
}

// ─── Header ───────────────────────────────────────────────────────────────────

function SortableTh({ col, sort, onSort }) {
  const active = sort.key === col.key
  const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
  const icon = active ? (sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'
  const nextDir = active && sort.dir === 'asc' ? 'descending' : 'ascending'
  return (
    <Th scope="col" aria-sort={ariaSort} $active={active}>
      <SortButton
        type="button"
        $active={active}
        onClick={() => onSort(col.key)}
        title={`Sort by ${col.label} ${nextDir}`}
      >
        {col.label}
        <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      </SortButton>
    </Th>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function LotRow({ lot }) {
  const must = isMust(lot)
  const estimate = cleanEstimate(lot.expected_price)
  const bid = formatBid(lot.current_bid)
  return (
    <Tr $must={must}>
      <Td $dim={!must}>{must ? <MustBadge>🔴 Must Have</MustBadge> : DASH}</Td>
      <Td>
        <TitleLink href={lot.url} target="_blank" rel="noopener noreferrer">{lot.title}</TitleLink>
      </Td>
      <Td>{lot.auction_house}</Td>
      <Td $dim={lot.current_bid == null}>
        {bid === DASH ? DASH : <AmountText>{bid}</AmountText>}
      </Td>
      <Td>
        {formatClose(lot.auction_close_date)}
        <Muted>{daysRemaining(lot.auction_close_date)}</Muted>
      </Td>
      <Td $dim={!lot.cert_service}>{lot.cert_service || DASH}</Td>
      <Td $dim={!lot.grade}>{lot.grade || DASH}</Td>
      <Td $dim={!lot.auto_grade}>{lot.auto_grade || DASH}</Td>
      <Td $dim={!estimate}>
        {estimate ? <EstimateText>{estimate}</EstimateText> : DASH}
      </Td>
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
  const [sort, setSort] = useState(DEFAULT_SORT)

  const totalCount = wantlistData.length
  const mustCount = useMemo(() => wantlistData.filter(isMust).length, [])

  // Same column toggles direction; a new column starts ascending.
  const handleSort = key => setSort(prev => (
    prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
  ))

  const lots = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = wantlistData.filter(lot => {
      const matchesSearch = !q
        || lot.title?.toLowerCase().includes(q)
        || lot.auction_house?.toLowerCase().includes(q)
      const matchesImportance = importance === 'all' || lot.importance === importance
      return matchesSearch && matchesImportance
    })
    return sortLots(filtered, sort)
  }, [search, importance, sort])

  const shownCount = lots.length

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
            <tr>
              {COLUMNS.map(col => <SortableTh key={col.key} col={col} sort={sort} onSort={handleSort} />)}
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 ? (
              <StatusRow><td colSpan={COLUMNS.length}>No lots match</td></StatusRow>
            ) : lots.map(lot => <LotRow key={lot.id} lot={lot} />)}
          </tbody>
        </Table>
      </TableWrap>
    </>
  )
}
