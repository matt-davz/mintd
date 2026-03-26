import { Link } from 'react-router-dom'
import styled from 'styled-components'

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  background-color: #121212;
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 300ms cubic-bezier(0.2, 0, 0.2, 1), background-color var(--transition-base);
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    background-color: #1a1a1a;
  }
`

const ImageWrapper = styled.div`
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background-color: var(--color-surface-lowest);
`

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
  transition: transform 700ms cubic-bezier(0.2, 0, 0.2, 1);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05);

  ${Card}:hover & {
    transform: scale(1.05);
  }
`

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-surface-bright);

  .material-symbols-outlined {
    font-size: 3rem;
  }
`

const ForSaleBadge = styled.span`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 0.25rem 0.5rem;
`

const GradeBadge = styled.div`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: var(--color-secondary-container);
  color: var(--color-secondary-fixed);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 224, 141, 0.2);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
`

const Body = styled.div`
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  flex: 1;
`

const Title = styled.h3`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 1.0625rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-transform: uppercase;
  color: var(--color-on-background);
  margin-bottom: var(--space-1);
`

const Signer = styled.div`
  font-family: var(--font-body);
  font-size: 0.625rem;
  color: var(--color-primary);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-variant: small-caps;
  margin-bottom: var(--space-4);
`

const Footer = styled.div`
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`

const CertId = styled.div`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  color: #6b7280;
  letter-spacing: -0.02em;
  text-transform: uppercase;
`

const Price = styled.div`
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: 1rem;
  color: var(--color-on-background);
`

export function ItemCard({ item }) {
  const {
    id,
    title,
    primary_image_url,
    featured_signer,
    signatory_count,
    cert_grade,
    cert_grader,
    cert_number,
    for_sale,
    price,
  } = item

  const gradeLabel = cert_grade
    ? `${cert_grader ?? ''} ${cert_grade}`.trim()
    : null

  const signerDisplay = featured_signer
    ? signatory_count > 1
      ? `${featured_signer} +${signatory_count - 1} others`
      : featured_signer
    : null

  const certDisplay = cert_number ? `Cert ID: ${cert_number}` : null

  const priceDisplay = price
    ? `$${Number(price).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })}`
    : null

  return (
    <Card to={`/item/${id}`}>
      <ImageWrapper>
        {primary_image_url ? (
          <Image src={primary_image_url} alt={title} loading="lazy" />
        ) : (
          <ImagePlaceholder>
            <span className="material-symbols-outlined">image_not_supported</span>
          </ImagePlaceholder>
        )}
        {for_sale && <ForSaleBadge>For Sale</ForSaleBadge>}
        {gradeLabel && <GradeBadge>{gradeLabel}</GradeBadge>}
      </ImageWrapper>

      <Body>
        <Title>{title}</Title>
        {signerDisplay && <Signer>{signerDisplay}</Signer>}
        <Footer>
          <CertId>{certDisplay}</CertId>
          {priceDisplay && <Price>{priceDisplay}</Price>}
        </Footer>
      </Body>
    </Card>
  )
}
