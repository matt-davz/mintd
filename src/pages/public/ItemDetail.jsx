import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import styled from 'styled-components'
import { Carousel } from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import { withAutoOrient } from '../../lib/cloudinary'
import { useItem } from '../../hooks/useItem'
import { useItems } from '../../hooks/useItems'
import { SignatoryList } from '../../components/public/SignatoryList'
import { ItemTypeDetails } from '../../components/itemDetail/ItemTypeDetails'
import { ImageLightbox } from '../../components/ImageLightbox'
import { SetMembersAccordion } from '../../components/SetMembersAccordion'
import { DuplicateCopiesSection } from '../../components/public/DuplicateCopiesSection'
import { gradeColors } from '../../utils/gradeColors'

// ─── Layout ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 1536px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-8) var(--space-24);
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-10);
  transition: color var(--transition-base);

  &:hover { color: var(--color-primary); }

  .material-symbols-outlined { font-size: 0.875rem; }
`

const ContentWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  max-width: 1200px;
  min-height: 50vh;
  margin: 0 auto;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-12);
  align-items: start;

  @media (min-width: 768px) {
    grid-template-columns: auto 1fr;
  }
`

// ─── Image column ─────────────────────────────────────────────────────────────

const ImageCol = styled.div`
  position: relative;
  width: 300px;
  min-width: 300px;
`

const ImageGlow = styled.div`
  position: absolute;
  inset: -1rem;
  background: rgba(77, 142, 255, 0.04);
  border-radius: var(--radius-lg);
  filter: blur(3rem);
  pointer-events: none;
`

const ImageFrame = styled.div`
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--color-surface-low);
  border: 1px solid rgba(66, 71, 84, 0.1);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
`


const ImagePlaceholder = styled.div`
  aspect-ratio: 4/5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-surface-bright);

  .material-symbols-outlined { font-size: 4rem; }
`




const CarouselWrap = styled.div`
  .carousel .slide img {
    max-height: 40vh;
    object-fit: contain;
  }
`

// ─── Lightbox ─────────────────────────────────────────────────────────────────
// Shared <ImageLightbox> component handles fullscreen viewing

// ─── Detail column ────────────────────────────────────────────────────────────

const DetailCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  min-width: 0;
`

const TitleSection = styled.section``

const PageLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-3);
`

const Title = styled.h1`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  letter-spacing: -0.03em;
  text-transform: uppercase;
  line-height: 1.05;
  color: var(--color-on-surface);
  margin-bottom: var(--space-6);
`

const ForSaleBadge = styled.span`
  display: inline-block;
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  margin-bottom: var(--space-4);
`

const DataRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`

const DataLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
`

const DataValue = styled.span`
  font-family: var(--font-mono);
  font-size: 1.25rem;
  color: ${({ $accent }) => $accent === 'primary' ? 'var(--color-primary)' : $accent === 'gold' ? 'var(--color-secondary-fixed)' : 'var(--color-on-surface)'};
  letter-spacing: -0.02em;
`

const DataGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`

// ─── Population section ───────────────────────────────────────────────────────

const PopSection = styled.section``

const SectionLabel = styled.h3`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-4);
`

const TotalPop = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
`

const TotalNum = styled.span`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 3rem;
  letter-spacing: -0.04em;
  color: var(--color-on-surface);
`

const TotalLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
`

const PopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-radius: var(--radius-md);
  border: 1px solid rgba(66, 71, 84, 0.1);
  overflow: hidden;
`

const PopCell = styled.div`
  padding: var(--space-5);
  text-align: center;
  background-color: ${({ $type }) =>
    $type === 'higher' ? 'rgba(147, 0, 10, 0.15)' :
    $type === 'same'   ? 'rgba(77, 142, 255, 0.15)' :
    'var(--color-surface)'};
  border-right: ${({ $last }) => $last ? 'none' : '1px solid rgba(66, 71, 84, 0.05)'};
  transition: background-color var(--transition-base);

  &:hover {
    background-color: ${({ $type }) =>
      $type === 'higher' ? 'rgba(147, 0, 10, 0.25)' :
      $type === 'same'   ? 'rgba(77, 142, 255, 0.25)' :
      'var(--color-surface-high)'};
  }
`

const PopCellLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-2);
`

const PopCellValue = styled.p`
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ $type }) =>
    $type === 'higher' ? 'var(--color-error)' :
    $type === 'same'   ? 'var(--color-primary)' :
    'var(--color-on-surface)'};
