import { useState, useRef, useEffect, useCallback, useId } from 'react'
import styled from 'styled-components'
import { useWsQuestItems } from '../../hooks/useWsQuestItems'
import { WsYearDetailPanel } from './WsYearDetailPanel'

// "By Game" tier of the admin Yankees WS Ticket Quest: one group of game slots
// per World Series year, wrapping across rows. Each year opens a large,
// scrollable detail panel (owned games with ticket / ticket-sheet images,
// plus the missing games) on hover, keyboard focus, or tap/click.
//
// - Hover opens; a short close delay lets the pointer travel from the year to
//   the panel, and the panel stays open while hovered / scrolled.
// - Click / tap pins the panel; a second click on the same year unpins+closes.
// - Escape, the close button, or a pointerdown outside closes it.
// - Tab from an open year moves into the panel; tabbing past its end continues
//   to the next element after the year.
//
// `series` is the output of buildYankeesWsSeries; counts and Have/Missing come
// only from it. `galleryItems` (Dashboard's item_gallery rows) supply titles +
// images; linked items missing from the gallery are looked up by
// useWsQuestItems with the authenticated admin client.

const HOVER_CLOSE_DELAY = 200
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

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

export function WsGameSlotsByYear({ series, galleryItems, galleryLoading, onItemClick }) {
  const baseId = useId()
  const wrapRef = useRef(null)
  const panelRef = useRef(null)
  const closeTimer = useRef(null)
  const pointerInPanel = useRef(false)
  const suppressFocusOpen = useRef(false)
  // { year, anchorEl, pinned } — pinned = opened by click/tap, survives mouseleave/blur
  const [open, setOpen] = useState(null)

  const { itemsById, pending, failed } = useWsQuestItems(series, galleryItems, galleryLoading)

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])

  const close = useCallback(() => {
    cancelClose()
    pointerInPanel.current = false
    setOpen(null)
  }, [cancelClose])

  const closeUnpinned = useCallback(() => {
    setOpen(prev => (prev && !prev.pinned ? null : prev))
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(closeUnpinned, HOVER_CLOSE_DELAY)
  }, [cancelClose, closeUnpinned])

  useEffect(() => cancelClose, [cancelClose])

  // Hover never replaces a pinned panel for another year.
  const hoverShow = (year, anchorEl) => {
    cancelClose()
    setOpen(prev => (prev?.year === year || prev?.pinned ? prev : { year, anchorEl, pinned: false }))
  }
  const focusShow = (year, anchorEl) => {
    cancelClose()
    setOpen(prev => (prev?.year === year ? prev : { year, anchorEl, pinned: false }))
  }

  const handleClick = (year, anchorEl) => {
    cancelClose()
    setOpen(prev => {
      // A tap fires mouseenter/focus first, so an unpinned panel for this year
      // is already showing — pin it. A second click on a pinned year closes it.
      if (prev?.year === year) return prev.pinned ? null : { ...prev, pinned: true }
      return { year, anchorEl, pinned: true }
    })
  }

  // Return focus to a year button without re-opening its panel via onFocus.
  const refocus = useCallback(el => {
    if (!el) return
    suppressFocusOpen.current = true
    el.focus()
    suppressFocusOpen.current = false
  }, [])
  const focusAnchor = () => open?.anchorEl?.focus()

  // Escape + outside pointerdown dismissal. The panel is portalled, so check it separately.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key !== 'Escape') return
      const hadFocus = panelRef.current?.contains(document.activeElement) || document.activeElement === open.anchorEl
      close()
      if (hadFocus) refocus(open.anchorEl)
    }
    function onPointerDown(e) {
      if (wrapRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return
      close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, close, refocus])

  const focusIntoPanel = () => {
    const first = panelRef.current?.querySelector(FOCUSABLE)
    first?.focus()
  }

  // Leaving the panel by keyboard: Tab past the end → element after the year;
  // Shift+Tab before the start → the year button.
  const handlePanelKeyDown = e => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = [...panelRef.current.querySelectorAll(FOCUSABLE)]
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      focusAnchor()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      const all = [...document.querySelectorAll(FOCUSABLE)]
        .filter(el => !panelRef.current.contains(el) && el.getClientRects().length > 0)
      const next = all[all.indexOf(open?.anchorEl) + 1]
      close()
      ;(next ?? open?.anchorEl)?.focus()
    }
  }

  const handlePanelBlur = e => {
    const to = e.relatedTarget
    if (to && (panelRef.current?.contains(to) || to === open?.anchorEl)) return
    if (to) closeUnpinned()
  }

  const handleItemClick = itemId => {
    close()
    onItemClick?.(itemId)
  }

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
            aria-label={`${year} World Series: ${ownedCount} of ${totalGames} games collected${isComplete ? ', complete series' : ''}. Show owned tickets and missing games.`}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={isOpen ? panelId : undefined}
            onMouseEnter={e => hoverShow(year, e.currentTarget)}
            onMouseLeave={scheduleClose}
            onFocus={e => { if (!suppressFocusOpen.current) focusShow(year, e.currentTarget) }}
            onBlur={e => {
              const to = e.relatedTarget
              if (panelRef.current?.contains(to) || pointerInPanel.current) return
              if (open?.year === year && !open.pinned) closeUnpinned()
            }}
            onKeyDown={e => {
              if (isOpen && e.key === 'Tab' && !e.shiftKey && panelRef.current) {
                e.preventDefault()
                focusIntoPanel()
              }
            }}
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
        <WsYearDetailPanel
          ref={panelRef}
          id={`${baseId}-ws-${openSeries.year}`}
          series={openSeries}
          anchorEl={open.anchorEl}
          itemsById={itemsById}
          itemsPending={pending}
          itemsFailed={failed}
          onClose={() => { const a = open.anchorEl; close(); refocus(a) }}
          onItemClick={handleItemClick}
          onMouseEnter={() => { pointerInPanel.current = true; cancelClose() }}
          onMouseLeave={() => { pointerInPanel.current = false; scheduleClose() }}
          onKeyDown={handlePanelKeyDown}
          onBlur={handlePanelBlur}
        />
      )}
    </Wrap>
  )
}
