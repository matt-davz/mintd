import { DetailGrid, DetailRow, DetailLabel, DetailValue, formatEnum } from './styles'

export function ProgramDisplay({ detail }) {
  if (!detail) return null

  return (
    <DetailGrid>
      {detail.game_type && (
        <DetailRow>
          <DetailLabel>Game Type</DetailLabel>
          <DetailValue>{formatEnum(detail.game_type)}</DetailValue>
        </DetailRow>
      )}

      {detail.publisher && (
        <DetailRow>
          <DetailLabel>Publisher</DetailLabel>
          <DetailValue>{detail.publisher}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
