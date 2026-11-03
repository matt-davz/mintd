import styled from 'styled-components'

const TIERS = {
  finest: {
    label: '1/1 Finest',
    bg: '#92400e',
    fg: '#fbbf24',
    border: 'rgba(251, 191, 36, 0.4)',
  },
}

export function getRarityTier(popHigher, popSame) {
  if (popHigher == null || popSame == null) return null
  if (popHigher === 0 && popSame <= 1) return 'finest'
  return null
}

const Base = styled.span`
  display: inline-block;
  background-color: ${p => TIERS[p.$tier]?.bg};
  color: ${p => TIERS[p.$tier]?.fg};
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid ${p => TIERS[p.$tier]?.border};
`

export function RarityBadge({ popHigher, popSame, className }) {
  const tier = getRarityTier(popHigher, popSame)
  if (!tier) return null
  return (
    <Base className={className} $tier={tier}>
      {TIERS[tier].label}
    </Base>
  )
}
