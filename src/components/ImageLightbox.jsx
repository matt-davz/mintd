import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
`

const ImgWrap = styled.div`
  position: relative;
  display: inline-flex;
  border-radius: var(--radius-md);
`

const Img = styled.img`
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.8);
  user-select: none;
  display: block;
  transition: transform 300ms ease;
`

const CloseBtn = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-on-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-base);

  &:hover { background: rgba(255, 255, 255, 0.12); }

  .material-symbols-outlined { font-size: 1.5rem; }
`

const NavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $dir }) => $dir === 'prev' ? 'left: 1.5rem;' : 'right: 1.5rem;'}
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-on-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-base);

  &:hover { background: rgba(255, 255, 255, 0.12); }

  .material-symbols-outlined { font-size: 1.5rem; }
`

const RotateControls = styled.div`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  display: flex;
  gap: 0.5rem;
`

const RotateBtn = styled.button`
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-on-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-base);

  &:hover { background: rgba(255, 255, 255, 0.12); }

  .material-symbols-outlined { font-size: 1.25rem; }
`

/**
 * Fullscreen image lightbox with full-image zoom and multi-image navigation.
 *
 * @param {{ images: Array<{ id: string, cloudinary_url: string }>, initialIndex?: number, onClose: () => void }} props
 */
export function ImageLightbox({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex)
  const [rotation, setRotation] = useState(0)

  const total = images.length
  const current = images[index] ?? null

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.stopImmediatePropagation()
      }
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && total > 1) {
        setIndex(i => (i - 1 + total) % total)
        setRotation(0)
      }
      if (e.key === 'ArrowRight' && total > 1) {
        setIndex(i => (i + 1) % total)
        setRotation(0)
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [total, onClose])

  if (!current) return null

  return createPortal(
    <Overlay onClick={(e) => { e.stopPropagation(); onClose() }}>
      <ImgWrap onClick={(e) => e.stopPropagation()}>
        <Img
          src={current.cloudinary_url}
          alt=""
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </ImgWrap>
      <RotateControls onClick={(e) => e.stopPropagation()}>
        <RotateBtn onClick={() => setRotation(r => r - 22.5)} title="Rotate left">
          <span className="material-symbols-outlined">rotate_left</span>
        </RotateBtn>
        <RotateBtn onClick={() => setRotation(r => r + 22.5)} title="Rotate right">
          <span className="material-symbols-outlined">rotate_right</span>
        </RotateBtn>
      </RotateControls>
      <CloseBtn onClick={(e) => { e.stopPropagation(); onClose() }}>
        <span className="material-symbols-outlined">close</span>
      </CloseBtn>
      {total > 1 && (
        <>
          <NavBtn
            $dir="prev"
            onClick={(e) => {
              e.stopPropagation()
              setIndex(i => (i - 1 + total) % total)
              setRotation(0)
            }}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </NavBtn>
          <NavBtn
            $dir="next"
            onClick={(e) => {
              e.stopPropagation()
              setIndex(i => (i + 1) % total)
              setRotation(0)
            }}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </NavBtn>
        </>
      )}
    </Overlay>,
    document.body
  )
}
