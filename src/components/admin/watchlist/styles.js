import styled, { css } from 'styled-components'

// Shared styled primitives for the admin auction watchlist.

export const Mono = styled.span`
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
`

const badgeTones = {
  gold: css`
    background-color: var(--color-secondary-container);
    color: var(--color-secondary-fixed);
  `,
  blue: css`
    background-color: rgba(173, 198, 255, 0.12);
    color: var(--color-primary);
  `,
  violet: css`
    background-color: rgba(203, 190, 255, 0.12);
    color: var(--color-tertiary);
  `,
  warn: css`
    background-color: rgba(232, 195, 87, 0.12);
    color: var(--color-secondary);
  `,
  error: css`
    background-color: rgba(147, 0, 10, 0.25);
    color: var(--color-error);
  `,
  muted: css`
    background-color: var(--color-surface-highest);
    color: var(--color-on-surface-variant);
  `,
}

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  white-space: nowrap;
  ${({ $tone = 'muted' }) => badgeTones[$tone]}

  .material-symbols-outlined { font-size: 0.75rem; }
`

export const GhostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid rgba(66, 71, 84, 0.6);
  background: transparent;
  color: var(--color-primary);
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--transition-base), color var(--transition-base);

  .material-symbols-outlined { font-size: 1rem; }

  &:hover:not(:disabled) { background-color: var(--color-surface-high); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }

  ${({ $danger }) => $danger && css`
    color: var(--color-error);
  `}
`

export const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  color: var(--color-outline);
  cursor: pointer;
  transition: background-color var(--transition-base), color var(--transition-base);

  .material-symbols-outlined { font-size: 1.125rem; }

  &:hover:not(:disabled) {
    background-color: var(--color-surface-highest);
    color: ${({ $danger }) => ($danger ? 'var(--color-error)' : 'var(--color-on-surface)')};
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

export const StateBox = styled.div`
  background-color: var(--color-surface-low);
  border-radius: var(--radius-lg);
  padding: var(--space-10) var(--space-6);
  text-align: center;
  color: var(--color-on-surface-variant);
  font-size: 0.875rem;

  .material-symbols-outlined {
    display: block;
    font-size: 2rem;
    margin-bottom: var(--space-3);
    color: var(--color-outline);
  }
`

export const Hint = styled.p`
  font-size: 0.75rem;
  color: var(--color-outline);
  line-height: 1.5;
`
