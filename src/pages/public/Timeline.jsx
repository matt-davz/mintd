import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { useItems } from '../../hooks/useItems'
import { withAutoOrient } from '../../lib/cloudinary'
import { EmberEffect } from '../../components/public/EmberEffect'
import { gradeColors } from '../../utils/gradeColors'

const STOP_WIDTH = 320
const CARD_WIDTH = 200
const CONNECTOR_HEIGHT = 44
const LEGENDARY_STOP_WIDTH = 500
const LEGENDARY_CARD_WIDTH = 270

const DECADE_IMAGES = {
  1920: 'https://res.cloudinary.com/duxcwfkr0/image/upload/v1781661160/lgtfl0axk9wnejkestut.jpg',
  1930: 'https://res.cloudinary.com/duxcwfkr0/image/upload/v1781661111/qbkepbhi5tnmrhm3d3i4.jpg',
  1940: 'https://res.cloudinary.com/duxcwfkr0/image/upload/v1781661121/psaubbiorhne1lhvj9x7.jpg',
  1950: 'https://res.cloudinary.com/duxcwfkr0/image/upload/v1781661118/lzkloilmu5brbgxntany.jpg',
  1960: 'https://res.cloudinary.com/duxcwfkr0/image/upload/v1781661162/io35ryni8ghdwyfakkwb.jpg',
  1970: 'https://res.cloudinary.com/duxcwfkr0/image/upload/v1781661110/ghqffyxy6hx78bupwaap.webp',
  1980: 'https://res.cloudinary.com/duxcwfkr0/image/upload/v1781661156/cuarq16qlmphfcdyj4lo.webp',
  1990: 'https://res.cloudinary.com/duxcwfkr0/image/upload/v1781661113/kojcxqidqa3iqscmuceu.jpg',
  2000: 'https://res.cloudinary.com/duxcwfkr0/image/upload/v1781661139/e7hq4mdoocjbe4leladw.jpg',
  2020: 'https://res.cloudinary.com/duxcwfkr0/image/upload/v1781661119/emnqxn5l5qiupkh5tjv8.webp',
}

// ── Page shell ────────────────────────────────────────────────────────────────

const Page = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  @media (min-width: 768px) {

  }

  @media (max-width: 767px) {
    height: auto;
    min-height: 100vh;
    overflow: visible;

  }
`

const PageHeader = styled.div`
  padding: 0 1.25rem 1rem;
  max-width: 1536px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (min-width: 768px) {

    top: 4rem;
    left: 0;
    right: 0;
    z-index: 5;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1.25rem 4rem 2rem;
    background: linear-gradient(to bottom, rgba(10, 10, 10, 0.75) 0%, transparent 100%);
    pointer-events: none;
  }
`

const Heading = styled.h1`
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: clamp(2.75rem, 7vw, 4.5rem);
  letter-spacing: -0.04em;
  text-transform: uppercase;
  line-height: 1;
  color: var(--color-on-background);
`

const Desc = styled.p`
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--color-on-surface-variant);
  max-width: 26rem;
  font-weight: 500;
`

// ── Timeline track ────────────────────────────────────────────────────────────

const TrackOuter = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-x: clip;
  overflow-y: visible;
`

const BgImage = styled.div`
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: ${({ $active }) => $active ? 0.28 : 0};
  transition: opacity 1.4s ease;
  pointer-events: none;
  z-index: 0;
`

const BgOverlay = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, var(--color-surface-lowest) 0%, transparent 15%, transparent 85%, var(--color-surface-lowest) 100%),
    radial-gradient(ellipse at center, transparent 30%, rgba(14, 14, 14, 0.6) 100%);
  pointer-events: none;
  z-index: 1;
`

const NavFade = styled.div`
  position: absolute;
  inset-block: 0;
  width: 8rem;
  z-index: 10;
  pointer-events: none;
  display: flex;
  align-items: center;
`

const NavFadeLeft = styled(NavFade)`
  left: 0;
  background: linear-gradient(to right, var(--color-surface-lowest) 20%, transparent);
  padding-left: 1.25rem;
`

const NavFadeRight = styled(NavFade)`
  right: 0;
  background: linear-gradient(to left, var(--color-surface-lowest) 20%, transparent);
  justify-content: flex-end;
  padding-right: 1.25rem;
