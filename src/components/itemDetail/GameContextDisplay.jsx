import { DetailGrid, DetailRow, DetailLabel, DetailValue, SectionHeading, Divider, formatEnum, formatDate } from './styles'

export function GameContextDisplay({ gameContext }) {
  if (!gameContext) return null

  const gc = gameContext
  const hasScore = gc.home_score != null && gc.away_score != null

  const matchup = [gc.away_team, gc.home_team].filter(Boolean).join(' @ ')
  const score = hasScore ? `${gc.away_score} – ${gc.home_score}` : null
  const venue = [gc.venue, gc.city].filter(Boolean).join(', ')

  return (
    <>
      <Divider />
      <section>
        <SectionHeading>Game Context</SectionHeading>
        <DetailGrid>
          {gc.game_date && (
            <DetailRow>
              <DetailLabel>Game Date</DetailLabel>
              <DetailValue>{formatDate(gc.game_date)}</DetailValue>
            </DetailRow>
          )}

          {matchup && (
            <DetailRow>
              <DetailLabel>Matchup</DetailLabel>
              <DetailValue>{matchup}</DetailValue>
            </DetailRow>
          )}

          {score && (
            <DetailRow>
              <DetailLabel>Score</DetailLabel>
              <DetailValue>{score}</DetailValue>
            </DetailRow>
          )}

          {venue && (
            <DetailRow>
              <DetailLabel>Venue</DetailLabel>
              <DetailValue>{venue}</DetailValue>
            </DetailRow>
          )}

          {gc.season_year && (
            <DetailRow>
              <DetailLabel>Season</DetailLabel>
              <DetailValue>{gc.season_year}</DetailValue>
            </DetailRow>
          )}

          {gc.game_type && (
            <DetailRow>
              <DetailLabel>Game Type</DetailLabel>
              <DetailValue>{formatEnum(gc.game_type)}</DetailValue>
            </DetailRow>
          )}

          {gc.series_game_number && (
            <DetailRow>
              <DetailLabel>Series Game</DetailLabel>
              <DetailValue>Game {gc.series_game_number}</DetailValue>
            </DetailRow>
          )}

          {gc.game_result && (
            <DetailRow>
              <DetailLabel>Result</DetailLabel>
              <DetailValue>{formatEnum(gc.game_result)}</DetailValue>
            </DetailRow>
          )}

          {gc.notes && (
            <DetailRow style={{ gridColumn: '1 / -1' }}>
              <DetailLabel>Notes</DetailLabel>
              <DetailValue style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {gc.notes}
              </DetailValue>
            </DetailRow>
          )}
        </DetailGrid>
      </section>
    </>
  )
}
