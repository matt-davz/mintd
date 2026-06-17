import { useState } from 'react'
import styled from 'styled-components'

const Wrap = styled.div`
  margin-top: var(--space-4);
`

const AccordionTrigger = styled.button`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    padding: var(--space-3) 0;
    cursor: pointer;
    color: var(--color-on-surface-variant);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
`

const ChevronIcon = styled.span`
  font-size: 1rem;
  transition: transform 0.2s ease;
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
`

const LineScoreWrap = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 640px) {
    display: ${({ $open }) => $open ? 'block' : 'none'};
    padding-bottom: var(--space-3);
    overflow-x: unset;
  }
`

// Desktop: horizontal table (teams = rows, innings = columns)
const LineScoreTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.02em;

  @media (max-width: 640px) {
    display: none;
  }
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

// Mobile: vertical table (innings = rows, teams = columns)
const VerticalTable = styled.table`
  display: none;

  @media (max-width: 640px) {
    display: table;
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    letter-spacing: 0.02em;
  }
`

const VHead = styled.thead`
  th {
    padding: 0.5rem 0.75rem;
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-outline);
    text-align: center;
    white-space: nowrap;
    writing-mode: vertical-rl;
    text-orientation: mixed;

    &:first-child {
      text-align: left;
      padding-left: 0;
      writing-mode: horizontal-tb;
    }
  }
`

const VBody = styled.tbody`
  tr {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  td {
    padding: 0.5rem 0.75rem;
    text-align: center;
    color: var(--color-on-surface);

    &:first-child {
      text-align: left;
      padding-left: 0;
      color: var(--color-on-surface-variant);
    }
  }
`

const VTotalRow = styled.tr`
  td {
    font-weight: 600;
    color: var(--color-primary);

    &:first-child {
      color: var(--color-outline);
      font-weight: 600;
    }
  }
`

export function BoxScoreDisplay({ boxScore, homeTeam, awayTeam }) {
  const [isOpen, setIsOpen] = useState(false)
  const { innings, home, away } = boxScore

  return (
    <Wrap>
      <AccordionTrigger onClick={() => setIsOpen(o => !o)}>
        Box Score
        <ChevronIcon $open={isOpen} className="material-symbols-outlined">expand_more</ChevronIcon>
      </AccordionTrigger>

      <LineScoreWrap $open={isOpen}>
        {/* Desktop: teams as rows, innings as columns */}
        <LineScoreTable>
          <LSHead>
            <tr>
              <th></th>
              {innings.map(i => <th key={i.inning}>{i.inning}</th>)}
              <th>R</th>
              <th>H</th>
              <th>E</th>
            </tr>
          </LSHead>
          <LSBody>
            <tr>
              <td>{awayTeam || 'AWAY'}</td>
              {innings.map(i => <td key={i.inning}>{i.away}</td>)}
              <TotalCell>{away.r}</TotalCell>
              <TotalCell>{away.h}</TotalCell>
              <TotalCell>{away.e}</TotalCell>
            </tr>
            <tr>
              <td>{homeTeam || 'HOME'}</td>
              {innings.map(i => <td key={i.inning}>{i.home}</td>)}
              <TotalCell>{home.r}</TotalCell>
              <TotalCell>{home.h}</TotalCell>
              <TotalCell>{home.e}</TotalCell>
            </tr>
          </LSBody>
        </LineScoreTable>

        {/* Mobile: innings as rows, teams as columns */}
        <VerticalTable>
          <VHead>
            <tr>
              <th>INN</th>
              <th>{awayTeam || 'AWAY'}</th>
              <th>{homeTeam || 'HOME'}</th>
            </tr>
          </VHead>
          <VBody>
            {innings.map(i => (
              <tr key={i.inning}>
                <td>{i.inning}</td>
                <td>{i.away}</td>
                <td>{i.home}</td>
              </tr>
            ))}
            <VTotalRow>
              <td>R</td>
              <td>{away.r}</td>
              <td>{home.r}</td>
            </VTotalRow>
            <VTotalRow>
              <td>H</td>
              <td>{away.h}</td>
              <td>{home.h}</td>
            </VTotalRow>
            <VTotalRow>
              <td>E</td>
              <td>{away.e}</td>
              <td>{home.e}</td>
            </VTotalRow>
          </VBody>
        </VerticalTable>
      </LineScoreWrap>
    </Wrap>
  )
}
