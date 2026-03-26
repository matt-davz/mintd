import styled from 'styled-components'

const Page = styled.div`
  max-width: 1536px;
  margin: 0 auto;
  padding: var(--space-24) var(--space-8);
`

const PageLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: var(--space-4);
`

const PageHeading = styled.h1`
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: clamp(3rem, 8vw, 6rem);
  letter-spacing: -0.04em;
  text-transform: uppercase;
  line-height: 1;
  color: var(--color-on-background);
  margin-bottom: var(--space-6);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-16);
  align-items: start;
  margin-top: var(--space-16);

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`

const SubText = styled.p`
  font-family: var(--font-body);
  color: var(--color-on-surface-variant);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 28rem;
  margin-bottom: var(--space-8);
`

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #9ca3af;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-4);

  .material-symbols-outlined {
    color: var(--color-primary);
    font-size: 1.25rem;
  }
`

const FormCard = styled.div`
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  border: 1px solid rgba(255, 255, 255, 0.05);
`

const FormGroup = styled.div`
  margin-bottom: var(--space-6);
`

const Label = styled.label`
  display: block;
  font-family: var(--font-headline);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: var(--space-2);
  transition: color var(--transition-base);
`

const Input = styled.input`
  width: 100%;
  background: var(--color-surface-lowest);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  color: var(--color-on-background);
  font-family: var(--font-body);
  font-size: 0.875rem;
  outline: none;
  transition: border-color var(--transition-base), background var(--transition-base);

  &::placeholder { color: #374151; }

  &:focus {
    border-color: rgba(173, 198, 255, 0.5);
    background: var(--color-surface-high);
  }
`

const Textarea = styled.textarea`
  width: 100%;
  background: var(--color-surface-lowest);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  color: var(--color-on-background);
  font-family: var(--font-body);
  font-size: 0.875rem;
  outline: none;
  resize: vertical;
  min-height: 8rem;
  transition: border-color var(--transition-base), background var(--transition-base);

  &::placeholder { color: #374151; }

  &:focus {
    border-color: rgba(173, 198, 255, 0.5);
    background: var(--color-surface-high);
  }
`

const SubmitButton = styled.button`
  width: 100%;
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: 0.875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: var(--space-5);
  border-radius: var(--radius-md);
  margin-top: var(--space-2);
  transition: filter var(--transition-base);

  &:hover { filter: brightness(1.1); }
`

export default function Contact() {
  return (
    <Page>
      <PageLabel>Get in touch</PageLabel>
      <PageHeading>Inquire<br />Now.</PageHeading>

      <Grid>
        <div>
          <SubText>
            Contact us for any inquiries, whether to acquire memorabilia or if
            you think you have a piece that would fit this collection — we are
            always looking to expand.
          </SubText>
          <ContactItem>
            <span className="material-symbols-outlined">mail</span>
            info@mintd.com
          </ContactItem>
          <ContactItem>
            <span className="material-symbols-outlined">call</span>
            +1 (888) 555-0192
          </ContactItem>
        </div>

        <FormCard>
          <form onSubmit={(e) => e.preventDefault()}>
            <FormGroup>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="Your name" />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="client@vault.com" />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" placeholder="+1 (000) 000-0000" />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your inquiry..." />
            </FormGroup>
            <SubmitButton type="submit">Send Message</SubmitButton>
          </form>
        </FormCard>
      </Grid>
    </Page>
  )
}
