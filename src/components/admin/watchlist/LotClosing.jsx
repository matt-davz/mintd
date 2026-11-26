import styled from 'styled-components'
import { HOUSES, formatCloseTime, formatRemaining } from '../../../lib/auctionWatchlist'

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`

const Label = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
`

const Countdown = styled.span`
  font-family: var(--font-mono);
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ $urgent }) => ($urgent ? 'var(--color-secondary)' : 'var(--color-on-surface)')};
`

const Passed = styled.span`
  font-family: var(--font-headline);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-secondary);
`

const When = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-on-surface-variant);
`

const Caveat = styled.span`
  font-size: 0.6875rem;
  font-style: italic;
  color: var(--color-outline);
`

/**
 * Time remaining until the SCHEDULED close. Auctions with extended/soft
 * close can run past this, so after the scheduled time we never claim the
 * lot has closed unless the last refresh actually reported it closed.
 */
export function LotClosing({ lot, now }) {
  const house = HOUSES[lot.house]
  const remaining = formatRemaining(lot.scheduled_close_at, now)
  const when = formatCloseTime(lot.scheduled_close_at)
  const urgent = remaining && new Date(lot.scheduled_close_at).getTime() - now < 24 * 3600 * 1000

  if (!lot.scheduled_close_at) {
    return (
      <Wrap>
        <Label>Closes</Label>
        <When>Close time unknown — check lot page</When>
      </Wrap>
    )
  }

  if (lot.lot_status === 'closed') {
    return (
      <Wrap>
        <Label>Closed</Label>
        <Passed>Closed as of last check</Passed>
        <When>Scheduled {when}</When>
      </Wrap>
    )
  }

  if (!remaining) {
    return (
      <Wrap>
        <Label>Scheduled close passed</Label>
        <Passed>{lot.lot_status === 'extended' ? 'In extended bidding (last check)' : 'May still be in extended bidding'}</Passed>
        <When>{when}</When>
        <Caveat>Check the lot page for the final result.</Caveat>
      </Wrap>
    )
  }

  return (
    <Wrap>
      <Label>Time left</Label>
      <Countdown $urgent={urgent}>{remaining}</Countdown>
      <When>{when}</When>
      <Caveat>{house?.closeCaveat ?? 'Close time may extend'}</Caveat>
    </Wrap>
  )
}
