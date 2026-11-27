import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { formatCloseTime, formatRemaining } from '../../../lib/auctionWatchlist'
import { isBeforeScheduledClose, isVerified } from '../../../lib/priceComps'
import { ErrorBanner } from '../FormFields'
import { Badge, GhostBtn, Hint, IconBtn, Mono } from '../watchlist/styles'
import { CompFinalPrice } from './CompFinalPrice'
import { RecordResultForm } from './RecordResultForm'

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-low);
  box-shadow: ${({ $verified }) => ($verified ? 'inset 3px 0 0 var(--color-secondary)' : 'inset 3px 0 0 rgba(173, 198, 255, 0.35)')};
  min-width: 0;
`

const Top = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;

  > :last-child { margin-left: auto; }
`

const Title = styled.a`
  font-family: var(--font-headline);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-on-surface);
  word-break: break-word;
  transition: color var(--transition-base);

  &:hover { color: var(--color-primary); }
  .material-symbols-outlined { font-size: 0.875rem; vertical-align: -0.1em; margin-left: 0.25rem; }
`

const Meta = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1) var(--space-3);
  margin: 0;
  font-size: 0.75rem;

  dt {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-outline);
    padding-top: 0.15rem;
  }
  dd { margin: 0; color: var(--color-on-surface-variant); min-width: 0; word-break: break-word; }
  a { color: var(--color-primary); }
  a:hover { text-decoration: underline; }
`

const LotNo = styled(Mono)`
  font-size: 0.6875rem;
  color: var(--color-outline);
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
`

function OwnedItem({ comp }) {
  if (!comp.owned_item_id) return <>Linked item was deleted</>
  const label = comp.owned_item?.title ?? comp.owned_item_id
  return <Link to={`/admin/dashboard?item=${comp.owned_item_id}`}>{label}</Link>
}

function ClosingText({ comp, now }) {
  if (!comp.scheduled_close_at) return <>Unknown — check lot page</>
  const remaining = formatRemaining(comp.scheduled_close_at, now)
  return (
    <>
      {formatCloseTime(comp.scheduled_close_at)}
      {' · '}
      {remaining ? `in ${remaining} (scheduled; extended bidding may apply)` : 'scheduled time passed — may still be in extended bidding'}
    </>
  )
}

export function PriceCompCard({ comp, now, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState(null)
  const verified = isVerified(comp)
  const tooEarly = isBeforeScheduledClose(comp, now)

  async function handleSave(patch) {
    await onUpdate(comp, patch)
    setEditing(false)
  }

  async function handleRemove() {
    if (!window.confirm(`Remove the price comp "${comp.title}"?`)) return
    setRemoving(true)
    setError(null)
    try {
      await onRemove(comp.id)
    } catch (err) {
      setError(err.message)
      setRemoving(false)
    }
  }

  return (
    <Card $verified={verified}>
      <Top>
        <Badge $tone={verified ? 'gold' : 'blue'}>
          <span className="material-symbols-outlined" aria-hidden="true">{verified ? 'verified' : 'schedule'}</span>
          {verified ? 'Verified' : 'Pending'}
        </Badge>
        <Badge>{comp.auction_house}</Badge>
        {comp.lot_number && <LotNo>Lot {comp.lot_number}</LotNo>}
        <IconBtn type="button" $danger onClick={handleRemove} disabled={removing} aria-label={`Remove comp ${comp.title}`} title="Remove comp">
          <span className="material-symbols-outlined">delete</span>
        </IconBtn>
      </Top>

      <Title href={comp.source_url} target="_blank" rel="noopener noreferrer">
        {comp.title}
        <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
      </Title>

      <Meta>
        <dt>Comp for</dt>
        <dd><OwnedItem comp={comp} /></dd>
        {comp.auction_name && <><dt>Auction</dt><dd>{comp.auction_name}</dd></>}
        <dt>Closes</dt>
        <dd><ClosingText comp={comp} now={now} /></dd>
        {comp.notes && <><dt>Notes</dt><dd>{comp.notes}</dd></>}
      </Meta>

      <CompFinalPrice comp={comp} now={now} />

      {error && <ErrorBanner role="alert">{error}</ErrorBanner>}

      {editing ? (
        <RecordResultForm comp={comp} onSave={handleSave} onCancel={() => setEditing(false)} />
      ) : (
        <Actions>
          <GhostBtn type="button" onClick={() => setEditing(true)} disabled={tooEarly}>
            <span className="material-symbols-outlined" aria-hidden="true">{verified ? 'edit' : 'gavel'}</span>
            {verified ? 'Correct result' : 'Record result'}
          </GhostBtn>
          {tooEarly && <Hint>Available after the scheduled close.</Hint>}
        </Actions>
      )}
    </Card>
  )
}
