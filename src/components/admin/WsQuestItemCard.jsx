import { useState } from 'react'
import styled from 'styled-components'
import { withAutoOrient } from '../../lib/cloudinary'

// One linked ticket / ticket-sheet item inside the WS Ticket Quest year panel.
// The game is already known to be owned (from the ticket links); this card is
// display-only, so a missing image or a failed item lookup only changes what
// is shown here.

const TYPE_LABELS = { ticket: 'Ticket', ticket_sheet: 'Ticket sheet' }

const Card = styled.button`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  text-align: left;
  background-color: var(--color-surface-low);
  border: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: ${({ disabled }) => disabled ? 'default' : 'pointer'};
  transition: background-color var(--transition-base);

  &:not(:disabled):hover { background-color: var(--color-surface); }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
`

const Thumb = styled.div`
  aspect-ratio: 4 / 3;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-surface-lowest);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .material-symbols-outlined {
    font-size: 2rem;
    color: rgba(229, 226, 225, 0.25);
  }
`

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-2) var(--space-3) var(--space-3);
`

const Tags = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-primary);
`

const Hidden = styled.span`
  color: rgba(229, 226, 225, 0.5);
`

const ItemTitle = styled.span`
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.35;
  color: ${({ $muted }) => $muted ? 'rgba(229, 226, 225, 0.5)' : 'var(--color-on-surface)'};
  font-style: ${({ $muted }) => $muted ? 'italic' : 'normal'};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

export function WsQuestItemCard({ itemId, item, pending, failed, gameNumber, onClick }) {
  const [imgError, setImgError] = useState(false)
  const src = item?.primary_image_url ? withAutoOrient(item.primary_image_url) : null
  const showImage = src && !imgError

  let title = item?.title
  if (!item) title = pending ? 'Loading item…' : failed ? 'Item details unavailable' : 'Item not found'
  const canOpen = !!onClick && !!item

  return (
    <li>
      <Card
        type="button"
        disabled={!canOpen}
        onClick={canOpen ? () => onClick(itemId) : undefined}
        aria-label={item ? `Game ${gameNumber}: ${item.title}. Open item.` : `Game ${gameNumber}: ${title}`}
      >
        <Thumb>
          {showImage
            ? <img src={src} alt="" loading="lazy" onError={() => setImgError(true)} />
            : <span className="material-symbols-outlined" aria-hidden="true">
                {pending && !item ? 'hourglass_empty' : 'confirmation_number'}
              </span>}
        </Thumb>
        <Meta>
          <Tags>
            <span>Game {gameNumber}</span>
            {item?.item_type && <span>· {TYPE_LABELS[item.item_type] ?? item.item_type}</span>}
            {item?.hidden && <Hidden>· Not public</Hidden>}
          </Tags>
          <ItemTitle $muted={!item}>{title}</ItemTitle>
        </Meta>
      </Card>
    </li>
  )
}
