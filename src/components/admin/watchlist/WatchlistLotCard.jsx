import { useState } from 'react'
import styled from 'styled-components'
import { HOUSES } from '../../../lib/auctionWatchlist'
import { Badge, GhostBtn, IconBtn } from './styles'
import { LotPrice } from './LotPrice'
import { LotClosing } from './LotClosing'
import { ManualPriceForm } from './ManualPriceForm'

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-high);
  box-shadow: ${({ $mustWin }) => ($mustWin ? 'inset 0 0 0 1px rgba(232, 195, 87, 0.35)' : 'none')};
  min-width: 0;
`

const Top = styled.div`
  display: flex;
  gap: var(--space-3);
  min-width: 0;
`

const Thumb = styled.div`
  flex-shrink: 0;
  width: 5rem;
  height: 5rem;
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-lowest);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05);

  img { width: 100%; height: 100%; object-fit: contain; }
  .material-symbols-outlined { color: var(--color-outline-variant); font-size: 1.75rem; }

  @media (min-width: 640px) { width: 6rem; height: 6rem; }
`

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  flex: 1;
`

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
`

const LotNo = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  color: var(--color-outline);
  text-transform: uppercase;
`

const Title = styled.h3`
  font-family: var(--font-headline);
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-on-surface);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Stats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
`

const Notice = styled.p`
  font-size: 0.6875rem;
  line-height: 1.5;
  color: ${({ $tone }) => ($tone === 'error' ? 'var(--color-error)' : 'var(--color-outline)')};
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
`

const Spacer = styled.span` flex: 1; `

const STATUS_NOTICE = { blocked: 'error', error: 'error', unsupported: 'muted' }

export function WatchlistLotCard({ lot, now, onRemove, onManualPrice, onTogglePriority }) {
  const [editingPrice, setEditingPrice] = useState(false)
  const [busy, setBusy] = useState(false)
  const house = HOUSES[lot.house]
  const mustWin = lot.priority === 'must_win'
  const noticeTone = STATUS_NOTICE[lot.refresh_status]

  async function run(fn) {
    setBusy(true)
    try { await fn() } catch (e) { window.alert(e.message) } finally { setBusy(false) }
  }

  function handleRemove() {
    if (window.confirm(`Remove lot ${lot.lot_number ?? lot.lot_id} from the watchlist?`)) run(() => onRemove(lot.id))
  }

  return (
    <Card $mustWin={mustWin}>
      <Top>
        <Thumb>
          {lot.image_url
            ? <img src={lot.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" />
            : <span className="material-symbols-outlined" aria-hidden="true">image</span>}
        </Thumb>
        <Head>
          <Badges>
            <LotNo>{house?.short} · Lot {lot.lot_number ?? lot.lot_id}</LotNo>
            {mustWin && <Badge $tone="gold"><span className="material-symbols-outlined">star</span>Must win</Badge>}
            {lot.lot_status === 'extended' && <Badge $tone="blue">Extended</Badge>}
          </Badges>
          <Title title={lot.title ?? undefined}>{lot.title ?? 'Title pending — refresh or open lot page'}</Title>
        </Head>
      </Top>

      <Stats>
        <LotPrice lot={lot} now={now} />
        <LotClosing lot={lot} now={now} />
      </Stats>

      {noticeTone && lot.last_error && <Notice $tone={noticeTone}>{lot.last_error}</Notice>}

      {editingPrice ? (
        <ManualPriceForm
          initial={lot.bid_source === 'manual' ? lot.current_bid : ''}
          onCancel={() => setEditingPrice(false)}
          onSave={async (amount) => { await onManualPrice(lot.id, amount); setEditingPrice(false) }}
        />
      ) : (
        <Actions>
          <GhostBtn as="a" href={lot.source_url} target="_blank" rel="noopener noreferrer">
            <span className="material-symbols-outlined">open_in_new</span>Lot page
          </GhostBtn>
          <GhostBtn type="button" onClick={() => setEditingPrice(true)} disabled={busy}>
            <span className="material-symbols-outlined">edit</span>Manual price
          </GhostBtn>
          <Spacer />
          <IconBtn
            type="button"
            onClick={() => run(() => onTogglePriority(lot))}
            disabled={busy}
            title={mustWin ? 'Unmark must-win' : 'Mark must-win'}
            aria-label={mustWin ? 'Unmark must-win' : 'Mark must-win'}
            aria-pressed={mustWin}
          >
            <span className="material-symbols-outlined" style={mustWin ? { color: 'var(--color-secondary)' } : undefined}>star</span>
          </IconBtn>
          <IconBtn type="button" $danger onClick={handleRemove} disabled={busy} title="Remove from watchlist" aria-label="Remove from watchlist">
            <span className="material-symbols-outlined">delete</span>
          </IconBtn>
        </Actions>
      )}
    </Card>
  )
}