`

// ─── Related items ─────────────────────────────────────────────────────────────

const RelatedSection = styled.section`
  margin-top: var(--space-24);
  padding-top: var(--space-12);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`

const RelatedHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-10);
  gap: var(--space-4);
  flex-wrap: wrap;
`

const RelatedTitle = styled.h2`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 1.75rem;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: var(--color-on-surface);
`

const RelatedMeta = styled.span`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-outline);
`

const RelatedGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);

  @media (min-width: 768px) { grid-template-columns: repeat(3, 1fr); }
`

const RelatedCard = styled(Link)`
  display: block;

  &:hover h4 { color: var(--color-primary); }
`

const RelatedImage = styled.div`
  aspect-ratio: 4/5;
  overflow: hidden;
  background-color: var(--color-surface-low);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  transition: border-color var(--transition-base);

  ${RelatedCard}:hover & { border-color: rgba(173, 198, 255, 0.25); }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.8;
    filter: grayscale(30%);
    transition: transform 700ms cubic-bezier(0.2,0,0.2,1), opacity var(--transition-base), filter var(--transition-base);
  }

  ${RelatedCard}:hover img {
    transform: scale(1.05);
    opacity: 1;
    filter: grayscale(0%);
  }
`

const RelatedRef = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-1);
`

const RelatedName = styled.h4`
  font-family: var(--font-headline);
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--color-on-surface);
  transition: color var(--transition-base);
`

// ─── Status ───────────────────────────────────────────────────────────────────

const StatusText = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-outline);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: var(--space-24) 0;
  text-align: center;
