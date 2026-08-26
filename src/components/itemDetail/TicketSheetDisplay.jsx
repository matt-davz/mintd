import { useState } from 'react'
import styled from 'styled-components'
import { DetailGrid, DetailRow, DetailLabel, DetailValue, TagRow, Tag, formatMoney } from './styles'
import { BoxScoreDisplay } from '../BoxScoreDisplay'
import { useTicketSheetGames } from '../../hooks/useTicketSheetGames'

// ─── Helpers ────────────────────────────────────────────────────────────────

// Team names are stored full ("New York Yankees"); the compact score summary
// uses just the nickname ("Yankees").
function nickname(team) {
  if (!team) return ''
  const parts = team.trim().split(/\s+/)
  return parts[parts.length - 1]
}

function shortDate(val) {
  if (!val) return null
  const d = new Date(val + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function scoreSummary(gc) {
  if (!gc || gc.home_score == null || gc.away_score == null) return null
  const away = [nickname(gc.away_team), gc.away_score].filter(v => v !== '' && v != null).join(' ')
  const home = [nickname(gc.home_team), gc.home_score].filter(v => v !== '' && v != null).join(' ')
  return [away, home].filter(Boolean).join(', ')
}

function baseLabel(game) {
  if (game.game_label) return game.game_label
  const n = game.game_context?.series_game_number
  return n != null ? `Game ${n}` : 'Game'
}

function panelHeader(game) {
  const gc = game.game_context
  const base = baseLabel(game)
  if (game.is_phantom) {
    return /never played/i.test(base) ? base : `${base} (never played)`
  }
  return [base, shortDate(gc?.game_date), scoreSummary(gc)].filter(Boolean).join('  —  ')
}

// ─── Styled ─────────────────────────────────────────────────────────────────

const Accordion = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
`

const Panel = styled.div`
  border-radius: var(--radius-md);
  background: var(--color-surface-low, rgba(255, 255, 255, 0.02));
  overflow: hidden;
`

const PanelButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  padding: var(--space-3) var(--space-4);
  background: ${({ $phantom }) => $phantom ? 'rgba(203, 190, 255, 0.04)' : 'rgba(255, 255, 255, 0.03)'};
  cursor: pointer;
  transition: background var(--transition-base);

  &:hover { background: rgba(255, 255, 255, 0.06); }
`

const HeaderText = styled.span`
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
  color: ${({ $phantom }) => $phantom ? 'var(--color-tertiary, #cbbeff)' : 'var(--color-on-surface)'};
`

const Chevron = styled.span`
  flex-shrink: 0;
  color: var(--color-outline);
  font-size: 1.125rem;
  transition: transform var(--transition-base);
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
`

const PanelBody = styled.div`
  padding: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`

const Notes = styled.p`
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-on-surface-variant);
  margin: 0;
`

const NotesLabel = styled.div`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-outline);
  margin: var(--space-4) 0 var(--space-2);

  &:first-child { margin-top: 0; }
`

// ─── Player box score (rendered only when data is present) ────────────────────

const PBSWrap = styled.div`
  overflow-x: auto;
  margin-top: var(--space-3);
`

const PBSTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 0.75rem;

  th, td {
    padding: 0.4rem 0.6rem;
    text-align: right;
    white-space: nowrap;
    color: var(--color-on-surface);
  }
  th {
    font-size: 0.5625rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--color-outline);
  }
  th:first-child, td:first-child { text-align: left; }
  tbody tr { border-top: 1px solid rgba(255, 255, 255, 0.05); }
`

const BATTING_COLS = [
  ['name', 'Batter'], ['ab', 'AB'], ['r', 'R'], ['h', 'H'],
  ['rbi', 'RBI'], ['bb', 'BB'], ['so', 'SO'],
]
const PITCHING_COLS = [
  ['name', 'Pitcher'], ['ip', 'IP'], ['h', 'H'], ['r', 'R'],
  ['er', 'ER'], ['bb', 'BB'], ['so', 'SO'],
]

function StatTable({ rows, cols }) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  return (
    <PBSWrap>
      <PBSTable>
        <thead>
          <tr>{cols.map(([, label]) => <th key={label}>{label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map(([key]) => <td key={key}>{row[key] ?? ''}</td>)}
            </tr>
          ))}
        </tbody>
      </PBSTable>
    </PBSWrap>
  )
}

function TeamPlayerStats({ label, team }) {
  if (!team || (!team.batting?.length && !team.pitching?.length)) return null
  return (
    <>
      {label && <NotesLabel>{label}</NotesLabel>}
      <StatTable rows={team.batting} cols={BATTING_COLS} />
      <StatTable rows={team.pitching} cols={PITCHING_COLS} />
    </>
  )
}

function PlayerBoxScore({ playerBoxScore, gc }) {
  if (!playerBoxScore) return null
  const away = playerBoxScore.away
  const home = playerBoxScore.home
  if (!away && !home) return null
  return (
    <>
      <NotesLabel>Player Box Score</NotesLabel>
      <TeamPlayerStats label={gc?.away_team} team={away} />
      <TeamPlayerStats label={gc?.home_team} team={home} />
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketSheetDisplay({ detail, item }) {
  const { games, loading } = useTicketSheetGames(item?.id)
  const [openKeys, setOpenKeys] = useState(() => new Set())

  const toggle = key => setOpenKeys(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const seatInfo = [detail?.section, detail?.row, detail?.seat].filter(Boolean)

  return (
    <>
      {detail && (
        <DetailGrid>
          <TagRow>
            {detail.is_uncut ? <Tag>Uncut Sheet</Tag> : <Tag>Cut Sheet</Tag>}
            {detail.includes_phantom_game && <Tag>Phantom Game</Tag>}
          </TagRow>

          {detail.sheet_size != null && detail.sheet_size !== '' && (
            <DetailRow>
              <DetailLabel>Sheet Size</DetailLabel>
              <DetailValue>{detail.sheet_size} tickets</DetailValue>
            </DetailRow>
          )}

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

          {detail.printer && (
            <DetailRow>
              <DetailLabel>Printer</DetailLabel>
              <DetailValue>{detail.printer}</DetailValue>
            </DetailRow>
          )}

          {detail.includes_phantom_game && detail.phantom_game_label && (
            <DetailRow>
              <DetailLabel>Phantom Game</DetailLabel>
              <DetailValue>{detail.phantom_game_label}</DetailValue>
            </DetailRow>
          )}
        </DetailGrid>
      )}

      {games.length > 0 && (
        <Accordion>
          {games.map(game => {
            const gc = game.game_context
            const key = game.id
            const isOpen = openKeys.has(key)
            const hasBoxScore = gc?.box_score && gc.box_score.innings?.length > 0
            return (
              <Panel key={key}>
                <PanelButton $phantom={game.is_phantom} onClick={() => toggle(key)} aria-expanded={isOpen}>
                  <HeaderText $phantom={game.is_phantom}>{panelHeader(game)}</HeaderText>
                  <Chevron className="material-symbols-outlined" $open={isOpen}>expand_more</Chevron>
                </PanelButton>
                {isOpen && (
                  <PanelBody>
                    {!game.is_phantom && hasBoxScore && (
                      <BoxScoreDisplay
                        boxScore={gc.box_score}
                        homeTeam={gc.home_team}
                        awayTeam={gc.away_team}
                      />
                    )}
                    {!game.is_phantom && (
                      <PlayerBoxScore playerBoxScore={gc?.player_box_score} gc={gc} />
                    )}
                    {gc?.notes && (
                      <>
                        <NotesLabel>Notes</NotesLabel>
                        <Notes>{gc.notes}</Notes>
                      </>
                    )}
                  </PanelBody>
                )}
              </Panel>
            )
          })}
        </Accordion>
      )}

      {!loading && games.length === 0 && item?.id && (
        <Notes style={{ marginTop: 'var(--space-4)' }}>No games linked to this sheet yet.</Notes>
      )}
    </>
  )
}
