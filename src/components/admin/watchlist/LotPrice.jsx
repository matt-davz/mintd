import styled from 'styled-components'
import { formatAgo, formatMoney, hasNoBids, isBidStale } from '../../../lib/auctionWatchlist'
import { Badge } from './styles'

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

const Amount = styled.span`
  font-family: var(--font-mono);
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ $stale }) => ($stale ? 'var(--color-on-surface-variant)' : 'var(--color-primary)')};
`

const Unavailable = styled.span`
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-outline);
`

const Meta = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-on-surface-variant);
`

const Opening = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-on-surface-variant);
`

/**
 * Current bid as last verified — never estimated. A live check that found no
 * bids shows "No bids yet" plus the opening bid, which is labelled as such and
 * never presented as the current bid.
 */
export function LotPrice({ lot, now }) {
  const hasBid = lot.current_bid !== null && lot.current_bid !== undefined
  const noBids = !hasBid && hasNoBids(lot)
  const verified = hasBid || noBids
  const stale = verified && isBidStale(lot, now)
  const checked = lot.bid_checked_at
    ? new Date(lot.bid_checked_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null

  return (
    <Wrap>
      <Label>Current bid</Label>
      {hasBid && <Amount $stale={stale}>{formatMoney(lot.current_bid, lot.currency)}</Amount>}
      {noBids && <Unavailable>No bids yet</Unavailable>}
      {!verified && <Unavailable>Unavailable</Unavailable>}
      {noBids && lot.opening_bid != null && (
        <Opening>Opening bid {formatMoney(lot.opening_bid, lot.currency)}</Opening>
      )}
      <Meta>
        {verified ? (
          <>
            <span title={checked ?? undefined}>
              {lot.bid_source === 'manual' ? 'Entered' : 'Checked'} {formatAgo(lot.bid_checked_at, now)}
            </span>
            {lot.bid_source === 'manual' && <Badge $tone="violet">Manual</Badge>}
            {stale && <Badge $tone="warn">Stale</Badge>}
          </>
        ) : (
          <span>Never verified</span>
        )}
      </Meta>
    </Wrap>
  )
}
