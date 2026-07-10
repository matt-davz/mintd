import { DetailGrid, DetailRow, DetailLabel, DetailValue, formatDate } from './styles'

export function StadiumGiveawayDisplay({ detail }) {
  if (!detail) return null

  return (
    <DetailGrid>
      {detail.event_name && (
        <DetailRow>
          <DetailLabel>Event Name</DetailLabel>
          <DetailValue>{detail.event_name}</DetailValue>
        </DetailRow>
      )}

      {detail.event_date && (
        <DetailRow>
          <DetailLabel>Event Date</DetailLabel>
          <DetailValue>{formatDate(detail.event_date)}</DetailValue>
        </DetailRow>
      )}

      {detail.giveaway_item_type && (
        <DetailRow>
          <DetailLabel>Giveaway Item</DetailLabel>
          <DetailValue>{detail.giveaway_item_type}</DetailValue>
        </DetailRow>
      )}

      {detail.manufacturer && (
        <DetailRow>
          <DetailLabel>Manufacturer</DetailLabel>
          <DetailValue>{detail.manufacturer}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
