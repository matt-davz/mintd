import styled from 'styled-components'

const LineScoreWrap = styled.div`
  overflow-x: auto;
  margin-top: var(--space-4);
`

const LineScoreTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
`

const LSHead = styled.thead`
  th {
    padding: 0.5rem 0.75rem;
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-outline);
    text-align: center;
    white-space: nowrap;

    &:first-child {
      text-align: left;
      padding-left: 0;
    }
  }
`

const LSBody = styled.tbody`
  tr {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  td {
    padding: 0.5rem 0.75rem;
    text-align: center;
    color: var(--color-on-surface);
    white-space: nowrap;

    &:first-child {
      text-align: left;
      padding-left: 0;
      color: var(--color-on-surface-variant);
    }
  }
`

const TotalCell = styled.td`
  && {
    font-weight: 600;
    color: var(--color-primary);
  }
`

export function BoxScoreDisplay({ boxScore, homeTeam, awayTeam }) {
  const { innings, home, away } = boxScore

  return (
    <LineScoreWrap>
      <LineScoreTable>
        <LSHead>
          <tr>
            <th></th>
            {innings.map(i => (
              <th key={i.inning}>{i.inning}</th>
            ))}
            <th>R</th>
            <th>H</th>
            <th>E</th>
          </tr>
        </LSHead>
        <LSBody>
          <tr>
            <td>{awayTeam || 'AWAY'}</td>
            {innings.map(i => (
              <td key={i.inning}>{i.away}</td>
            ))}
            <TotalCell>{away.r}</TotalCell>
            <TotalCell>{away.h}</TotalCell>
            <TotalCell>{away.e}</TotalCell>
          </tr>
          <tr>
            <td>{homeTeam || 'HOME'}</td>
            {innings.map(i => (
              <td key={i.inning}>{i.home}</td>
            ))}
            <TotalCell>{home.r}</TotalCell>
            <TotalCell>{home.h}</TotalCell>
            <TotalCell>{home.e}</TotalCell>
          </tr>
        </LSBody>
      </LineScoreTable>
    </LineScoreWrap>
  )
}
