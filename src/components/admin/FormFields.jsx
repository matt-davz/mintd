import styled from 'styled-components'

// ─── Layout ───────────────────────────────────────────────────────────────────

export const PageHeading = styled.div`
  margin-bottom: var(--space-8);
`

export const PageTitle = styled.h1`
  font-family: var(--font-headline);
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-on-surface);
  margin-bottom: var(--space-2);
`

export const PageSub = styled.p`
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: rgba(229, 226, 225, 0.4);
`

export const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 64rem;
`

export const Section = styled.div`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.12);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
`

export const SectionLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-4);
`

// ─── Grid + Fields ────────────────────────────────────────────────────────────

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4) var(--space-6);

  @media (min-width: 640px) { grid-template-columns: repeat(3, 1fr); }
  @media (min-width: 900px) { grid-template-columns: repeat(4, 1fr); }
`

export const Field = styled.div``

export const FullField = styled(Field)`
  grid-column: 1 / -1;
`

export const FieldLabel = styled.label`
  display: block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-1);
`

// ─── Inputs ───────────────────────────────────────────────────────────────────

export const EditInput = styled.input`
  width: 100%;
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  color: var(--color-on-surface);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  padding: var(--space-2) var(--space-3);
  transition: border-color var(--transition-base);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.5);
  }
  &:disabled { opacity: 0.3; }
`

export const EditInputLarge = styled(EditInput)`
  font-family: var(--font-headline);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
`

export const EditTextarea = styled.textarea`
  width: 100%;
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  color: var(--color-on-surface);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.6;
  padding: var(--space-2) var(--space-3);
  resize: vertical;
  min-height: 5rem;
  transition: border-color var(--transition-base);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.5);
  }
`

export const EditSelect = styled.select`
  width: 100%;
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  color: var(--color-on-surface);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  padding: var(--space-2) var(--space-3);
  transition: border-color var(--transition-base);
  cursor: pointer;

  option { background-color: var(--color-surface-low); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.5);
  }
`

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  padding: var(--space-1) 0;

  input[type='checkbox'] {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-primary);
    cursor: pointer;
    flex-shrink: 0;
  }
`

// ─── Actions ──────────────────────────────────────────────────────────────────

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-2);
`

export const SaveBtn = styled.button`
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  color: var(--color-on-primary);
  font-family: var(--font-headline);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: opacity var(--transition-base);

  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

export const CancelBtn = styled.button`
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-high);
  color: rgba(229, 226, 225, 0.6);
  font-family: var(--font-headline);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: color var(--transition-base), background-color var(--transition-base);

  &:hover { color: var(--color-on-surface); background-color: var(--color-surface-bright); }
`

export const ErrorBanner = styled.div`
  padding: var(--space-3) var(--space-4);
  background-color: rgba(147, 0, 10, 0.15);
  border: 1px solid rgba(255, 180, 171, 0.15);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: #ffb4ab;
`
