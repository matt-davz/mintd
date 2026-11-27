import styled from 'styled-components'
import { formatAgo, formatMoney } from '../../../lib/auctionWatchlist'
import { PRICE_BASES, isBeforeScheduledClose, isVerified } from '../../../lib/priceComps'
import { Badge, Mono } from '../watchlist/styles'

const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-lowest);
`

const PriceLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
`

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  flex-wrap: wrap;
`

const Amount = styled(Mono)`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-on-surface);
`

const PendingText = styled.span`
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-on-surface-variant);
`

const SourceLine = styled.span`
  font-size: 0.6875rem;
  color: var(--color-outline);

  a { color: var(--color-primary); }
  a:hover { text-decoration: underline; }
`

/**
 * Final price panel. Pending comps never show a number — current bids and
 * the scheduled close are not final. Verified comps show the realized price,
 * its basis (hammer / incl. buyer's premium / unknown) and the results source.
 */
export function CompFinalPrice({ comp, now }) {
  if (!isVerified(comp)) {
    return (
      <PriceBlock>
        <PriceLabel>Final price</PriceLabel>
        <PendingText>Not yet verified</PendingText>
        <SourceLine>
          {isBeforeScheduledClose(comp, now)
            ? 'Lot is still open. Current bids are not final and are not recorded here.'
            : 'Record the realized price once the auction house publishes results.'}
        </SourceLine>
      </PriceBlock>
    )
  }
  const basis = PRICE_BASES[comp.price_basis] ?? PRICE_BASES.unknown
  return (
    <PriceBlock>
      <PriceLabel>Verified final price</PriceLabel>
      <PriceRow>
        <Amount>{formatMoney(comp.final_price, comp.currency)}</Amount>
        <Badge $tone={comp.price_basis === 'unknown' ? 'warn' : 'muted'} title={basis.long}>{basis.label}</Badge>
      </PriceRow>
      <SourceLine>
        {basis.long} · Source:{' '}
        <a href={comp.result_url} target="_blank" rel="noopener noreferrer">auction results</a>
        {' · '}verified {formatAgo(comp.verified_at, now)}
      </SourceLine>
    </PriceBlock>
  )
}