`

const NavBtn = styled.button`
  pointer-events: auto;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: rgba(28, 27, 27, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(173, 198, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(173, 198, 255, 0.1);
    border-color: rgba(173, 198, 255, 0.35);
  }

  .material-symbols-outlined {
    font-size: 1.125rem;
  }
`

const ScrollTrack = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;

  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
`

const TrackInner = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  height: 100%;
  width: max-content;
  padding: 0 25vw;
`

const CenterLine = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  transform: translateY(-50%);
  background: var(--color-primary);
  opacity: 0.35;
  z-index: 0;
  pointer-events: none;
`

// ── Legendary keyframe ────────────────────────────────────────────────────────

const pulseGlow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.4));
    border-color: rgba(59, 130, 246, 0.4);
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(59, 130, 246, 0.78));
    border-color: rgba(59, 130, 246, 0.78);
  }
`

// ── Per stop ──────────────────────────────────────────────────────────────────

const Stop = styled.div`
  position: relative;
  width: ${STOP_WIDTH}px;
  flex-shrink: 0;
  height: 100%;
  scroll-snap-align: center;
  z-index: 1;
  transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
`

// ── Legendary stop ────────────────────────────────────────────────────────────

const LegendaryStop = styled.div`
  position: relative;
  width: ${LEGENDARY_STOP_WIDTH}px;
  flex-shrink: 0;
  height: 100%;
  scroll-snap-align: center;
  z-index: 2;
  transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
`

const LegendaryStopDot = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.2), 0 0 20px rgba(59, 130, 246, 0.65);
  z-index: 0;
`

const LegendaryCardWrap = styled.div`
  position: absolute;
  top: calc(5% + 0.75rem);
  bottom: calc(5% + 0.75rem);
  left: 50%;
  transform: translateX(-50%);
  width: ${LEGENDARY_CARD_WIDTH}px;
  overflow: visible;
`

const LegendaryCardLink = styled(Link)`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(18, 18, 18, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: var(--radius-lg);
  overflow: hidden;
  animation: ${pulseGlow} 4s ease-in-out infinite;
  transition: transform 0.35s;

  &:hover {
    transform: translateY(-3px);
  }
`


const LegendaryYearLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(59, 130, 246, 0.85);
`

const LegendaryEventTitle = styled.div`
  padding: 0.75rem 1rem 0.625rem;
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 0.8125rem;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  text-align: center;
  color: var(--color-on-background);
  line-height: 1.3;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
`

const StopDot = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 0 5px rgba(173, 198, 255, 0.15);
  z-index: 3;
`

const YearLabel = styled.span`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-primary);
  white-space: nowrap;
  z-index: 2;
`

const YearBelow = styled(YearLabel)`
  top: calc(50% + 14px);
`

const YearAbove = styled(YearLabel)`
  bottom: calc(50% + 14px);
`

const Connector = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: ${CONNECTOR_HEIGHT}px;
  z-index: 2;
`

const ConnectorUp = styled(Connector)`
  bottom: 50%;
  background: linear-gradient(0deg, var(--color-primary) 0%, rgba(173, 198, 255, 0.15) 100%);
`

const ConnectorDown = styled(Connector)`
  top: 50%;
  background: linear-gradient(180deg, var(--color-primary) 0%, rgba(173, 198, 255, 0.15) 100%);
`

const CardAbove = styled.div`
  position: absolute;
  bottom: calc(50% + ${CONNECTOR_HEIGHT}px);
  left: 50%;
  transform: translateX(-50%);
  width: ${CARD_WIDTH}px;
  height: calc(50% - ${CONNECTOR_HEIGHT}px - 2.5rem);
`

const CardBelow = styled.div`
  position: absolute;
  top: calc(50% + ${CONNECTOR_HEIGHT}px);
  left: 50%;
  transform: translateX(-50%);
  width: ${CARD_WIDTH}px;
  height: calc(50% - ${CONNECTOR_HEIGHT}px - 2.5rem);
`

// ── Timeline card ─────────────────────────────────────────────────────────────

const CardLink = styled(Link)`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(173, 198, 255, 0.12);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.35s, transform 0.35s;

  &:hover {
    border-color: rgba(173, 198, 255, 0.4);
    transform: translateY(-3px);
  }
`

const CursorTooltip = styled.div`
  position: fixed;
  pointer-events: none;
  z-index: 100;
  background: var(--color-surface-highest);
  border: 1px solid rgba(173, 198, 255, 0.25);
  color: var(--color-on-background);
  font-family: var(--font-headline);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-lg);
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
`

const CardImg = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--color-surface-lowest);

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0.85;
    transition: transform 0.6s cubic-bezier(0.2, 0, 0.2, 1);
  }

  ${CardLink}:hover & img {
    transform: scale(1.06);
  }
`

