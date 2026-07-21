import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useItem } from '../../hooks/useItem'
import { withAutoOrient } from '../../lib/cloudinary'
import { gradeColors, displayGrade } from '../../utils/gradeColors'
import { formatEnum } from '../itemDetail/styles'
import { SignatoryList } from './SignatoryList'
import { ItemTypeDetails } from '../itemDetail/ItemTypeDetails'
import { SeriesTicketsAccordion } from '../SeriesTicketsAccordion'
import { SetMembersAccordion } from '../SetMembersAccordion'
import { ImageLightbox } from '../ImageLightbox'

// ─── Overlay ────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(14, 14, 14, 0.9);
  backdrop-filter: blur(12px);
  animation: fadeIn 200ms ease-out;

  @media (min-width: 768px) {
    padding: 2rem;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 64rem;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: rgba(28, 27, 27, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(173, 198, 255, 0.15);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
  animation: slideIn 220ms cubic-bezier(0.2, 0, 0.2, 1);

  @media (min-width: 768px) {
    flex-direction: row;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`

const CloseBtn = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 20;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-full);
  background: var(--color-surface-high);
  border: none;
  color: var(--color-on-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-base);

  &:hover { background: rgba(173, 198, 255, 0.2); }

  .material-symbols-outlined { font-size: 1.375rem; }
`

// ─── Image section ──────────────────────────────────────────────────────────

const ImageSection = styled.div`
  position: relative;
  width: 100%;
  height: 16rem;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--color-surface-low);
  cursor: pointer;

  @media (min-width: 768px) {
    width: 50%;
    height: auto;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-surface-bright);

  .material-symbols-outlined { font-size: 3rem; }
`

const ImageGradient = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  background: linear-gradient(to top, var(--color-surface-lowest), transparent);
  pointer-events: none;
`

const VerifiedRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`

const PulseDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  animation: pulse 1.6s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
`

const VerifiedLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.2em;
`

const ImageNav = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $dir }) => $dir === 'prev' ? 'left: 0.75rem;' : 'right: 0.75rem;'}
  z-index: 5;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-full);
  background: rgba(14, 14, 14, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-on-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-base);

  &:hover { background: rgba(173, 198, 255, 0.25); }

  .material-symbols-outlined { font-size: 1.25rem; }
`

// ─── Details section ────────────────────────────────────────────────────────

const DetailsSection = styled.div`
  width: 100%;
  padding: var(--space-8);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);

  @media (min-width: 768px) {
    width: 50%;
    padding: var(--space-12);
  }
`

const TitleBlock = styled.div``

const LegendaryBadge = styled.div`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  background: rgba(77, 142, 255, 0.1);
  border: 1px solid rgba(77, 142, 255, 0.2);
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: var(--space-4);
`

const Title = styled.h2`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2rem);
  letter-spacing: -0.03em;
  text-transform: uppercase;
  line-height: 1.1;
  color: var(--color-on-surface);
  margin-bottom: var(--space-2);
`

const Subtitle = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  padding: var(--space-6) 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`

const StatLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-1);
`

const StatValue = styled.p`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 1.125rem;
  color: ${({ $accent }) => $accent === 'primary' ? 'var(--color-primary)' : 'var(--color-on-surface)'};
`

const StatLink = styled.a`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
`

const SignatoriesRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`

const SectionLabel = styled.h4`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: var(--space-3);
`

const Description = styled.p`
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-on-surface-variant);
`

const ActionsRow = styled.div`
  margin-top: auto;
  display: flex;
  gap: var(--space-4);
`

const ViewFullBtn = styled(Link)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
  font-family: var(--font-headline);
  font-weight: 700;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  text-decoration: none;
  transition: background var(--transition-base);

  &:hover { background: #3d7ae8; }
`

const ShareBtn = styled.button`
  width: 3.5rem;
  height: 3.5rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-on-surface);
  cursor: pointer;
  transition: background var(--transition-base);

  &:hover { background: var(--color-surface-high); }

  .material-symbols-outlined { font-size: 1.25rem; }
`

const StatusText = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-outline);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: var(--space-24) 0;
  text-align: center;
  width: 100%;
`

// Combines cert item_grade + auto_grade into a single display string, mirroring
// the logic on the item detail page.
function formatGradeLabel(cert) {
  if (!cert) return null
  const { item_grade, auto_grade } = cert
  if (item_grade && auto_grade && !item_grade.toLowerCase().includes('auto')) {
    return `${displayGrade(item_grade)} / Auto ${displayGrade(auto_grade)}`
  }
  const raw = item_grade ?? auto_grade ?? null
  return raw ? displayGrade(raw) : null
}

function gradeColorSource(cert) {
  if (!cert) return null
  return cert.item_grade && cert.auto_grade ? cert.auto_grade : (cert.item_grade ?? cert.auto_grade)
}

