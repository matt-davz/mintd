import { useMemo } from 'react'
import styled from 'styled-components'
import { useWsTicketTracker } from '../../../hooks/useWsTicketTracker'
import { buildWsOpportunities } from '../../../lib/wsTicketOpportunities'
import { formatAgo } from '../../../lib/auctionWatchlist'
import { Badge, GhostBtn, Hint, StateBox } from './styles'
import { WsOpportunityGame } from './WsOpportunityGame'

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
`

const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-2) var(--space-4);
`

const Eyebrow = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-secondary);
  margin-bottom: var(--space-1);
`

const Title = styled.h2`
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

const SmallState = styled(StateBox)`
  padding: var(--space-6);
`

/**
 * Private: possibly-open watchlist lots (see isLotPossiblyOpen) whose titles explicitly name a World Series
 * game the WS Ticket Tracker sheet marks "Don't Have". Ownership comes only
 * from the sheet — a lot never marks anything as owned or missing.
 */
export function WsOpportunitiesPanel({ lots, now }) {
  const tracker = useWsTicketTracker()
  const entries = useMemo(
    () => (tracker.status === 'ready' ? buildWsOpportunities(tracker.missing, lots, now) : []),
    [tracker.status, tracker.missing, lots, now],
  )
  const lotCount = new Set(entries.flatMap(e => e.lots.map(l => l.lot.id))).size

  return (
    <Section aria-label="Missing World Series ticket opportunities">
      <Header>
        <div>
          <Eyebrow>WS Ticket Tracker · Don’t Have</Eyebrow>
          <Title>Missing-ticket opportunities</Title>
        </div>
        <Meta>
          {tracker.status === 'ready' && (
            <>
              <Badge $tone="blue">Sheet read {formatAgo(tracker.readAt, now)}</Badge>
              <span>{tracker.missing.length} Don’t Have games · {lotCount} matching lot{lotCount === 1 ? '' : 's'}</span>
            </>
          )}
          {tracker.status === 'unconfigured' && <Badge $tone="muted">Sheet not connected</Badge>}
          {tracker.status === 'error' && <Badge $tone="error">Sheet unavailable</Badge>}
          <GhostBtn type="button" onClick={tracker.reload} disabled={tracker.status === 'loading'}>
            <span className="material-symbols-outlined">sync</span>
            {tracker.status === 'loading' ? 'Reading sheet…' : 'Re-read sheet'}
          </GhostBtn>
        </Meta>
      </Header>

      {tracker.status === 'loading' && (
        <SmallState><span className="material-symbols-outlined">hourglass_empty</span>Reading the WS Ticket Tracker sheet…</SmallState>
      )}
      {tracker.status === 'unconfigured' && (
        <SmallState>
          <span className="material-symbols-outlined">link_off</span>
          The WS Ticket Tracker sheet connection needs Matt to finish setup, so no missing-ticket matches can be shown yet.
        </SmallState>
      )}
      {tracker.status === 'error' && (
        <SmallState role="alert">
          <span className="material-symbols-outlined">error</span>
          Couldn’t read the tracker sheet: {tracker.error}. No matches are shown until it can be read.
        </SmallState>
      )}
      {tracker.status === 'ready' && entries.length === 0 && (
        <SmallState>
          <span className="material-symbols-outlined">confirmation_number</span>
          No watchlist lot still open (or within 24 hours of its scheduled close) explicitly names a World Series game marked Don’t Have.
        </SmallState>
      )}
      {tracker.status === 'ready' && entries.map(e => (
        <WsOpportunityGame key={`${e.year}:${e.game}`} entry={e} now={now} />
      ))}
      {tracker.status === 'ready' && (
        <Hint>
          Matches need an explicit year, “World Series”, game number and ticket/stub in the lot title.
          Programs, photos, collections, year/game ranges and ambiguous titles are left out. Lots are hidden once confirmed closed, 24 hours after their scheduled close, or when no close time is known.
        </Hint>
      )}
    </Section>
  )
}
