import { DetailGrid, DetailRow, DetailLabel, DetailValue, TagRow, Tag, formatDate } from './styles'

export function MagazineDisplay({ detail }) {
  if (!detail) return null

  const volumeIssue = [detail.volume, detail.issue_number].filter(Boolean).join(', ')

  return (
    <DetailGrid>
      {detail.is_cover_signed && (
        <TagRow><Tag>Cover Signed</Tag></TagRow>
      )}

      {detail.publication_name && (
        <DetailRow>
          <DetailLabel>Publication</DetailLabel>
          <DetailValue>{detail.publication_name}</DetailValue>
        </DetailRow>
      )}

      {detail.issue_date && (
        <DetailRow>
          <DetailLabel>Issue Date</DetailLabel>
          <DetailValue>{formatDate(detail.issue_date)}</DetailValue>
        </DetailRow>
      )}

      {volumeIssue && (
        <DetailRow>
          <DetailLabel>Volume / Issue</DetailLabel>
          <DetailValue>{volumeIssue}</DetailValue>
        </DetailRow>
      )}

      {detail.publisher && (
        <DetailRow>
          <DetailLabel>Publisher</DetailLabel>
          <DetailValue>{detail.publisher}</DetailValue>
        </DetailRow>
      )}

      {detail.cover_subject && (
        <DetailRow>
          <DetailLabel>Cover Subject</DetailLabel>
          <DetailValue>{detail.cover_subject}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
