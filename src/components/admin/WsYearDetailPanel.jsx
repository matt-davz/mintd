import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { WsQuestItemCard } from './WsQuestItemCard'

// Large, scrollable, interactive detail panel for one World Series year in the
// admin WS Ticket Quest "By Game" tier. Portalled to <body> with fixed
// positioning so card edges can't clip it; placed below/above the year button
// and always kept inside the viewport (max height + internal scroll).
//
// Have / Missing is decided ONLY by `series.ownedSet` (the ticket links) —
// item/image lookups are display-only, so a failed lookup never moves a game
// between sections.

const VIEWPORT_MARGIN = 8
const PANEL_GAP = 8
const MIN_SIDE_HEIGHT = 220 // below this, clamp into the viewport instead

const Panel = styled.div`
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: min(38rem, calc(100vw - ${VIEWPORT_MARGIN * 2}px));
  max-height: min(42rem, calc(100vh - ${VIEWPORT_MARGIN * 2}px));
  background-color: var(--color-surface-highest);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  overflow: hidden;
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) var(--space-3);
  background-color: var(--color-surface-high);
  flex-shrink: 0;
`

const HeaderText = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`

const Title = styled.h3`
  font-family: var(--font-headline);
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  color: ${({ $complete }) => $complete ? 'var(--color-secondary)' : 'var(--color-on-surface)'};
`

const Sub = styled.p`
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: rgba(229, 226, 225, 0.6);
  margin: 2px 0 0;
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: rgba(229, 226, 225, 0.7);
  cursor: pointer;

  &:hover { background-color: rgba(173, 198, 255, 0.1); color: var(--color-on-surface); }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
`

const Body = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;

  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: -2px; }
`

const BodyInner = styled.div`
  padding: var(--space-4);
`

const Section = styled.section`
  & + & { margin-top: var(--space-6); }
`

const SectionHeading = styled.h4`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin: 0 0 var(--space-3);
  color: ${({ $tone }) => $tone === 'have' ? 'var(--color-primary)' : 'rgba(229, 226, 225, 0.55)'};
`

const GameBlock = styled.div`
  & + & { margin-top: var(--space-4); }
`

const GameHeading = styled.p`
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin: 0 0 var(--space-2);
  font-family: var(--font-headline);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-on-surface);

  span {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 400;
    color: rgba(229, 226, 225, 0.55);
  }
`

const ItemsGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
`

const Empty = styled.p`
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-style: italic;
  margin: 0;
  color: rgba(229, 226, 225, 0.5);
`

function formatGameMeta(gc) {
  if (!gc) return ''
  const parts = []
  if (gc.game_date) {
    const d = new Date(`${gc.game_date}T00:00:00`)
    if (!Number.isNaN(d.getTime())) {
      parts.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }))
    }
  }
  if (gc.home_score != null && gc.away_score != null) {
    parts.push(`${gc.away_team} ${gc.away_score} – ${gc.home_team} ${gc.home_score}`)
  }
  return parts.join(' · ')
}

function usePanelPlacement(panelRef, contentRef, anchorEl) {
  const [pos, setPos] = useState(null)

  const place = useCallback(() => {
    const panel = panelRef.current
    if (!panel || !anchorEl) return
    // Measure natural (CSS-capped) height without the previous inline cap.
    const prevMax = panel.style.maxHeight
    panel.style.maxHeight = ''
    const p = panel.getBoundingClientRect()
    panel.style.maxHeight = prevMax

    const a = anchorEl.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let left = a.left + a.width / 2 - p.width / 2
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - p.width - VIEWPORT_MARGIN))

    const below = vh - a.bottom - PANEL_GAP - VIEWPORT_MARGIN
    const above = a.top - PANEL_GAP - VIEWPORT_MARGIN
    let top
    let maxHeight

    if (p.height <= below) top = a.bottom + PANEL_GAP
    else if (p.height <= above) top = a.top - PANEL_GAP - p.height
    else if (Math.max(below, above) >= MIN_SIDE_HEIGHT) {
      // Too tall for either side: use the roomier side and scroll internally,
      // without covering the year button.
      maxHeight = Math.max(below, above)
      top = below >= above ? a.bottom + PANEL_GAP : VIEWPORT_MARGIN
    } else {
      // Very short viewport: clamp inside it (may overlap the anchor).
      top = Math.max(VIEWPORT_MARGIN, Math.min(a.bottom + PANEL_GAP, vh - p.height - VIEWPORT_MARGIN))
    }
    setPos({ top, left, maxHeight })
  }, [panelRef, anchorEl])

  useLayoutEffect(() => { place() }, [place])

  useEffect(() => {
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    // Re-place when content height changes (item details / images arriving).
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => place()) : null
    if (ro && contentRef.current) ro.observe(contentRef.current)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
      ro?.disconnect()
    }
  }, [place, contentRef])

  return pos
}

export const WsYearDetailPanel = forwardRef(function WsYearDetailPanel(
  { id, series, anchorEl, itemsById, itemsPending, itemsFailed, onClose, onItemClick, onMouseEnter, onMouseLeave, onKeyDown, onBlur },
  panelRef,
) {
  const contentRef = useRef(null)
  const pos = usePanelPlacement(panelRef, contentRef, anchorEl)
  const titleId = `${id}-title`

  const { year, totalGames, games, ownedSet, ownedCount, isComplete } = series
  const owned = games.filter(g => ownedSet.has(g.number))
  const missing = games.filter(g => !ownedSet.has(g.number)).map(g => g.number)

  const style = pos
    ? { top: pos.top, left: pos.left, ...(pos.maxHeight ? { maxHeight: pos.maxHeight } : null) }
    : { top: 0, left: 0, visibility: 'hidden' }

  return createPortal(
    <Panel
      ref={panelRef}
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <Header>
        <HeaderText>
          <Title id={titleId} $complete={isComplete}>{year} World Series</Title>
          <Sub>
            {ownedCount} of {totalGames} games
            {isComplete ? ' · Complete series' : ''}
            {missing.length > 0 ? ` (missing: ${missing.join(', ')})` : ''}
          </Sub>
        </HeaderText>
        <CloseButton type="button" onClick={onClose} aria-label={`Close ${year} World Series details`}>
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </CloseButton>
      </Header>

      <Body tabIndex={0} aria-label={`${year} World Series games`}>
        <BodyInner ref={contentRef}>
          <Section>
            <SectionHeading $tone="have">Have ({owned.length})</SectionHeading>
            {owned.length === 0 && <Empty>No tickets for this series yet</Empty>}
            {owned.map(game => {
              const meta = formatGameMeta(game.gameContext)
              return (
                <GameBlock key={game.number}>
                  <GameHeading>Game {game.number}{meta && <span>{meta}</span>}</GameHeading>
                  <ItemsGrid>
                    {game.itemIds.map(itemId => (
                      <WsQuestItemCard
                        key={itemId}
                        itemId={itemId}
                        item={itemsById.get(itemId)}
                        pending={itemsPending}
                        failed={itemsFailed}
                        gameNumber={game.number}
                        onClick={onItemClick}
                      />
                    ))}
                  </ItemsGrid>
                </GameBlock>
              )
            })}
          </Section>
        </BodyInner>
      </Body>
    </Panel>,
    document.body,
  )
})
