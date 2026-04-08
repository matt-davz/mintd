import { DetailGrid, DetailRow, DetailLabel, DetailValue, TagRow, Tag, formatEnum } from './styles'

export function GloveDisplay({ detail }) {
  if (!detail) return null

  return (
    <DetailGrid>
      {detail.is_game_used && (
        <TagRow><Tag>Game Used</Tag></TagRow>
      )}

      {detail.manufacturer && (
        <DetailRow>
          <DetailLabel>Manufacturer</DetailLabel>
          <DetailValue>{detail.manufacturer}</DetailValue>
        </DetailRow>
      )}

      {detail.model && (
        <DetailRow>
          <DetailLabel>Model</DetailLabel>
          <DetailValue>{detail.model}</DetailValue>
        </DetailRow>
      )}

      {detail.player_position && (
        <DetailRow>
          <DetailLabel>Position</DetailLabel>
          <DetailValue>{formatEnum(detail.player_position)}</DetailValue>
        </DetailRow>
      )}

      {detail.handedness && (
        <DetailRow>
          <DetailLabel>Handedness</DetailLabel>
          <DetailValue>{formatEnum(detail.handedness)}</DetailValue>
        </DetailRow>
      )}

      {detail.year_used && (
        <DetailRow>
          <DetailLabel>Year Used</DetailLabel>
          <DetailValue>{detail.year_used}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
