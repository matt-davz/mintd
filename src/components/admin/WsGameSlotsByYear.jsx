import { useState, useRef, useEffect, useLayoutEffect, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

// "By Game" tier of the admin Yankees WS Ticket Quest: one group of game slots
// per World Series year, wrapping across rows. Each year opens a Have / Missing
// detail panel on hover, keyboard focus, or tap. The panel is portalled to
// <body> with fixed positioning so card edges can't clip it.
//
// `series` is the output of buildYankeesWsSeries — only game numbers are known
// here (no item names), so the panel lists game numbers only.

const VIEWPORT_MARGIN = 8
const PANEL_GAP = 8

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
`

const YearButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 4px;
  margin: -4px;
  background: ${({ $active }) => $active ? 'rgba(173, 198, 255, 0.08)' : 'transparent'};
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-base);

  &:hover { background-color: rgba(173, 198, 255, 0.06); }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }
`

const YearLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: ${({ $complete }) => $complete ? 'var(--color-secondary)' : 'rgba(229, 226, 225, 0.5)'};
  font-weight: ${({ $complete }) => $complete ? 700 : 400};
`

const SlotsRow = styled.span`
  display: flex;
  gap: 2px;
`

const Slot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background-color: ${({ $owned, $complete }) =>
    $complete ? 'var(--color-secondary-fixed-dim)' : $owned ? 'var(--color-primary)' : 'rgba(140, 144, 159, 0.15)'};
  box-shadow: ${({ $owned, $complete }) =>
    $complete ? '0 0 4px rgba(232, 195, 87, 0.45)' : $owned ? '0 0 4px rgba(173, 198, 255, 0.5)' : 'none'};
`

const Panel = styled.div`
  position: fixed;
  z-index: 1000;
  width: max-content;
  max-width: min(18rem, calc(100vw - ${VIEWPORT_MARGIN * 2}px));
  max-height: calc(100vh - ${VIEWPORT_MARGIN * 2}px);
  overflow-y: auto;
  padding: var(--space-4);
  background-color: var(--color-surface-highest);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
  pointer-events: none;
`

const PanelTitle = styled.p`
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 700;
  color: ${({ $complete }) => $complete ? 'var(--color-secondary)' : 'var(--color-on-surface)'};
`

const PanelSub = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: rgba(229, 226, 225, 0.55);
  margin-top: 2px;
  margin-bottom: var(--space-3);
`

const Section = styled.div`
  & + & { margin-top: var(--space-3); }
`

const SectionHeading = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ $tone }) => $tone === 'have' ? 'var(--color-primary)' : 'rgba(229, 226, 225, 0.5)'};
  margin-bottom: var(--space-2);
`

const Chips = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
`

const Chip = styled.li`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background-color: ${({ $tone }) => $tone === 'have' ? 'rgba(173, 198, 255, 0.14)' : 'rgba(140, 144, 159, 0.12)'};
  color: ${({ $tone }) => $tone === 'have' ? 'var(--color-primary)' : 'rgba(229, 226, 225, 0.7)'};
`

const Empty = styled.p`
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-style: italic;
  color: rgba(229, 226, 225, 0.45);
`

function GameChips({ numbers, tone, emptyText }) {
  if (numbers.length === 0) return <Empty>{emptyText}</Empty>
  return (
    <Chips>
      {numbers.map(n => <Chip key={n} $tone={tone}>Game {n}</Chip>)}
    </Chips>
  )
}

function YearDetailPanel({ id, series, anchorEl }) {
  const panelRef = useRef(null)
  const [pos, setPos] = useState(null)

  const place = useCallback(() => {
    const panel = panelRef.current
    if (!panel || !anchorEl) return
    const a = anchorEl.getBoundingClientRect()
    const p = panel.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let left = a.left + a.width / 2 - p.width / 2
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - p.width - VIEWPORT_MARGIN))

    // Prefer below the year; flip above when it would run off the viewport.
    let top = a.bottom + PANEL_GAP
    if (top + p.height > vh - VIEWPORT_MARGIN && a.top - PANEL_GAP - p.height >= VIEWPORT_MARGIN) {
      top = a.top - PANEL_GAP - p.height
    }
    // Neither side fits (e.g. a short screen): clamp inside the viewport so the
    // panel stays visible, even if it overlaps the anchor. Panel max-height
    // guarantees p.height fits within the margins.
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, vh - p.height - VIEWPORT_MARGIN))
    setPos({ top, left })
  }, [anchorEl])

  useLayoutEffect(() => { place() }, [place, series])

  useEffect(() => {
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [place])

  const { year, totalGames, games, ownedSet, ownedCount, isComplete } = series
  const have = games.map(g => g.number).filter(n => ownedSet.has(n))
  const missing = games.map(g => g.number).filter(n => !ownedSet.has(n))

  return createPortal(
    <Panel
      ref={panelRef}
      id={id}
      role="tooltip"
      style={pos ?? { top: 0, left: 0, visibility: 'hidden' }}
    >
      <PanelTitle $complete={isComplete}>{year} World Series</PanelTitle>
      <PanelSub>
        {ownedCount} of {totalGames} games{isComplete ? ' · Complete series' : ''}
      </PanelSub>
      <Section>
        <SectionHeading $tone="have">Have ({have.length})</SectionHeading>
        <GameChips numbers={have} tone="have" emptyText="No tickets for this series yet" />
      </Section>
      <Section>
        <SectionHeading $tone="missing">Missing ({missing.length})</SectionHeading>
        <GameChips numbers={missing} tone="missing" emptyText="None — every game collected" />
      </Section>
    </Panel>,
    document.body,
  )
}

export function WsGameSlotsByYear({ series }) {
  const baseId = useId()
  const wrapRef = useRef(null)
  // { year, anchorEl, pinned } — pinned = opened by click/tap, survives mouseleave
  const [open, setOpen] = useState(null)

  const show = (year, anchorEl) =>
    setOpen(prev => (prev?.year === year ? prev : { year, anchorEl, pinned: false }))
  const hideUnpinned = year => setOpen(prev => (prev?.year === year && !prev.pinned ? null : prev))

  const handleClick = (year, anchorEl) => setOpen(prev => {
    // A tap fires mouseenter/focus first, so an unpinned panel for this year
    // is already showing — pin it. A second click on a pinned year closes it.
    if (prev?.year === year) return prev.pinned ? null : { ...prev, pinned: true }
    return { year, anchorEl, pinned: true }
  })

  // Close on Escape or on a click/tap outside the year groups.
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') setOpen(null) }
    function onPointerDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  const openSeries = open ? series.find(s => s.year === open.year) : null

  return (
    <Wrap ref={wrapRef}>
      {series.map(s => {
        const { year, totalGames, ownedSet, ownedCount, isComplete } = s
        const isOpen = open?.year === year
        const panelId = `${baseId}-ws-${year}`
        return (
          <YearButton
            key={year}
            type="button"
            $active={isOpen}
            aria-label={`${year} World Series: ${ownedCount} of ${totalGames} games collected${isComplete ? ', complete series' : ''}. Show have and missing games.`}
            aria-expanded={isOpen}
            aria-describedby={isOpen ? panelId : undefined}
            onMouseEnter={e => show(year, e.currentTarget)}
            onMouseLeave={() => hideUnpinned(year)}
            onFocus={e => show(year, e.currentTarget)}
            onBlur={() => setOpen(prev => (prev?.year === year ? null : prev))}
            onClick={e => handleClick(year, e.currentTarget)}
          >
            <SlotsRow aria-hidden="true">
              {Array.from({ length: totalGames }, (_, i) => i + 1).map(n => (
                <Slot key={n} $owned={ownedSet.has(n)} $complete={isComplete} />
              ))}
            </SlotsRow>
            <YearLabel $complete={isComplete} aria-hidden="true">{year}</YearLabel>
          </YearButton>
        )
      })}

      {openSeries && (
        <YearDetailPanel
          id={`${baseId}-ws-${openSeries.year}`}
          series={openSeries}
          anchorEl={open.anchorEl}
        />
      )}
    </Wrap>
  )
}
