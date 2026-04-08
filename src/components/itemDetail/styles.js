import styled from 'styled-components'

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4) var(--space-8);

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }
`

export const DetailRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`

export const DetailLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
`

export const DetailValue = styled.span`
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  color: var(--color-on-surface);
  letter-spacing: -0.02em;
`

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  grid-column: 1 / -1;
`

export const Tag = styled.span`
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-primary);
  background: rgba(77, 142, 255, 0.1);
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
`

export const SectionHeading = styled.h3`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-4);
`

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`

export function formatEnum(val) {
  if (!val) return null
  return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function formatDate(val) {
  if (!val) return null
  const d = new Date(val + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatMoney(val) {
  if (val == null || val === '') return null
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}
