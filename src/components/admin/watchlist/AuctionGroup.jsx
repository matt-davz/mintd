import styled from 'styled-components'
import { HOUSES, formatCloseTime, formatRemaining } from '../../../lib/auctionWatchlist'
import { Badge } from './styles'
import { WatchlistLotCard } from './WatchlistLotCard'

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`

const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2) var(--space-4);
`

const HouseLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: var(--space-1);
`

const AuctionName = styled.h2`
  font-family: var(--font-headline);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-on-surface);
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-on-surface-variant);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);

  @media (min-width: 720px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (min-width: 1280px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
`

export function AuctionGroup({ group, now, onRemove, onManualPrice, onTogglePriority }) {
  const house = HOUSES[group.house]
  const firstCloseIso = Number.isFinite(group.firstClose) ? new Date(group.firstClose).toISOString() : null
  const remaining = formatRemaining(firstCloseIso, now)
  const mustWin = group.lots.filter(l => l.priority === 'must_win').length

  return (
    <Section aria-label={`${house?.label ?? group.house} — ${group.auctionName}`}>
      <Header>
        <div>
          <HouseLabel>{house?.label ?? group.house}</HouseLabel>
          <AuctionName>{group.auctionName}</AuctionName>
        </div>
        <Meta>
          <span>{group.lots.length} lot{group.lots.length === 1 ? '' : 's'}</span>
          {mustWin > 0 && <Badge $tone="gold">{mustWin} must win</Badge>}
          {firstCloseIso && (
            <span>
              {remaining ? `Scheduled close in ${remaining}` : 'Scheduled close passed'} · {formatCloseTime(firstCloseIso)}
            </span>
          )}
          {!house?.liveRefresh && <Badge $tone="muted">Manual prices</Badge>}
        </Meta>
      </Header>
      <Grid>
        {group.lots.map(lot => (
          <WatchlistLotCard
            key={lot.id}
            lot={lot}
            now={now}
            onRemove={onRemove}
            onManualPrice={onManualPrice}
            onTogglePriority={onTogglePriority}
          />
        ))}
      </Grid>
    </Section>
  )
}
