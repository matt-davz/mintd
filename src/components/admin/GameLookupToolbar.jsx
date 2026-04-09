import { useState } from 'react'
import styled from 'styled-components'
import { fetchGamesByDate, fetchGamesByMatchup, fetchWorldSeriesGames } from '../../lib/mlbApi'
import { TeamSelect } from './TeamSelect'
import { GameLookupResults } from './GameLookupResults'

// ─── Styled ──────────────────────────────────────────────────────────────────

const Toolbar = styled.div`
  background: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.12);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
`

const Header = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
`

const HeaderLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-primary);
`

const Chevron = styled.span`
  font-size: 1rem;
  color: var(--color-outline);
  transition: transform 0.2s;
  transform: rotate(${p => p.$open ? '180deg' : '0deg'});
  line-height: 1;
`

const Body = styled.div`
  margin-top: var(--space-3);
`

const Tabs = styled.div`
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
`

const Tab = styled.button`
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full, 999px);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid ${p => p.$active ? 'rgba(173, 198, 255, 0.3)' : 'rgba(140, 144, 159, 0.15)'};
  background: ${p => p.$active ? 'rgba(173, 198, 255, 0.15)' : 'transparent'};
  color: ${p => p.$active ? 'var(--color-primary)' : 'var(--color-outline)'};
  cursor: pointer;
  transition: all var(--transition-base);

  &:hover { border-color: rgba(173, 198, 255, 0.3); }
`

const Row = styled.div`
  display: flex;
  gap: var(--space-3);
  align-items: flex-end;
  flex-wrap: wrap;
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  flex: ${p => p.$flex || '1'};
`

const Label = styled.label`
  font-family: var(--font-mono);
  font-size: 0.5rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
`

const SmallInput = styled.input`
  width: 100%;
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  color: var(--color-on-surface);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  padding: var(--space-2) var(--space-3);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.5);
  }
`

const SearchBtn = styled.button`
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  color: var(--color-on-primary);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-base);

  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

// ─── Component ───────────────────────────────────────────────────────────────

export function GameLookupToolbar({ onSelectGame }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState('date')

  // Date mode
  const [searchDate, setSearchDate] = useState('')
  // Matchup mode
  const [team1, setTeam1] = useState(null)
  const [team2, setTeam2] = useState(null)
  const [matchupYear, setMatchupYear] = useState('')
  // World Series mode
  const [wsYear, setWsYear] = useState('')
  const [wsGame, setWsGame] = useState('')

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function search() {
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      let games
      if (mode === 'date') {
        if (!searchDate) { setError('Enter a date.'); return }
        games = await fetchGamesByDate(searchDate)
      } else if (mode === 'matchup') {
        if (!team1 || !team2 || !matchupYear) { setError('Select both teams and a season year.'); return }
        games = await fetchGamesByMatchup(team1.id, team2.id, matchupYear)
      } else {
        if (!wsYear) { setError('Enter a year.'); return }
        games = await fetchWorldSeriesGames(wsYear)
        if (wsGame) {
          const n = Number(wsGame)
          games = games.filter((_, i) => i + 1 === n)
        }
      }
      setResults(games)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(game) {
    onSelectGame(game)
    setResults(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); search() }
  }

  return (
    <Toolbar>
      <Header type="button" onClick={() => setIsOpen(o => !o)}>
        <HeaderLabel>MLB Game Lookup</HeaderLabel>
        <Chevron $open={isOpen}>&#9662;</Chevron>
      </Header>

      {isOpen && (
        <Body>
          <Tabs>
            <Tab $active={mode === 'date'} onClick={() => setMode('date')}>By Date</Tab>
            <Tab $active={mode === 'matchup'} onClick={() => setMode('matchup')}>By Matchup</Tab>
            <Tab $active={mode === 'series'} onClick={() => setMode('series')}>World Series</Tab>
          </Tabs>

          {mode === 'date' && (
            <Row>
              <InputGroup>
                <Label>Game Date</Label>
                <SmallInput
                  type="date"
                  value={searchDate}
                  onChange={e => setSearchDate(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </InputGroup>
              <SearchBtn onClick={search} disabled={loading}>Search</SearchBtn>
            </Row>
          )}

          {mode === 'matchup' && (
            <Row>
              <InputGroup>
                <Label>Team 1</Label>
                <TeamSelect value={team1} onChange={setTeam1} placeholder="Search teams..." />
              </InputGroup>
              <InputGroup>
                <Label>Team 2</Label>
                <TeamSelect value={team2} onChange={setTeam2} placeholder="Search teams..." />
              </InputGroup>
              <InputGroup $flex="0 0 80px">
                <Label>Season</Label>
                <SmallInput
                  type="number"
                  value={matchupYear}
                  placeholder="2024"
                  onChange={e => setMatchupYear(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </InputGroup>
              <SearchBtn onClick={search} disabled={loading}>Search</SearchBtn>
            </Row>
          )}

          {mode === 'series' && (
            <Row>
              <InputGroup $flex="0 0 80px">
                <Label>Year</Label>
                <SmallInput
                  type="number"
                  value={wsYear}
                  placeholder="1956"
                  onChange={e => setWsYear(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </InputGroup>
              <InputGroup $flex="0 0 80px">
                <Label>Game #</Label>
                <SmallInput
                  type="number"
                  min="1"
                  max="7"
                  value={wsGame}
                  placeholder="—"
                  onChange={e => setWsGame(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </InputGroup>
              <SearchBtn onClick={search} disabled={loading}>Search</SearchBtn>
            </Row>
          )}

          <GameLookupResults
            results={results}
            loading={loading}
            error={error}
            onSelect={handleSelect}
          />
        </Body>
      )}
    </Toolbar>
  )
}
