import styled from 'styled-components'

const TIERS = {
  one_of_one: {
    label: '1/1',
    bg: '#92400e',
    fg: '#fbbf24',
    border: 'rgba(251, 191, 36, 0.4)',
  },
  finest: {
    label: 'Finest',
    bg: '#0f2847',
    fg: '#adc6ff',
    border: 'rgba(173, 198, 255, 0.4)',
  },
}

export function getRarityBadges(isOneOfOne, isFinest) {
  const badges = []
  if (isOneOfOne) badges.push('one_of_one')
  if (isFinest) badges.push('finest')
  return badges
}

const Wrapper = styled.span`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`

const Badge = styled.span`
  display: inline-block;
  background-color: ${p => TIERS[p.$tier].bg};
  color: ${p => TIERS[p.$tier].fg};
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid ${p => TIERS[p.$tier].border};
`

export function RarityBadge({ isOneOfOne, isFinest, className }) {
  const badges = getRarityBadges(isOneOfOne, isFinest)
  if (!badges.length) return null
  return (
    <Wrapper className={className}>
      {badges.map(tier => (
        <Badge key={tier} $tier={tier}>
          {TIERS[tier].label}
        </Badge>
      ))}
    </Wrapper>
  )
}
