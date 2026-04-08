import { DetailGrid, DetailRow, DetailLabel, DetailValue, TagRow, Tag, formatEnum, formatMoney } from './styles'

export function TicketDisplay({ detail }) {
  if (!detail) return null

  const seatInfo = [detail.section, detail.row, detail.seat].filter(Boolean)

  return (
    <DetailGrid>
      <TagRow>
        {detail.is_full_ticket && <Tag>Full Ticket</Tag>}
        {!detail.is_full_ticket && <Tag>Stub</Tag>}
      </TagRow>

      {seatInfo.length > 0 && (
        <DetailRow>
          <DetailLabel>Seating</DetailLabel>
          <DetailValue>
            {detail.section && `Sec ${detail.section}`}
            {detail.row && ` Row ${detail.row}`}
            {detail.seat && ` Seat ${detail.seat}`}
          </DetailValue>
        </DetailRow>
      )}

      {detail.face_value != null && detail.face_value !== '' && (
        <DetailRow>
          <DetailLabel>Face Value</DetailLabel>
          <DetailValue>{formatMoney(detail.face_value)}</DetailValue>
        </DetailRow>
      )}

      {detail.game_result && (
        <DetailRow>
          <DetailLabel>Game Result</DetailLabel>
          <DetailValue>{formatEnum(detail.game_result)}</DetailValue>
        </DetailRow>
      )}

      {detail.printer && (
        <DetailRow>
          <DetailLabel>Printer</DetailLabel>
          <DetailValue>{detail.printer}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
