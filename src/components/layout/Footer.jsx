import { Link } from 'react-router-dom'
import styled from 'styled-components'

const FooterWrapper = styled.footer`
  margin-top: 6rem;
  background-color: var(--color-surface-lowest);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 6rem 2rem;
`

const Inner = styled.div`
  max-width: 1536px;
  margin: 0 auto;
`

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 4rem;
  align-items: start;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`

const Heading = styled.h2`
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.04em;
  text-transform: uppercase;
  line-height: 1.1;
  color: var(--color-on-background);
  margin-bottom: 1.5rem;
`

const SubText = styled.p`
  font-family: var(--font-body);
  color: var(--color-on-surface-variant);
  max-width: 28rem;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
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
  margin-bottom: 1rem;

  .material-symbols-outlined {
    color: var(--color-primary);
    font-size: 1.25rem;
  }
`

const FormCard = styled.div`
  background-color: var(--color-surface);
  border-radius: 0.75rem;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`

const Label = styled.label`
  display: block;
  font-family: var(--font-headline);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 0.5rem;
`

const Input = styled.input`
  width: 100%;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  color: #fff;
  font-family: var(--font-body);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s, background 0.2s;

  &::placeholder {
    color: #374151;
  }

  &:focus {
    border-color: rgba(173, 198, 255, 0.5);
    background: var(--color-surface-high);
  }
`

const Textarea = styled.textarea`
  width: 100%;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  color: #fff;
  font-family: var(--font-body);
  font-size: 0.875rem;
  outline: none;
  resize: vertical;
  min-height: 7rem;
  transition: border-color 0.2s, background 0.2s;

  &::placeholder {
    color: #374151;
  }

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
  padding: 1.25rem;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
  transition: filter 0.2s;

  &:hover {
    filter: brightness(1.1);
  }
`

const BottomBar = styled.div`
  max-width: 1536px;
  margin: 6rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.2em;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`

const BottomLinks = styled.div`
  display: flex;
  gap: 2rem;

  a {
    transition: color 0.2s;
    &:hover {
      color: var(--color-primary);
    }
  }
`

export function Footer() {
  return (
    <FooterWrapper>
      <Inner>
        <TopGrid>
          <div>
            <Heading>Have Questions?<br />Inquire Now.</Heading>
            <SubText>
              Contact us for any inquires, that be to acquire memorbillia or if you think you have a piece that would fit with this collection as we are looking to expand our collection.
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
                <Label htmlFor="footer-name">Full Name</Label>
                <Input id="footer-name" type="text" placeholder="Your name" />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="footer-email">Email Address</Label>
                <Input id="footer-email" type="email" placeholder="client@vault.com" />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="footer-message">Message</Label>
                <Textarea id="footer-message" placeholder="Your inquiry..." />
              </FormGroup>
              <SubmitButton type="submit">Send Message</SubmitButton>
            </form>
          </FormCard>
        </TopGrid>

        <BottomBar>
          <div>© 2024 MINTD ARCHIVE. ALL RIGHTS RESERVED.</div>
          <BottomLinks>
            <Link to="#">Privacy Policy</Link>
            <Link to="#">Terms of Service</Link>
            <Link to="#">Security Protocol</Link>
          </BottomLinks>
        </BottomBar>
      </Inner>
    </FooterWrapper>
  )
}
