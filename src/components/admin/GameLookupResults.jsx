import styled from 'styled-components'

const List = styled.div`
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-3);
`

const Card = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.1);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-base), border-color var(--transition-base);

  &:hover {
    background: rgba(173, 198, 255, 0.08);
    border-color: rgba(173, 198, 255, 0.3);
  }
`

const Line1 = styled.div`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.03em;
  color: var(--color-on-surface);
`

const Line2 = styled.div`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.03em;
  color: var(--color-outline);
  margin-top: 2px;
`

const Status = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: ${p => p.$error ? '#ffb4ab' : 'var(--color-outline)'};
  margin-top: var(--space-3);
`

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00') // avoid timezone shift
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function scoreLine(game) {
  const parts = []
  if (game.notes) parts.push(game.notes)
  if (game.home_score !== '' && game.away_score !== '') {
    parts.push(`${game.home_team} ${game.home_score}, ${game.away_team} ${game.away_score}`)
  }
  return parts.join(' — ')
}

export function GameLookupResults({ results, loading, error, onSelect }) {
  if (loading) return <Status>Searching...</Status>
  if (error) return <Status $error>{error}</Status>
  if (!results) return null
  if (results.length === 0) return <Status>No games found.</Status>

  return (
    <List>
      {results.map((game, i) => (
        <Card key={`${game.game_date}-${i}`} onClick={() => onSelect(game)}>
          <Line1>
            {formatDate(game.game_date)} — {game.away_team} @ {game.home_team} — {game.venue}
          </Line1>
          <Line2>{scoreLine(game)}</Line2>
        </Card>
      ))}
    </List>
  )
}
