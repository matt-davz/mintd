import { Link } from 'react-router-dom'
import styled from 'styled-components'

const Page = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-24) var(--space-8);
  text-align: center;
`

const Code = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: var(--space-4);
`

const Heading = styled.h1`
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: clamp(5rem, 20vw, 14rem);
  letter-spacing: -0.05em;
  line-height: 1;
  color: var(--color-surface-high);
  margin-bottom: var(--space-6);
  user-select: none;
`

const SubText = styled.p`
  font-family: var(--font-body);
  color: var(--color-on-surface-variant);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 24rem;
  margin-bottom: var(--space-10);
`

const BackLink = styled(Link)`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  transition: gap var(--transition-base);

  &:hover {
    gap: var(--space-3);
  }

  .material-symbols-outlined {
    font-size: 1rem;
  }
`

export default function NotFound() {
  return (
    <Page>
      <Code>Error 404</Code>
      <Heading>404</Heading>
      <SubText>
        This asset has been moved, delisted, or never existed in the archive.
      </SubText>
      <BackLink to="/">
        <span className="material-symbols-outlined">arrow_back</span>
        Return to the Archive
      </BackLink>
    </Page>
  )
}
