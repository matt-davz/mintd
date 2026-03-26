import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`

const Label = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-2);
`

const Name = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-headline);
  font-size: 1rem;
  font-weight: 600;
  color: ${({ $featured }) => $featured ? 'var(--color-secondary-fixed)' : 'var(--color-on-surface-variant)'};
  text-transform: uppercase;
  letter-spacing: 0.05em;

  .material-symbols-outlined {
    font-size: 0.875rem;
    color: var(--color-secondary-fixed);
  }
`

export function SignatoryList({ signatories }) {
  if (!signatories.length) return null

  return (
    <Wrapper>
      <Label>{signatories.length === 1 ? 'Signatory' : 'Signatories'}</Label>
      {signatories.map(s => (
        <Name key={s.id} $featured={s.is_featured}>
          {s.is_featured && (
            <span className="material-symbols-outlined">verified</span>
          )}
          {s.name}
        </Name>
      ))}
    </Wrapper>
  )
}
