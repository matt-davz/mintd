import { DetailGrid, DetailRow, DetailLabel, DetailValue, formatEnum, formatDate } from './styles'

export function PhotoDisplay({ detail }) {
  if (!detail) return null

  return (
    <DetailGrid>
      {detail.photo_type && (
        <DetailRow>
          <DetailLabel>Photo Type</DetailLabel>
          <DetailValue>{formatEnum(detail.photo_type)}</DetailValue>
        </DetailRow>
      )}

      {detail.photo_format && (
        <DetailRow>
          <DetailLabel>Format</DetailLabel>
          <DetailValue>{formatEnum(detail.photo_format)}</DetailValue>
        </DetailRow>
      )}

      {detail.photo_era && (
        <DetailRow>
          <DetailLabel>Era</DetailLabel>
          <DetailValue>{formatEnum(detail.photo_era)}</DetailValue>
        </DetailRow>
      )}

      {detail.photo_size && (
        <DetailRow>
          <DetailLabel>Size</DetailLabel>
          <DetailValue>{detail.photo_size}</DetailValue>
        </DetailRow>
      )}

      {detail.photographer && (
        <DetailRow>
          <DetailLabel>Photographer</DetailLabel>
          <DetailValue>{detail.photographer}</DetailValue>
        </DetailRow>
      )}

      {detail.agency_source && (
        <DetailRow>
          <DetailLabel>Agency / Source</DetailLabel>
          <DetailValue>{detail.agency_source}</DetailValue>
        </DetailRow>
      )}

      {detail.event_subject && (
        <DetailRow style={{ gridColumn: '1 / -1' }}>
          <DetailLabel>Subject</DetailLabel>
          <DetailValue>{detail.event_subject}</DetailValue>
        </DetailRow>
      )}

      {detail.photo_date && (
        <DetailRow>
          <DetailLabel>Date</DetailLabel>
          <DetailValue>{formatDate(detail.photo_date)}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
