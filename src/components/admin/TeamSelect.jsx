import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { CURRENT_TEAMS } from '../../lib/mlbApi'

const Wrap = styled.div`
  position: relative;
`

const Input = styled.input`
  width: 100%;
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  color: var(--color-on-surface);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  padding: var(--space-2) var(--space-3);
  transition: border-color var(--transition-base);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.5);
  }
`

const Dropdown = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 20;
  margin-top: 2px;
  padding: var(--space-1) 0;
  background: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.25);
  border-radius: var(--radius-sm);
  max-height: 200px;
  overflow-y: auto;
  list-style: none;
`

const Item = styled.li`
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.03em;
  color: var(--color-on-surface);
  cursor: pointer;
  background: ${p => p.$active ? 'rgba(173, 198, 255, 0.12)' : 'transparent'};

  &:hover { background: rgba(173, 198, 255, 0.08); }

  span { color: var(--color-outline); }
`

function filterTeams(query) {
  if (!query) return CURRENT_TEAMS
  const q = query.toLowerCase()
  return CURRENT_TEAMS.filter(t =>
    t.abbrev.toLowerCase().includes(q)
    || t.name.toLowerCase().includes(q)
    || t.city.toLowerCase().includes(q)
  )
}

export function TeamSelect({ value, onChange, placeholder = 'Search teams...' }) {
  const [query, setQuery] = useState(value ? `${value.abbrev} — ${value.name}` : '')
  const [open, setOpen] = useState(false)
  const [hlIdx, setHlIdx] = useState(0)
  const wrapRef = useRef(null)
  const listRef = useRef(null)

  const filtered = filterTeams(open ? query : '')

  // Sync display text when value changes externally
  useEffect(() => {
    if (value) setQuery(`${value.abbrev} — ${value.name}`)
    else setQuery('')
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(team) {
    onChange(team)
    setQuery(`${team.abbrev} — ${team.name}`)
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (!open) {
      if (e.key === 'ArrowDown') { setOpen(true); e.preventDefault() }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHlIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHlIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[hlIdx]) select(filtered[hlIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.children[hlIdx]
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [hlIdx])

  return (
    <Wrap ref={wrapRef}>
      <Input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={e => {
          setQuery(e.target.value)
          setOpen(true)
          setHlIdx(0)
        }}
        onFocus={() => { setOpen(true); setQuery('') }}
        onKeyDown={handleKeyDown}
      />
      {open && filtered.length > 0 && (
        <Dropdown ref={listRef}>
          {filtered.map((t, i) => (
            <Item
              key={`${t.id}-${t.abbrev}`}
              $active={i === hlIdx}
              onMouseEnter={() => setHlIdx(i)}
              onMouseDown={e => { e.preventDefault(); select(t) }}
            >
              {t.abbrev} <span>— {t.name}</span>
            </Item>
          ))}
        </Dropdown>
      )}
    </Wrap>
  )
}