export function ItemViewerModal({ itemId, onClose }) {
  const { item, signatories, certifications, population, images, detail, gameContext, loading, error } = useItem(itemId)
  const [activeImage, setActiveImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => { setActiveImage(0) }, [itemId])

  const primaryImage = images.find(i => i.is_primary) ?? images[0]
  const otherImages = images.filter(i => i.id !== primaryImage?.id)
  const allImages = [primaryImage, ...otherImages].filter(Boolean)
  const currentImage = allImages[activeImage] ?? null

  const psaCerts = certifications.filter(c => ['PSA', 'PSA/DNA'].includes(c.cert_service))
  const firstCert = psaCerts[0] ?? certifications[0]
  const pop = firstCert ? population.find(p => p.cert_id === firstCert.id) : null

  const gradeLabel = formatGradeLabel(firstCert)

  return createPortal(
    <Overlay onClick={(e) => { e.stopPropagation(); onClose() }}>
      <Card onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </CloseBtn>

        {loading && <StatusText>Loading...</StatusText>}
        {!loading && (error || !item) && <StatusText>{error ?? 'Item not found.'}</StatusText>}

        {!loading && item && (
          <>
            <ImageSection onClick={() => currentImage && setLightboxOpen(true)}>
              {currentImage ? (
                <img src={withAutoOrient(currentImage.cloudinary_url)} alt={item.title} />
              ) : (
                <ImagePlaceholder>
                  <span className="material-symbols-outlined">image_not_supported</span>
                </ImagePlaceholder>
              )}

              {allImages.length > 1 && (
                <>
                  <ImageNav
                    $dir="prev"
                    onClick={(e) => { e.stopPropagation(); setActiveImage(i => (i - 1 + allImages.length) % allImages.length) }}
                    aria-label="Previous image"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </ImageNav>
                  <ImageNav
                    $dir="next"
                    onClick={(e) => { e.stopPropagation(); setActiveImage(i => (i + 1) % allImages.length) }}
                    aria-label="Next image"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </ImageNav>
                </>
              )}

              <ImageGradient>
                <VerifiedRow>
                  <PulseDot />
                  <VerifiedLabel>Digital Curator Verified</VerifiedLabel>
                </VerifiedRow>
              </ImageGradient>
            </ImageSection>

            <DetailsSection>
              <TitleBlock>
                {item.is_legendary && <LegendaryBadge>Legendary Status</LegendaryBadge>}
                <Title>{item.museum_title || item.title}</Title>
                <Subtitle>
                  {[formatEnum(item.item_type), item.season_year].filter(Boolean).join(' · ')}
                </Subtitle>
              </TitleBlock>

              {(gradeLabel || pop || firstCert?.cert_id) && (
                <StatsGrid>
                  <div>
                    <StatLabel>Grade</StatLabel>
                    <StatValue $accent="primary" style={gradeLabel ? gradeColors(gradeColorSource(firstCert), firstCert?.cert_service) : undefined}>
                      {gradeLabel ?? '—'}
                    </StatValue>
                  </div>
                  <div>
                    <StatLabel>Population</StatLabel>
                    <StatValue>{pop ? Number(pop.total).toLocaleString() : '—'}</StatValue>
                  </div>
                  <div>
                    <StatLabel>Cert ID</StatLabel>
                    {firstCert?.cert_id ? (
                      firstCert.cert_link ? (
                        <StatLink href={firstCert.cert_link} target="_blank" rel="noopener noreferrer">#{firstCert.cert_id}</StatLink>
                      ) : (
                        <StatValue>#{firstCert.cert_id}</StatValue>
                      )
                    ) : (
                      <StatValue>—</StatValue>
                    )}
                  </div>
                </StatsGrid>
              )}

              {signatories.length > 0 && (
                <SignatoriesRow>
                  <SignatoryList signatories={signatories} />
                </SignatoriesRow>
              )}

              <ItemTypeDetails
                itemType={item.item_type}
                detail={detail}
                gameContext={gameContext}
                item={item}
              />

              {item.description && (
                <div>
                  <SectionLabel>Description</SectionLabel>
                  <Description>{item.description}</Description>
                </div>
              )}

              {item.item_type === 'ticket' && gameContext?.season_year && gameContext?.series_game_number != null && (
                <SeriesTicketsAccordion seasonYear={gameContext.season_year} currentItemId={itemId} />
              )}

              {item.set_id && (
                <SetMembersAccordion setId={item.set_id} currentItemId={itemId} />
              )}

              <ActionsRow>
                <ViewFullBtn to={`/item/${itemId}`}>View Full Details</ViewFullBtn>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <ShareBtn
                    onClick={() => navigator.share({ title: item.title, url: `${window.location.origin}/item/${itemId}` }).catch(() => {})}
                    aria-label="Share"
                  >
                    <span className="material-symbols-outlined">share</span>
                  </ShareBtn>
                )}
              </ActionsRow>
            </DetailsSection>
          </>
        )}
      </Card>

      {lightboxOpen && allImages.length > 0 && (
        <ImageLightbox
          images={allImages}
          initialIndex={activeImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </Overlay>,
    document.body
  )
}