const NoImg = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-surface-bright);

  .material-symbols-outlined { font-size: 2rem; }
`

const GradeBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: ${p => p.$bg ?? 'var(--color-secondary-container)'};
  color: ${p => p.$fg ?? 'var(--color-secondary-fixed)'};
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  padding: 0.2rem 0.4rem;
  border-radius: 2px;
  text-transform: uppercase;
`

const CardBody = styled.div`
  padding: 0.875rem 1rem 1rem;
  flex-shrink: 0;
`

const CardTitle = styled.h3`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--color-on-background);
  line-height: 1.25;
  margin-bottom: 0.4rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const CardType = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #6b7280;
`

// ── Scrubber ──────────────────────────────────────────────────────────────────

const ScrubberSection = styled.div`
  max-width: 48rem;
  margin: 0 auto;
  padding: 0.75rem 2rem 1rem;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1.25rem;
`

const ItemCount = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #6b7280;
  white-space: nowrap;
`

const ScrubberTrack = styled.div`
  flex: 1;
  height: 4px;
  background: var(--color-surface-high);
  border-radius: 999px;
  position: relative;
  cursor: pointer;

  &:hover { background: var(--color-surface-bright); }
`

const ScrubberFill = styled.div`
  position: absolute;
  inset-block: 0;
  left: 0;
  background: var(--color-primary);
  border-radius: 999px;
  pointer-events: none;
`

const ScrubberThumb = styled.div`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(173, 198, 255, 0.2);
  pointer-events: none;
  transition: box-shadow 0.2s;

  ${ScrubberTrack}:active & {
    box-shadow: 0 0 0 6px rgba(173, 198, 255, 0.15);
  }
`

// ── Mobile vertical layout ────────────────────────────────────────────────────

const MobileTrack = styled.div`
  position: relative;
  padding: 1.5rem 1.25rem 3rem 3.25rem;

  &::before {
    content: '';
    position: absolute;
    left: 1.375rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-primary);
    opacity: 0.35;
  }
`

const MobileStop = styled.div`
  position: relative;
  margin-bottom: 2rem;

  &:last-child { margin-bottom: 0; }
`

const MobileDot = styled.div`
  position: absolute;
  left: -1.875rem;
  top: 1.125rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(173, 198, 255, 0.15);
  transform: translateX(-50%);
`

const MobileYear = styled.div`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.05em;
  margin-bottom: 0.625rem;
`

const MobileCard = styled(Link)`
  display: flex;
  gap: 0;
  background: rgba(20, 20, 20, 0.85);
  border: 1px solid rgba(173, 198, 255, 0.12);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.25s;

  &:hover { border-color: rgba(173, 198, 255, 0.4); }
`

const MobileCardImg = styled.div`
  width: 90px;
  flex-shrink: 0;
  background: var(--color-surface-lowest);
  position: relative;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

const MobileCardBody = styled.div`
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
`

const MobileCardTitle = styled.h3`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 0.8125rem;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--color-on-background);
  line-height: 1.25;
`

const MobileCardType = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #6b7280;
`

const MobileGradeBadge = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5rem;
  font-weight: 700;
  color: ${p => p.$fg ?? 'var(--color-secondary-fixed)'};
  background: ${p => p.$bg ?? 'var(--color-secondary-container)'};
  padding: 0.15rem 0.35rem;
  border-radius: 2px;
  text-transform: uppercase;
  align-self: flex-start;
`

// ── State boxes ───────────────────────────────────────────────────────────────

const StateBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rem 2rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #6b7280;
`

// ── Sub-components ────────────────────────────────────────────────────────────

function TimelineCard({ item }) {
  const [tooltip, setTooltip] = useState(null)

  const gradeLabel = item.cert_grade
    ? `${item.cert_grader ?? ''} ${item.cert_grade}`.trim()
    : null

  return (
    <>
      {tooltip && (
        <CursorTooltip style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}>
          {item.title}
        </CursorTooltip>
      )}
      <CardLink
        to={`/item/${item.id}`}
        onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setTooltip(null)}
      >
        <CardImg>
          {item.primary_image_url ? (
            <img src={withAutoOrient(item.primary_image_url)} alt={item.title} loading="lazy" />
          ) : (
            <NoImg>
              <span className="material-symbols-outlined">image_not_supported</span>
            </NoImg>
          )}
          {gradeLabel && <GradeBadge {...gradeColors(item.cert_grade)}>{gradeLabel}</GradeBadge>}
        </CardImg>
        <CardBody>
          <CardTitle>{item.title}</CardTitle>
          {item.item_type && <CardType>{item.item_type}</CardType>}
        </CardBody>
      </CardLink>
    </>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function dateLabel(item) {
  if (!item.game_date) return String(item.season_year)
  const [year, month, day] = item.game_date.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    setMobile(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Timeline() {
  const { items, loading, error } = useItems()
  const isMobile = useMobile()
  const scrollRef = useRef(null)
  const scrubberRef = useRef(null)
  const stopRefs = useRef([])
  const [progress, setProgress] = useState(0)
  const [activeDecade, setActiveDecade] = useState(null)
  const [centeredIdx, setCenteredIdx] = useState(0)
  const timelineItemsRef = useRef([])

  const timelineItems = useMemo(() => {
    const sortKey = (item) =>
      item.game_date ?? `${item.season_year}-06-15`

    return items
      .filter(i =>
        i.season_year != null &&
        Array.isArray(i.team_slugs) &&
        i.team_slugs.includes('yankees')
      )
      .sort((a, b) => {
        const diff = sortKey(a).localeCompare(sortKey(b))
        if (diff !== 0) return diff
        // Same date: break ties by series game number (e.g. WS game 1 before game 8)
        return (a.series_game_number ?? 0) - (b.series_game_number ?? 0)
      })
  }, [items])

  // Keep a ref so the scroll handler always sees the latest items without re-binding
  useEffect(() => {
    timelineItemsRef.current = timelineItems
    if (timelineItems.length > 0 && activeDecade === null) {
      setActiveDecade(Math.floor(timelineItems[0].season_year / 10) * 10)
    }
  }, [timelineItems])

  const hasItems = !loading && !error && timelineItems.length > 0

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const total = el.scrollWidth - el.clientWidth
    setProgress(total > 0 ? (el.scrollLeft / total) * 100 : 0)

    const its = timelineItemsRef.current
    if (its.length === 0) return

    // Find which stop is visually closest to the viewport centre using live rects,
    // so variable-width legendary stops are handled correctly.
    const containerRect = el.getBoundingClientRect()
    const viewCenter = containerRect.left + containerRect.width / 2

    let closestIdx = 0
    let closestDist = Infinity
    stopRefs.current.forEach((ref, i) => {
      if (!ref) return
      const rect = ref.getBoundingClientRect()
      const dist = Math.abs(rect.left + rect.width / 2 - viewCenter)
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = i
      }
    })

    if (its[closestIdx]) {
      setActiveDecade(Math.floor(its[closestIdx].season_year / 10) * 10)
      setCenteredIdx(closestIdx)
    }
  }, [])

  // Attach scroll listener only after the ScrollTrack has mounted
  useEffect(() => {
    if (!hasItems) return
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll, hasItems])

  const scroll = useCallback((dir) => {
    scrollRef.current?.scrollBy({ left: dir * STOP_WIDTH, behavior: 'smooth' })
  }, [])

  const scrubTo = useCallback((clientX) => {
    const track = scrubberRef.current
    const scroll = scrollRef.current
    if (!track || !scroll) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const total = scroll.scrollWidth - scroll.clientWidth
    scroll.scrollLeft = ratio * total
  }, [])

  const handleScrubPointerDown = useCallback((e) => {
    e.preventDefault()
    scrubTo(e.clientX)
    const onMove = (e) => scrubTo(e.clientX)
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [scrubTo])

  return (
    <Page>
      <PageHeader>
        <div>
          <Heading>Yankees Museum</Heading>
        </div>
        <Desc>
          A chronological exhibition of the Pinstripe legacy — every Yankees artifact
          in the collection, ordered from oldest to newest.
        </Desc>
      </PageHeader>

      {loading && <StateBox>Loading archive…</StateBox>}
      {error && <StateBox>Error: {error}</StateBox>}
      {!loading && !error && timelineItems.length === 0 && (
        <StateBox>No dated Yankees items in the archive yet.</StateBox>
      )}

      {hasItems && isMobile && (
        <MobileTrack>
          {timelineItems.map((item) => {
            const gradeLabel = item.cert_grade
              ? `${item.cert_grader ?? ''} ${item.cert_grade}`.trim()
              : null
            return (
              <MobileStop key={item.id}>
                <MobileDot />
                <MobileYear>{dateLabel(item)}</MobileYear>
                <MobileCard to={`/item/${item.id}`}>
                  <MobileCardImg>
                    {item.primary_image_url && (
                      <img src={withAutoOrient(item.primary_image_url)} alt={item.title} loading="lazy" />
                    )}
                  </MobileCardImg>
                  <MobileCardBody>
                    <MobileCardTitle>{item.title}</MobileCardTitle>
                    {item.item_type && <MobileCardType>{item.item_type}</MobileCardType>}
                    {gradeLabel && <MobileGradeBadge {...gradeColors(item.cert_grade)}>{gradeLabel}</MobileGradeBadge>}
                  </MobileCardBody>
                </MobileCard>
              </MobileStop>
            )
          })}
        </MobileTrack>
      )}

      {hasItems && !isMobile && (
        <>
          <TrackOuter>
            {Object.entries(DECADE_IMAGES).map(([decade, url]) => (
              <BgImage
                key={decade}
                $active={Number(decade) === activeDecade}
                style={{ backgroundImage: `url(${url})` }}
              />
            ))}
            <BgOverlay />

            <NavFadeLeft>
              <NavBtn onClick={() => scroll(-1)} aria-label="Scroll left">
                <span className="material-symbols-outlined">arrow_back</span>
              </NavBtn>
            </NavFadeLeft>

            <NavFadeRight>
              <NavBtn onClick={() => scroll(1)} aria-label="Scroll right">
                <span className="material-symbols-outlined">arrow_forward</span>
              </NavBtn>
            </NavFadeRight>

            <ScrollTrack ref={scrollRef}>
              <TrackInner>
                <CenterLine />
                {timelineItems.map((item, i) => {
                  const isTop = i % 2 === 0
                  const centeredIsLegendary = timelineItems[centeredIdx]?.is_legendary

                  // Neighbors of a centred legendary item drift outward.
                  let pushX = 0
                  if (centeredIsLegendary) {
                    if (i === centeredIdx - 1) pushX = -30
                    if (i === centeredIdx + 1) pushX = 30
                  }
                  const pushStyle = { transform: `translateX(${pushX}px)` }

                  if (item.is_legendary) {
                    return (
                      <LegendaryStop
                        key={item.id}
                        ref={el => { stopRefs.current[i] = el }}
                        style={pushStyle}
                      >
                        <LegendaryStopDot />
                        <LegendaryCardWrap>
                          {/* Background embers — behind the card, arch wide to the sides */}
                          <EmberEffect height={220} intensity={10} zIndex={0} spread={70} />
                          <LegendaryCardLink to={`/item/${item.id}`}>
                            {item.legendary_event_title && (
                              <LegendaryEventTitle>{item.legendary_event_title}</LegendaryEventTitle>
                            )}
                            <CardImg>
                              {item.primary_image_url ? (
                                <img src={withAutoOrient(item.primary_image_url)} alt={item.title} loading="lazy" />
                              ) : (
                                <NoImg>
                                  <span className="material-symbols-outlined">image_not_supported</span>
                                </NoImg>
                              )}
                            </CardImg>
                            <CardBody>
                              <CardTitle>{item.title}</CardTitle>
                              <LegendaryYearLabel>{dateLabel(item)}</LegendaryYearLabel>
                              {item.item_type && <CardType style={{ marginLeft: '0.4rem' }}>{item.item_type}</CardType>}
                            </CardBody>
                          </LegendaryCardLink>
                          {/* Foreground embers — in front of the card */}
                          <EmberEffect height={110} intensity={6} zIndex={2} spread={0} />
                        </LegendaryCardWrap>
                      </LegendaryStop>
                    )
                  }

                  return (
                    <Stop
                      key={item.id}
                      ref={el => { stopRefs.current[i] = el }}
                      style={pushStyle}
                    >
                      <StopDot />
                      {isTop ? (
                        <>
                          <YearBelow>{dateLabel(item)}</YearBelow>
                          <ConnectorUp />
                          <CardAbove>
                            <TimelineCard item={item} />
                          </CardAbove>
                        </>
                      ) : (
                        <>
                          <YearAbove>{dateLabel(item)}</YearAbove>
                          <ConnectorDown />
                          <CardBelow>
                            <TimelineCard item={item} />
                          </CardBelow>
                        </>
                      )}
                    </Stop>
                  )
                })}
              </TrackInner>
            </ScrollTrack>
          </TrackOuter>

          <ScrubberSection>
            <ItemCount>{timelineItems.length} Items</ItemCount>
            <ScrubberTrack
              ref={scrubberRef}
              onPointerDown={handleScrubPointerDown}
            >
              <ScrubberFill style={{ width: `${progress}%` }} />
              <ScrubberThumb style={{ left: `${progress}%` }} />
            </ScrubberTrack>
          </ScrubberSection>
        </>
      )}
    </Page>
  )
}
