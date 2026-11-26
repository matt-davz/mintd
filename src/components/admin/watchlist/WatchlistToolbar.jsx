import styled from 'styled-components'
import { HOUSES } from '../../../lib/auctionWatchlist'

const Bar = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  @media (min-width: 900px) {
    flex-direction: row;
    align-items: center;
  }
`

const SearchWrap = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  max-width: 28rem;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-lowest);
  transition: background-color var(--transition-base);

  &:focus-within { background-color: var(--color-surface-high); }

  .material-symbols-outlined { font-size: 1.125rem; color: var(--color-outline); }

  input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-on-surface);
    font-family: var(--font-body);
    font-size: 0.875rem;
  }
`

const Pills = styled.div`
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
`

const Pill = styled.button`
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--transition-base), color var(--transition-base);
  background-color: ${({ $active }) => ($active ? 'rgba(173, 198, 255, 0.15)' : 'var(--color-surface-low)')};
  color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-on-surface-variant)')};

  &:hover { color: var(--color-on-surface); }
`

export function WatchlistToolbar({ search, onSearchChange, houses, activeHouse, onHouseChange }) {
  return (
    <Bar>
      <SearchWrap>
        <span className="material-symbols-outlined" aria-hidden="true">search</span>
        <input
          type="search"
          placeholder="Search title, lot number, auction…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search watchlist"
        />
      </SearchWrap>
      {houses.length > 1 && (
        <Pills role="group" aria-label="Filter by auction house">
          <Pill type="button" $active={!activeHouse} aria-pressed={!activeHouse} onClick={() => onHouseChange('')}>All</Pill>
          {houses.map(h => (
            <Pill key={h} type="button" $active={activeHouse === h} aria-pressed={activeHouse === h} onClick={() => onHouseChange(activeHouse === h ? '' : h)}>
              {HOUSES[h]?.short ?? h}
            </Pill>
          ))}
        </Pills>
      )}
    </Bar>
  )
}
