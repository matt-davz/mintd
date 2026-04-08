import { DetailGrid, DetailRow, DetailLabel, DetailValue, TagRow, Tag, formatEnum } from './styles'

export function BaseDisplay({ detail }) {
  if (!detail) return null

  return (
    <DetailGrid>
      <TagRow>
        {detail.is_game_used && <Tag>Game Used</Tag>}
        {detail.has_mlb_authentication && <Tag>MLB Authenticated</Tag>}
      </TagRow>

      {detail.base_position && (
        <DetailRow>
          <DetailLabel>Position</DetailLabel>
          <DetailValue>{formatEnum(detail.base_position)}</DetailValue>
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
