import { DetailGrid, DetailRow, DetailLabel, DetailValue, TagRow, Tag, formatEnum } from './styles'

export function JerseyDisplay({ detail }) {
  if (!detail) return null

  return (
    <DetailGrid>
      <TagRow>
        {detail.is_game_worn && <Tag>Game Worn</Tag>}
        {detail.has_special_patch && <Tag>Special Patch</Tag>}
      </TagRow>

      {detail.player_number && (
        <DetailRow>
          <DetailLabel>Number</DetailLabel>
          <DetailValue>#{detail.player_number}</DetailValue>
        </DetailRow>
      )}

      {detail.team && (
        <DetailRow>
          <DetailLabel>Team</DetailLabel>
          <DetailValue>{detail.team}</DetailValue>
        </DetailRow>
      )}

      {detail.year_worn && (
        <DetailRow>
          <DetailLabel>Year Worn</DetailLabel>
          <DetailValue>{detail.year_worn}</DetailValue>
        </DetailRow>
      )}

      {detail.jersey_type && (
        <DetailRow>
          <DetailLabel>Type</DetailLabel>
          <DetailValue>{formatEnum(detail.jersey_type)}</DetailValue>
        </DetailRow>
      )}

      {detail.size && (
        <DetailRow>
          <DetailLabel>Size</DetailLabel>
          <DetailValue>{detail.size}</DetailValue>
        </DetailRow>
      )}

      {detail.manufacturer && (
        <DetailRow>
          <DetailLabel>Manufacturer</DetailLabel>
          <DetailValue>{detail.manufacturer}</DetailValue>
        </DetailRow>
      )}

      {detail.has_special_patch && detail.patch_description && (
        <DetailRow style={{ gridColumn: '1 / -1' }}>
          <DetailLabel>Patch</DetailLabel>
          <DetailValue>{detail.patch_description}</DetailValue>
        </DetailRow>
      )}
    </DetailGrid>
  )
}
