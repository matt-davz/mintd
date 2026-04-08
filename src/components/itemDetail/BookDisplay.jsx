import { DetailGrid, DetailRow, DetailLabel, DetailValue, TagRow, Tag } from './styles'

export function BookDisplay({ detail }) {
  if (!detail) return null

  return (
    <DetailGrid>
      <TagRow>
        {detail.is_first_edition && <Tag>First Edition</Tag>}
        {detail.is_signed_by_author && <Tag>Signed by Author</Tag>}
      </TagRow>

      {detail.author && (
        <DetailRow>
          <DetailLabel>Author</DetailLabel>
          <DetailValue>{detail.author}</DetailValue>
        </DetailRow>
      )}

      {detail.publisher && (
        <DetailRow>
          <DetailLabel>Publisher</DetailLabel>
          <DetailValue>{detail.publisher}</DetailValue>
        </DetailRow>
      )}

      {detail.year_published && (
        <DetailRow>
          <DetailLabel>Year Published</DetailLabel>
          <DetailValue>{detail.year_published}</DetailValue>
        </DetailRow>
      )}

      {detail.edition && (
        <DetailRow>
          <DetailLabel>Edition</DetailLabel>
          <DetailValue>{detail.edition}</DetailValue>
        </DetailRow>
      )}

      {detail.isbn && (
        <DetailRow>
          <DetailLabel>ISBN</DetailLabel>
          <DetailValue>{detail.isbn}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
