import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useSetMembers } from '../hooks/useSetMembers'

// ─── Accordion shell ──────────────────────────────────────────────────────────

const Wrap = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: var(--space-4);
  min-width: 0;
  width: 100%;
`

const Header = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  padding: var(--space-2) 0;
  cursor: pointer;
  background: none;
  border: none;
  user-select: none;
`

const Chevron = styled.span`
  font-size: 1rem;
  color: var(--color-outline);
  transition: transform 200ms ease;
  transform: rotate(${({ $open }) => $open ? '90deg' : '0deg'});
  flex-shrink: 0;
`

const HeaderLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const HeaderMeta = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  flex-shrink: 0;
`

// ─── Carousel ─────────────────────────────────────────────────────────────────

const Body = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  min-width: 0;
  overflow: hidden;
`

const NavBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-high);
  color: rgba(229, 226, 225, 0.5);
  transition: color var(--transition-base), background-color var(--transition-base);

  .material-symbols-outlined { font-size: 1rem; }

  &:hover {
    color: var(--color-on-surface);
    background-color: var(--color-surface-bright);
  }
`

const Track = styled.div`
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  flex: 1;
  min-width: 0;
  padding-bottom: 2px;
`

// ─── Cards ────────────────────────────────────────────────────────────────────

const cardBase = `
  display: flex;
  flex-direction: column;
  flex: 0 0 160px;
  cursor: pointer;
  text-decoration: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.1);
  transition: border-color var(--transition-base);

  &:hover { border-color: rgba(173, 198, 255, 0.3); }
`

const CardLink = styled(Link)`${cardBase}`

const CardBtn = styled.button`
  ${cardBase}
  text-align: left;
`

const CardImage = styled.div`
  aspect-ratio: 4/5;
  overflow: hidden;
  background-color: var(--color-surface-high);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
    filter: grayscale(20%);
    transition: opacity var(--transition-base), filter var(--transition-base), transform 500ms ease;
  }

  ${CardLink}:hover &, ${CardBtn}:hover & {
    img {
      opacity: 1;
      filter: grayscale(0%);
      transform: scale(1.04);
    }
  }

  .material-symbols-outlined {
    font-size: 2rem;
    color: var(--color-surface-bright);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
`

const CardTitle = styled.p`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding: var(--space-2) var(--space-2);
`

// ─── Component ────────────────────────────────────────────────────────────────

const SCROLL_STEP = 516 // ~3 cards at 160px + gap

export function SetMembersAccordion({ setId, currentItemId, onItemClick }) {
  const [open, setOpen] = useState(true)
  const { members, setName, loading } = useSetMembers(open ? setId : null, currentItemId)
  const trackRef = useRef(null)

  if (!setId) return null

  function scrollPrev() {
    trackRef.current?.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' })
  }

  function scrollNext() {
    trackRef.current?.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' })
  }

  function renderCard(m) {
    const image = m.primary_image_url ? (
      <img src={m.primary_image_url} alt={m.title} loading="lazy" />
    ) : (
      <span className="material-symbols-outlined">image_not_supported</span>
    )

    const inner = (
      <>
        <CardImage>{image}</CardImage>
        <CardTitle>{m.title}</CardTitle>
      </>
    )

    if (onItemClick) {
      return <CardBtn key={m.id} onClick={() => onItemClick(m.id)}>{inner}</CardBtn>
    }
    return <CardLink key={m.id} to={`/item/${m.id}`}>{inner}</CardLink>
  }

  return (
    <Wrap>
      <Header onClick={() => setOpen(o => !o)}>
        <Chevron $open={open} className="material-symbols-outlined">chevron_right</Chevron>
        <HeaderLabel>{setName ?? 'Other items in this set'}</HeaderLabel>
        {!open && <HeaderMeta>View set</HeaderMeta>}
      </Header>

      {open && (
        <Body>
          <NavBtn onClick={scrollPrev} aria-label="Scroll left">
            <span className="material-symbols-outlined">chevron_left</span>
          </NavBtn>
          <Track ref={trackRef}>
            {loading
              ? <HeaderMeta style={{ padding: 'var(--space-4) 0' }}>Loading...</HeaderMeta>
              : members.length === 0
                ? <HeaderMeta style={{ padding: 'var(--space-4) 0' }}>No other items</HeaderMeta>
                : members.map(renderCard)}
          </Track>
          <NavBtn onClick={scrollNext} aria-label="Scroll right">
            <span className="material-symbols-outlined">chevron_right</span>
          </NavBtn>
        </Body>
      )}
    </Wrap>
  )
}
