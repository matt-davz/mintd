import styled, { keyframes } from 'styled-components'
import { seriesCollageTiles } from '../../lib/worldSeries'
import { WorldSeriesFan } from './WorldSeriesFan'

// Museum timeline stop for a COMPLETE Yankees World Series — one gold card
// centred on the axis with a fanned collage of the real tickets. Activating it
// opens <WorldSeriesModal>. Desktop: <WorldSeriesStop>; mobile: <WorldSeriesMobileCard>.

const SERIES_STOP_WIDTH = 520
const SERIES_CARD_WIDTH = 340

const goldGlow = keyframes`
  0%, 100% { box-shadow: 0 0 18px rgba(232, 195, 87, 0.18), 0 20px 40px rgba(0, 0, 0, 0.5); }
  50%      { box-shadow: 0 0 34px rgba(232, 195, 87, 0.34), 0 20px 40px rgba(0, 0, 0, 0.5); }
`

const Stop = styled.div`
  position: relative;
  width: ${SERIES_STOP_WIDTH}px;
  flex-shrink: 0;
  height: 100%;
  scroll-snap-align: center;
  z-index: 2;
  transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
`

const Dot = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translate(-50%, -50%) rotate(45deg);
  background: var(--color-secondary);
  box-shadow: 0 0 0 5px rgba(232, 195, 87, 0.18), 0 0 20px rgba(232, 195, 87, 0.6);
`

const CardWrap = styled.div`
  position: absolute;
  top: calc(5% + 0.75rem);
  bottom: calc(5% + 0.75rem);
  left: 50%;
  transform: translateX(-50%);
  width: ${SERIES_CARD_WIDTH}px;
`

const Card = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background:
    radial-gradient(ellipse at 50% 45%, rgba(232, 195, 87, 0.09), transparent 65%),
    rgba(18, 18, 18, 0.94);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(232, 195, 87, 0.42);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  animation: ${goldGlow} 5s ease-in-out infinite;
  transition: transform 0.35s, border-color 0.35s;

  &:hover { transform: translateY(-3px); border-color: rgba(232, 195, 87, 0.7); }
  &:focus-visible { outline: 2px solid var(--color-secondary); outline-offset: 3px; }

  @media (prefers-reduced-motion: reduce) { animation: none; }
`

const Header = styled.div`
  padding: 1rem 1.25rem 0.75rem;
  text-align: center;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(232, 195, 87, 0.15);
`

const Eyebrow = styled.span`
  display: block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-secondary);
`

const Year = styled.span`
  display: block;
  margin-top: 0.25rem;
  font-family: var(--font-headline);
  font-size: 2.25rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--color-on-background);
`

const Title = styled.span`
  display: block;
  margin-top: 0.25rem;
  font-family: var(--font-headline);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-secondary-fixed);
`

const Collage = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 0.75rem 0;
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem 0.875rem;
  flex-shrink: 0;
  border-top: 1px solid rgba(232, 195, 87, 0.15);
`

const GamePips = styled.div`
  display: flex;
  gap: 4px;

  span {
    width: 7px;
    height: 7px;
    border-radius: 2px;
    background: var(--color-secondary-fixed-dim);
    box-shadow: 0 0 4px rgba(232, 195, 87, 0.45);
  }
`

const Meta = styled.span`
  display: block;
  margin-top: 0.375rem;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
`

const Cta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-secondary);

  .material-symbols-outlined { font-size: 0.875rem; }
`

function activateOnKey(e, fn) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    fn()
  }
}

function seriesAriaLabel(series) {
  return `${series.year} World Series — complete series, all ${series.totalGames} games. View the tickets.`
}

export function WorldSeriesStop({ series, stopRef, style, onOpen }) {
  const tiles = seriesCollageTiles(series)
  return (
    <Stop ref={stopRef} style={style}>
      <Dot />
      <CardWrap>
        <Card
          role="button"
          tabIndex={0}
          aria-label={seriesAriaLabel(series)}
          aria-haspopup="dialog"
          onClick={onOpen}
          onKeyDown={(e) => activateOnKey(e, onOpen)}
        >
          <Header>
            <Eyebrow>World Series</Eyebrow>
            <Year>{series.year}</Year>
            <Title>Complete Series</Title>
          </Header>
          <Collage>
            <WorldSeriesFan tiles={tiles} />
          </Collage>
          <Footer>
            <div>
              <GamePips aria-hidden="true">
                {series.games.map(g => <span key={g.number} />)}
              </GamePips>
              <Meta>{series.totalGames} of {series.totalGames} games</Meta>
            </div>
            <Cta>View series <span className="material-symbols-outlined">arrow_forward</span></Cta>
          </Footer>
        </Card>
      </CardWrap>
    </Stop>
  )
}

// ── Mobile ────────────────────────────────────────────────────────────────────

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
  transform: translateX(-50%) rotate(45deg);
  background: var(--color-secondary);
  box-shadow: 0 0 0 4px rgba(232, 195, 87, 0.18), 0 0 12px rgba(232, 195, 87, 0.5);
`

const MobileYear = styled.div`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-secondary);
  margin-bottom: 0.625rem;
`

const MobileCard = styled(Card)`
  height: auto;
  animation: none;
  box-shadow: 0 0 22px rgba(232, 195, 87, 0.16);

  &:hover { transform: none; }
`

const MobileHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem 0.5rem;
`

const MobileTitle = styled.span`
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--color-on-background);
`

const MobileCollage = styled.div`
  position: relative;
  height: 150px;
  padding: 0.25rem 0 0.5rem;
`

export function WorldSeriesMobileCard({ series, onOpen }) {
  const tiles = seriesCollageTiles(series)
  return (
    <MobileStop>
      <MobileDot />
      <MobileYear>{series.year} · World Series</MobileYear>
      <MobileCard
        role="button"
        tabIndex={0}
        aria-label={seriesAriaLabel(series)}
        aria-haspopup="dialog"
        onClick={onOpen}
        onKeyDown={(e) => activateOnKey(e, onOpen)}
      >
        <MobileHeader>
          <MobileTitle>{series.year} Complete Series</MobileTitle>
          <Eyebrow as="span">{series.totalGames} / {series.totalGames} games</Eyebrow>
        </MobileHeader>
        <MobileCollage>
          <WorldSeriesFan tiles={tiles} compact />
        </MobileCollage>
        <Footer>
          <GamePips aria-hidden="true">
            {series.games.map(g => <span key={g.number} />)}
          </GamePips>
          <Cta>View series <span className="material-symbols-outlined">arrow_forward</span></Cta>
        </Footer>
      </MobileCard>
    </MobileStop>
  )
}
