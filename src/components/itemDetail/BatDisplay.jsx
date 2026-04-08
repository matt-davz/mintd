import { DetailGrid, DetailRow, DetailLabel, DetailValue, TagRow, Tag } from './styles'

export function BatDisplay({ detail }) {
  if (!detail) return null

  const dimensions = [
    detail.length_inches && `${detail.length_inches}"`,
    detail.weight_oz && `${detail.weight_oz} oz`,
  ].filter(Boolean).join(' / ')

  return (
    <DetailGrid>
      <TagRow>
        {detail.is_game_used && <Tag>Game Used</Tag>}
        {detail.is_cracked && <Tag>Cracked</Tag>}
        {detail.has_pine_tar && <Tag>Pine Tar</Tag>}
      </TagRow>

      {detail.manufacturer && (
        <DetailRow>
          <DetailLabel>Manufacturer</DetailLabel>
          <DetailValue>{detail.manufacturer}</DetailValue>
        </DetailRow>
      )}

      {detail.model_number && (
        <DetailRow>
          <DetailLabel>Model</DetailLabel>
          <DetailValue>{detail.model_number}</DetailValue>
        </DetailRow>
      )}

      {dimensions && (
        <DetailRow>
          <DetailLabel>Dimensions</DetailLabel>
          <DetailValue>{dimensions}</DetailValue>
        </DetailRow>
      )}

      {detail.year_used && (
        <DetailRow>
          <DetailLabel>Year Used</DetailLabel>
          <DetailValue>{detail.year_used}</DetailValue>
        </DetailRow>
      )}

      {detail.inscription && (
        <DetailRow style={{ gridColumn: '1 / -1' }}>
          <DetailLabel>Inscription</DetailLabel>
          <DetailValue>{detail.inscription}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