`

// ─── Component ────────────────────────────────────────────────────────────────


export default function ItemDetail() {
  const { id } = useParams()
  const { item, signatories, certifications, population, images, detail, gameContext, loading, error } = useItem(id)
  const { items: allItems } = useItems()

  const frameRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightbox, setLightbox] = useState({ open: false, index: 0 })

  useEffect(() => { window.scrollTo(0, 0) }, [id])

  // Derive image list early
  const primaryImage = images.find(i => i.is_primary) ?? images[0]
  const otherImages = images.filter(i => i.id !== primaryImage?.id)
  const allImages = [primaryImage, ...otherImages].filter(Boolean)

  if (loading) return <StatusText>Loading...</StatusText>
  if (error || !item) return <StatusText>{error ?? 'Item not found.'}</StatusText>

  const psaCerts = certifications.filter(c => ['PSA', 'PSA/DNA'].includes(c.cert_service))
  const firstPsaCert = psaCerts[0]
  const pop = firstPsaCert ? population.find(p => p.cert_id === firstPsaCert.id) : null

  const badgeCert = certifications.find(c => c.cert_service && c.cert_service.toLowerCase() !== 'unknown')
  const gradeLabel = badgeCert
    ? `${badgeCert.cert_service} ${badgeCert.item_grade ?? badgeCert.auto_grade ?? ''}`.trim()
    : null

  const related = allItems.filter(i => i.id !== id).slice(0, 3)

  return (
    <Page>
      <BackLink to="/">
        <span className="material-symbols-outlined">arrow_back</span>
        The Archive
      </BackLink>

      <ContentWrap>
        {/* ── Title ── */}
        <TitleSection>
          {item.for_sale && <ForSaleBadge>For Sale</ForSaleBadge>}
          <PageLabel>Collection Asset</PageLabel>
          <Title>{item.title}</Title>
        </TitleSection>

        {/* ── Image + Details side by side ── */}
        <Grid>
          <ImageCol>
            <ImageGlow />
            {allImages.length > 1 ? (
              <CarouselWrap>
                <ImageFrame
                  ref={frameRef}
                  style={{ position: 'relative' }}
                >
                  <Carousel
                    selectedItem={activeIndex}
                    onChange={(idx) => setActiveIndex(idx)}
                    showArrows
                    showThumbs
                    showStatus={false}
                    showIndicators={false}
                    infiniteLoop
                    thumbWidth={80}
                    onClickItem={() => setLightbox({ open: true, index: activeIndex })}
                  >
                    {allImages.map((img) => (
                      <div key={img.id}>
                        <img src={withAutoOrient(img.cloudinary_url)} alt={item.title} />
                      </div>
                    ))}
                  </Carousel>

                </ImageFrame>
              </CarouselWrap>
            ) : allImages.length === 1 ? (
              <ImageFrame
                ref={frameRef}
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => setLightbox({ open: true, index: 0 })}
              >
                <img src={withAutoOrient(allImages[0].cloudinary_url)} alt={item.title} style={{ width: '100%', display: 'block' }} />
              </ImageFrame>
            ) : (
              <ImageFrame>
                <ImagePlaceholder>
                  <span className="material-symbols-outlined">image_not_supported</span>
                </ImagePlaceholder>
              </ImageFrame>
            )}
          </ImageCol>

          {/* ── Details (right of image) ── */}
          <DetailCol>
            <DataGrid>
              {signatories.length > 0 && (
                <SignatoryList signatories={signatories} />
              )}

              {certifications.map(cert => (
                <DataRow key={cert.id}>
                  <DataLabel>{cert.cert_service} Certification</DataLabel>
                  <DataValue style={{ color: gradeColors(cert.item_grade ?? cert.auto_grade).$fg }}>
                    {cert.item_grade ?? cert.auto_grade ?? 'Authenticated'}
                  </DataValue>
                  {cert.cert_id && (
                    cert.cert_link ? (
                      <DataValue
                        as="a"
                        href={cert.cert_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        $accent="primary"
                        style={{ fontSize: '1rem', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                      >
                        #{cert.cert_id}
                      </DataValue>
                    ) : (
                      <DataValue $accent="primary" style={{ fontSize: '1rem' }}>
                        #{cert.cert_id}
                      </DataValue>
                    )
                  )}
                </DataRow>
              ))}

            </DataGrid>

            <ItemTypeDetails
              itemType={item.item_type}
              detail={detail}
              gameContext={gameContext}
              item={item}
            />

            {pop && (
              <>
                <Divider />
                <PopSection>
                  <SectionLabel>Population Analysis</SectionLabel>
                  <TotalPop>
                    <TotalNum>{Number(pop.total).toLocaleString()}</TotalNum>
                    <TotalLabel>Total Population</TotalLabel>
                  </TotalPop>
                  <PopGrid>
                    <PopCell $type="higher">
                      <PopCellLabel>Higher</PopCellLabel>
                      <PopCellValue $type="higher">{pop.higher}</PopCellValue>
                    </PopCell>
                    <PopCell $type="same">
                      <PopCellLabel>Same</PopCellLabel>
                      <PopCellValue $type="same">{pop.same}</PopCellValue>
                    </PopCell>
                    <PopCell $type="lower" $last>
                      <PopCellLabel>Lower</PopCellLabel>
                      <PopCellValue $type="lower">{pop.lower}</PopCellValue>
                    </PopCell>
                  </PopGrid>
                </PopSection>
              </>
            )}

            {item.set_id && (
              <SetMembersAccordion setId={item.set_id} currentItemId={id} />
            )}

            <DuplicateCopiesSection itemId={id} />
          </DetailCol>
        </Grid>

        {/* ── Description (full width below) ── */}
        {item.description && (
          <section>
            <SectionLabel>Description</SectionLabel>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-on-surface-variant)', lineHeight: 1.7, fontSize: '0.9375rem' }}>
              {item.description}
            </p>
          </section>
        )}
      </ContentWrap>

      {/* ── Related items ── */}
      {related.length > 0 && (
        <RelatedSection>
          <RelatedHeader>
            <RelatedTitle>Explore More Archive Assets</RelatedTitle>
            <RelatedMeta>Selected Curations</RelatedMeta>
          </RelatedHeader>
          <RelatedGrid>
            {related.map((r, i) => (
              <RelatedCard key={r.id} to={`/item/${r.id}`}>
                <RelatedImage>
                  {r.primary_image_url
                    ? <img src={r.primary_image_url} alt={r.title} loading="lazy" />
                    : null}
                </RelatedImage>
                <RelatedRef>Ref. {String(i + 1).padStart(3, '0')}</RelatedRef>
                <RelatedName>{r.title}</RelatedName>
              </RelatedCard>
            ))}
          </RelatedGrid>
        </RelatedSection>
      )}

      {/* ── Lightbox ── */}
      {lightbox.open && allImages.length > 0 && (
        <ImageLightbox
          images={allImages}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(l => ({ ...l, open: false }))}
        />
      )}
    </Page>
  )
}
