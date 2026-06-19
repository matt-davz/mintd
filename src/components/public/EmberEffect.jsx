import { useEffect, useRef } from 'react'
import styled from 'styled-components'

const Wrap = styled.div`
  position: absolute;
  bottom: 0;
  left: ${({ $spread }) => -$spread}px;
  right: ${({ $spread }) => -$spread}px;
  height: ${({ $height }) => $height}px;
  pointer-events: none;
  z-index: ${({ $zIndex }) => $zIndex};
  overflow: visible;
`

export function EmberEffect({ height = 150, intensity = 6, zIndex = 1, spread = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const container = ref.current
    if (!container) return

    const intervalMs = Math.round(1000 / intensity)

    const spawn = () => {
      const p = document.createElement('div')
      const size = Math.random() * 3.5 + 1.5
      // Distribute across the full container width including any spread expansion
      const left = Math.random() * 100
      // Background (spread > 0) embers drift further and arch outward from center
      const driftRange = spread > 0 ? 80 + spread * 1.2 : 55
      const drift = (Math.random() - 0.5) * driftRange
      const duration = Math.random() * 2.5 + 2
      const delay = Math.random() * 0.35

      Object.assign(p.style, {
        position: 'absolute',
        bottom: '0',
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: '#3B82F6',
        filter: `blur(${size > 3 ? 1.5 : 1}px) drop-shadow(0 0 3px #3B82F6)`,
        pointerEvents: 'none',
      })

      container.appendChild(p)

      p.animate(
        [
          { transform: 'translateY(0) translateX(0)', opacity: 0 },
          { opacity: 0.85, offset: 0.2 },
          { opacity: 1, offset: 0.5 },
          { transform: `translateY(-${height}px) translateX(${drift}px)`, opacity: 0 },
        ],
        {
          duration: duration * 1000,
          delay: delay * 1000,
          easing: 'ease-out',
        }
      )

      setTimeout(() => p.remove(), (duration + delay + 0.15) * 1000)
    }

    const id = setInterval(spawn, intervalMs)
    return () => clearInterval(id)
  }, [height, intensity, spread])

  return <Wrap ref={ref} $height={height} $zIndex={zIndex} $spread={spread} />
}
