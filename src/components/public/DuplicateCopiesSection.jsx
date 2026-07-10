import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useItemDuplicates } from '../../hooks/useItemDuplicates'

const Wrap = styled.section`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: var(--space-4);
  min-width: 0;
  width: 100%;
`

const Label = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin-bottom: var(--space-3);
`

const Track = styled.div`
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  flex: 0 0 96px;
  text-decoration: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.1);
  transition: border-color var(--transition-base);

  &:hover { border-color: rgba(173, 198, 255, 0.3); }
`

const CardImage = styled.div`
  aspect-ratio: 4/5;
  overflow: hidden;
  background-color: var(--color-surface-high);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
    filter: grayscale(20%);
    transition: opacity var(--transition-base), filter var(--transition-base);
  }

  ${Card}:hover & img {
    opacity: 1;
    filter: grayscale(0%);
  }

  .material-symbols-outlined {
    font-size: 1.5rem;
    color: var(--color-surface-bright);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
`

const CardTitle = styled.p`
  font-family: var(--font-headline);
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding: var(--space-2);
`

export function DuplicateCopiesSection({ itemId }) {
  const { links, loading } = useItemDuplicates(itemId)

  if (loading || links.length === 0) return null

  return (
    <Wrap>
      <Label>Other Copies in Collection</Label>
      <Track>
        {links.map(link => (
          <Card key={link.otherItemId} to={`/item/${link.otherItemId}`}>
            <CardImage>
              {link.otherImageUrl
                ? <img src={link.otherImageUrl} alt={link.otherTitle} loading="lazy" />
                : <span className="material-symbols-outlined">image_not_supported</span>}
            </CardImage>
            <CardTitle>{link.otherTitle}</CardTitle>
          </Card>
        ))}
      </Track>
    </Wrap>
  )
}
