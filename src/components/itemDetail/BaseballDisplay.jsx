import { DetailGrid, DetailRow, DetailLabel, DetailValue, TagRow, Tag, formatEnum } from './styles'

export function BaseballDisplay({ detail }) {
  if (!detail) return null

  return (
    <DetailGrid>
      <TagRow>
        {detail.is_game_used && <Tag>Game Used</Tag>}
        {detail.is_team_signed && <Tag>Team Signed</Tag>}
      </TagRow>

      {detail.is_game_used && detail.game_used_type && (
        <DetailRow>
          <DetailLabel>Usage</DetailLabel>
          <DetailValue>{formatEnum(detail.game_used_type)}</DetailValue>
        </DetailRow>
      )}

      {detail.manufacturer && (
        <DetailRow>
          <DetailLabel>Manufacturer</DetailLabel>
          <DetailValue>{detail.manufacturer}</DetailValue>
        </DetailRow>
      )}

      {detail.league_stamp && (
        <DetailRow>
          <DetailLabel>League Stamp</DetailLabel>
          <DetailValue>{detail.league_stamp}</DetailValue>
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
