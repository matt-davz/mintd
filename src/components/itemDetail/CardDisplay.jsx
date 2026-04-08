import { DetailGrid, DetailRow, DetailLabel, DetailValue, TagRow, Tag } from './styles'

export function CardDisplay({ detail }) {
  if (!detail) return null

  const serialDisplay = detail.serial_number && detail.print_run
    ? `${detail.serial_number} / ${detail.print_run}`
    : detail.serial_number
      ? `#${detail.serial_number}`
      : detail.print_run
        ? `/${detail.print_run}`
        : null

  return (
    <DetailGrid>
      {detail.is_rookie_card && (
        <TagRow><Tag>Rookie Card</Tag></TagRow>
      )}

      {detail.card_set_name && (
        <DetailRow>
          <DetailLabel>Set</DetailLabel>
          <DetailValue>{detail.card_set_name}</DetailValue>
        </DetailRow>
      )}

      {detail.card_number && (
        <DetailRow>
          <DetailLabel>Card Number</DetailLabel>
          <DetailValue>{detail.card_number}</DetailValue>
        </DetailRow>
      )}

      {detail.manufacturer && (
        <DetailRow>
          <DetailLabel>Manufacturer</DetailLabel>
          <DetailValue>{detail.manufacturer}</DetailValue>
        </DetailRow>
      )}

      {detail.year_issued && (
        <DetailRow>
          <DetailLabel>Year Issued</DetailLabel>
          <DetailValue>{detail.year_issued}</DetailValue>
        </DetailRow>
      )}

      {detail.parallel_variation && (
        <DetailRow>
          <DetailLabel>Parallel / Variation</DetailLabel>
          <DetailValue>{detail.parallel_variation}</DetailValue>
        </DetailRow>
      )}

      {serialDisplay && (
        <DetailRow>
          <DetailLabel>Serial / Print Run</DetailLabel>
          <DetailValue>{serialDisplay}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
