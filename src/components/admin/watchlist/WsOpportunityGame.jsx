import styled from 'styled-components'
import { HOUSES } from '../../../lib/auctionWatchlist'
import { wsTrackerRowUrl } from '../../../lib/wsTicketOpportunities'
import { LotPrice } from './LotPrice'
import { LotClosing } from './LotClosing'
import { Badge, Mono } from './styles'

const Card = styled.article`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-low);

  @media (min-width: 900px) { grid-template-columns: 11rem minmax(0, 1fr); }
`

const GameCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`

const Year = styled.span`
  font-family: var(--font-headline);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-on-surface);
`

const GameNo = styled.span`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-primary);
`

const SheetRef = styled(Mono)`
  font-size: 0.625rem;
  color: var(--color-outline);
`

const SheetLink = styled.a`
  color: inherit;
  text-decoration: underline;
  text-decoration-color: var(--color-outline-variant);

  &:hover { color: var(--color-primary); }
`

const Lots = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
`

const LotRow = styled.li`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-high);

  @media (min-width: 720px) { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr); }
`

const TitleCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`

const LotLink = styled.a`
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-on-surface);
  text-decoration: none;

  &:hover { color: var(--color-primary); text-decoration: underline; }
`

const LotMeta = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-on-surface-variant);
`

function gamesLabel(games) {
  return games.length === 2 ? `Games ${games[0]} & ${games[1]}` : `Games ${games.join(', ')}`
}

/** One sheet "Don't Have" game with every open watchlist lot that explicitly names it. */
export function WsOpportunityGame({ entry, now }) {
  return (
    <Card aria-label={`${entry.year} World Series Game ${entry.game}`}>
      <GameCol>
        <Year>{entry.year}</Year>
        <GameNo>World Series · Game {entry.game}</GameNo>
        <SheetRef>
          <SheetLink href={wsTrackerRowUrl(entry.row)} target="_blank" rel="noopener noreferrer">Sheet row {entry.row}</SheetLink>
          {' · Don’t Have'}
        </SheetRef>
      </GameCol>
      <Lots>
        {entry.lots.map(({ lot, games }) => (
          <LotRow key={lot.id}>
            <TitleCol>
              <LotLink href={lot.canonical_url} target="_blank" rel="noopener noreferrer">
                {lot.title || 'Untitled lot'}
              </LotLink>
              <LotMeta>
                <span>{HOUSES[lot.house]?.short ?? lot.house}</span>
                <span>· Lot {lot.lot_number ?? lot.lot_id}</span>
                {games.length > 1 && <Badge $tone="blue">Covers {gamesLabel(games)}</Badge>}
                {lot.priority === 'must_win' && <Badge $tone="gold">Must win</Badge>}
              </LotMeta>
            </TitleCol>
            <LotPrice lot={lot} now={now} />
            <LotClosing lot={lot} now={now} />
          </LotRow>
        ))}
      </Lots>
    </Card>
  )
}
