import styled from 'styled-components'
import { withAutoOrient } from '../../lib/cloudinary'
import { formatGameList } from '../../lib/worldSeries'

// Fanned collage of the actual ticket images in a World Series.
// Each tile is positioned by --k (its offset from the centre tile); the
// container controls spread (--step) and tilt (--rot), widened on hover.

const Fan = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  --step: ${({ $step }) => $step}%;
  --rot: ${({ $rot }) => $rot}deg;

  @media (hover: hover) {
    [role='button']:hover & {
      --step: ${({ $step }) => $step * 1.18}%;
      --rot: ${({ $rot }) => $rot * 1.25}deg;
    }
  }
`

const Tile = styled.div`
  position: absolute;
  top: 50%;
  left: calc(50% + var(--k) * var(--step));
  width: ${({ $width }) => $width}%;
  height: 86%;
  transform: translate(-50%, -50%) rotate(calc(var(--k) * var(--rot)));
  transform-origin: 50% 90%;
  background: var(--color-surface-lowest);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(232, 195, 87, 0.22);
  overflow: hidden;
  transition: left 0.5s cubic-bezier(0.2, 0, 0.2, 1), transform 0.5s cubic-bezier(0.2, 0, 0.2, 1);

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

  .material-symbols-outlined { font-size: 1.75rem; }
`

const GameTag = styled.span`
  position: absolute;
  left: 50%;
  bottom: 0.375rem;
  transform: translateX(-50%);
  padding: 0.125rem 0.375rem;
  border-radius: 2px;
  background: var(--color-secondary-container);
  color: var(--color-secondary-fixed);
  font-family: var(--font-mono);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
`

function shortGameLabel(games) {
  return formatGameList(games).replace(/^Games? /, 'G')
}

export function WorldSeriesFan({ tiles, compact = false }) {
  const n = tiles.length
  const mid = (n - 1) / 2
  // Total spread ~42% of the width regardless of tile count, capped per tile
  const step = n > 1 ? Math.min(compact ? 18 : 15, 42 / (n - 1)) : 0
  const rot = n > 1 ? Math.min(6, 22 / (n - 1)) : 0
  const width = n > 4 ? 34 : n > 2 ? 40 : 52

  return (
    <Fan $step={step} $rot={rot} aria-hidden="true">
      {tiles.map(({ item, games }, i) => (
        <Tile key={item.id} $width={width} style={{ '--k': i - mid, zIndex: n - Math.round(Math.abs(i - mid) * 2) }}>
          {item.primary_image_url ? (
            <img src={withAutoOrient(item.primary_image_url)} alt="" loading="lazy" />
          ) : (
            <NoImg><span className="material-symbols-outlined">confirmation_number</span></NoImg>
          )}
          <GameTag>{shortGameLabel(games)}</GameTag>
        </Tile>
      ))}
    </Fan>
  )
}
