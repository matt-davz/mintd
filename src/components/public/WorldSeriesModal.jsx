import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { withAutoOrient } from '../../lib/cloudinary'
import { formatGameList } from '../../lib/worldSeries'

// Public dialog for a complete Yankees World Series: every game in order with
// the real ticket / ticket-sheet items that cover it. Tiles call onOpenItem(id)
// so the page can open the regular <ItemViewerModal> on top. While that viewer
// is open (`suspended`), this dialog ignores Escape and releases its focus trap.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function formatDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 190;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(14, 14, 14, 0.9);
  backdrop-filter: blur(12px);

  @media (min-width: 768px) { padding: 2rem; }
`

const Dialog = styled.div`
  position: relative;
  width: 100%;
  max-width: 60rem;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: rgba(28, 27, 27, 0.85);
  border: 1px solid rgba(232, 195, 87, 0.3);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(232, 195, 87, 0.08);
`

const Header = styled.header`
  padding: 1.5rem 4.5rem 1.25rem 1.5rem;
  background: radial-gradient(ellipse at 0% 0%, rgba(232, 195, 87, 0.1), transparent 60%);
  border-bottom: 1px solid rgba(232, 195, 87, 0.15);
  flex-shrink: 0;

  @media (min-width: 768px) { padding: 2rem 5rem 1.5rem 2rem; }
`

const Eyebrow = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-secondary);
`

const Title = styled.h2`
  margin-top: 0.375rem;
  font-family: var(--font-headline);
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--color-on-background);
`

const Sub = styled.p`
  margin-top: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
`

const CloseBtn = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-full);
  background: var(--color-surface-high);
  border: none;
  color: var(--color-on-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-base);

  &:hover { background: rgba(232, 195, 87, 0.2); }
  &:focus-visible { outline: 2px solid var(--color-secondary); outline-offset: 2px; }
  .material-symbols-outlined { font-size: 1.375rem; }
`

const Body = styled.ol`
  list-style: none;
  margin: 0;
  padding: 1rem 1.5rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 768px) { padding: 1.5rem 2rem 2rem; }
`

const GameRow = styled.li`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: var(--radius-lg);
  background: var(--color-surface-low);

  @media (min-width: 768px) {
    grid-template-columns: 10rem 1fr;
    gap: 1.5rem;
    align-items: start;
  }
`

const GameHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const GameNumber = styled.h3`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-secondary);
`

const GameDate = styled.span`
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-primary);
`

const Score = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  line-height: 1.5;
  color: var(--color-on-surface-variant);
`

const Tiles = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
  gap: 0.75rem;
`

const Tile = styled.button`
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 0;
  border: 1px solid rgba(173, 198, 255, 0.12);
  border-radius: var(--radius-md);
  background: rgba(20, 20, 20, 0.85);
  overflow: hidden;
  cursor: pointer;
  color: inherit;
  transition: border-color 0.25s, transform 0.25s;

  &:hover { border-color: rgba(232, 195, 87, 0.55); transform: translateY(-2px); }
  &:focus-visible { outline: 2px solid var(--color-secondary); outline-offset: 2px; }
`

const TileImg = styled.div`
  position: relative;
  aspect-ratio: 4 / 5;
  background: var(--color-surface-lowest);

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

const NoImg = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-surface-bright);
  .material-symbols-outlined { font-size: 2rem; }
`

const TileBody = styled.div`
  padding: 0.5rem 0.625rem 0.625rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const TileTitle = styled.span`
  font-family: var(--font-headline);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.25;
  color: var(--color-on-background);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const TileType = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #6b7280;
`

const FOCUSABLE = 'button, [href], [tabindex]:not([tabindex="-1"])'

function typeLabel(item, games) {
  if (item.item_type === 'ticket_sheet') return `Ticket Sheet · ${formatGameList(games)}`
  return 'Ticket'
}

export function WorldSeriesModal({ series, onClose, onOpenItem, suspended = false }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const lastTileRef = useRef(null)
  const wasSuspended = useRef(suspended)

  const artifactCount = series.itemGames.size
  const titleId = `ws-series-title-${series.year}`

  // Lock body scroll; focus the dialog and restore focus to the opener on close
  useEffect(() => {
    const opener = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [])

  // When the item viewer on top closes, return focus to the tile that opened it
  useEffect(() => {
    if (wasSuspended.current && !suspended) lastTileRef.current?.focus()
    wasSuspended.current = suspended
  }, [suspended])

  useEffect(() => {
    if (suspended) return
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const nodes = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (!dialogRef.current.contains(document.activeElement)) {
        e.preventDefault(); first.focus()
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, suspended])

  function openItem(e, id) {
    lastTileRef.current = e.currentTarget
    onOpenItem(id)
  }

  return createPortal(
    <Overlay onClick={onClose}>
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseBtn ref={closeRef} onClick={onClose} aria-label="Close series">
          <span className="material-symbols-outlined">close</span>
        </CloseBtn>

        <Header>
          <Eyebrow>Yankees · Complete World Series</Eyebrow>
          <Title id={titleId}>{series.year} World Series</Title>
          <Sub>
            All {series.totalGames} games collected · {artifactCount} {artifactCount === 1 ? 'artifact' : 'artifacts'}
          </Sub>
        </Header>

        <Body>
          {series.games.map(game => {
            const gc = game.gameContext
            const hasScore = gc && gc.home_score != null && gc.away_score != null
            return (
              <GameRow key={game.number}>
                <GameHead>
                  <GameNumber>Game {game.number}</GameNumber>
                  {gc?.game_date && <GameDate>{formatDate(gc.game_date)}</GameDate>}
                  {hasScore && (
                    <Score>
                      {gc.away_team} {gc.away_score}<br />
                      {gc.home_team} {gc.home_score}
                    </Score>
                  )}
                </GameHead>
                <Tiles>
                  {game.items.map(item => {
                    const title = item.museum_title || item.title
                    const label = typeLabel(item, series.itemGames.get(item.id) ?? [game.number])
                    return (
                      <Tile
                        key={item.id}
                        type="button"
                        onClick={(e) => openItem(e, item.id)}
                        aria-label={`Game ${game.number}: ${title} (${label}). Open item.`}
                      >
                        <TileImg>
                          {item.primary_image_url ? (
                            <img src={withAutoOrient(item.primary_image_url)} alt="" loading="lazy" />
                          ) : (
                            <NoImg><span className="material-symbols-outlined">image_not_supported</span></NoImg>
                          )}
                        </TileImg>
                        <TileBody>
                          <TileTitle>{title}</TileTitle>
                          <TileType>{label}</TileType>
                        </TileBody>
                      </Tile>
                    )
                  })}
                </Tiles>
              </GameRow>
            )
          })}
        </Body>
      </Dialog>
    </Overlay>,
    document.body
  )
}
