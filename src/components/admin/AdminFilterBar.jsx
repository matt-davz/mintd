import { useState } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
`

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  background-color: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.15);
  border-radius: var(--radius-md);
  padding: 0.375rem var(--space-3) 0.375rem 2.25rem;
  position: relative;
  transition: border-color var(--transition-base);
  min-height: 2.25rem;

  &:focus-within { border-color: rgba(173, 198, 255, 0.4); }
`

const SearchIcon = styled.span`
  position: absolute;
  left: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-outline);
  font-size: 1rem;
  pointer-events: none;
`

const ActivePill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0.3rem 0.15rem 0.5rem;
  border-radius: var(--radius-sm);
  background-color: rgba(173, 198, 255, 0.1);
  border: 1px solid rgba(173, 198, 255, 0.25);
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-weight: 700;
  white-space: nowrap;
  line-height: 1;
`

const RemoveBtn = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0;
  color: var(--color-primary);
  opacity: 0.5;
  transition: opacity var(--transition-base);

  &:hover { opacity: 1; }

  .material-symbols-outlined { font-size: 0.75rem; }
`

const SearchInput = styled.input`
  flex: 1;
  min-width: 8rem;
  background: transparent;
  border: none;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: var(--color-on-surface);
  outline: none;

  &::placeholder { color: var(--color-outline); }
`

const AccordionToggle = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${({ $open }) => $open ? 'var(--color-primary)' : 'rgba(229, 226, 225, 0.35)'};
  transition: color var(--transition-base);
  align-self: flex-start;
  padding-left: var(--space-1);

  .material-symbols-outlined {
    font-size: 0.875rem;
    transition: transform var(--transition-base);
    transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
  }

  &:hover { color: ${({ $open }) => $open ? 'var(--color-primary)' : 'rgba(229, 226, 225, 0.6)'}; }
`

const AccordionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-1) var(--space-1);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
`

const SectionLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.25);
`

const YearSelect = styled.select`
  background-color: var(--color-surface-low);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: var(--color-on-surface);
  cursor: pointer;
  align-self: flex-start;
  transition: border-color var(--transition-base);

  &:focus { outline: none; border-color: rgba(173, 198, 255, 0.4); }

  option {
    background: var(--color-surface);
    color: var(--color-on-surface);
  }
`

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`

const Pill = styled.button`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  transition: border-color var(--transition-base), color var(--transition-base), background-color var(--transition-base);

  ${({ $active }) => $active ? `
    border: 1px solid var(--color-primary);
    background-color: rgba(173, 198, 255, 0.1);
    color: var(--color-primary);
  ` : `
    border: 1px solid rgba(140, 144, 159, 0.2);
    background-color: transparent;
    color: var(--color-outline);

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  `}
`

function formatSlug(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatGradeLabel(grade) {
  return grade === 'authentic' ? 'Authentic' : grade
}

const SORT_LABELS = {
  year_desc:  'Year: Newest',
  year_asc:   'Year: Oldest',
  grade_desc: 'Grade: High → Low',
  grade_asc:  'Grade: Low → High',
}

export function AdminFilterBar({
  availableTypes, activeTypes, onTypeToggle, onTypeClear,
  availableTeams, activeTeams, onTeamToggle, onTeamClear,
  availableCertServices, activeCertServices, onCertServiceToggle, onCertServiceClear,
  availableGrades, activeGrades, onGradeToggle, onGradeClear,
  sortBy, onSortChange, search, onSearchChange,
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const activePills = [
    ...activeTypes.map(t => ({ key: `type:${t}`, label: formatSlug(t), onRemove: () => onTypeToggle(t) })),
    ...activeTeams.map(t => ({ key: `team:${t}`, label: formatSlug(t), onRemove: () => onTeamToggle(t) })),
    ...activeCertServices.map(cs => ({ key: `certService:${cs}`, label: cs, onRemove: () => onCertServiceToggle(cs) })),
    ...activeGrades.map(g => ({ key: `grade:${g}`, label: formatGradeLabel(g), onRemove: () => onGradeToggle(g) })),
    ...(sortBy ? [{ key: 'sort', label: SORT_LABELS[sortBy], onRemove: () => onSortChange('') }] : []),
  ]

  return (
    <Wrapper>
      <SearchBar>
        <SearchIcon className="material-symbols-outlined">search</SearchIcon>
        {activePills.map(pill => (
          <ActivePill key={pill.key}>
            {pill.label}
            <RemoveBtn onClick={pill.onRemove} aria-label={`Remove ${pill.label} filter`}>
              <span className="material-symbols-outlined">close</span>
            </RemoveBtn>
          </ActivePill>
        ))}
        <SearchInput
          type="text"
          placeholder={activePills.length ? 'Add keyword...' : 'Search items...'}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
      </SearchBar>

      <AccordionToggle $open={advancedOpen} onClick={() => setAdvancedOpen(o => !o)}>
        Advanced Search
        <span className="material-symbols-outlined">expand_more</span>
      </AccordionToggle>

      {advancedOpen && (
        <AccordionBody>
          <div>
            <SectionLabel>Item Type</SectionLabel>
            <Pills style={{ marginTop: 'var(--space-2)' }}>
              <Pill $active={activeTypes.length === 0} onClick={onTypeClear}>
                All
              </Pill>
              {availableTypes.map(type => (
                <Pill
                  key={type}
                  $active={activeTypes.includes(type)}
                  onClick={() => onTypeToggle(type)}
                >
                  {formatSlug(type)}
                </Pill>
              ))}
            </Pills>
          </div>

          {availableTeams.length > 0 && (
            <div>
              <SectionLabel>Teams</SectionLabel>
              <Pills style={{ marginTop: 'var(--space-2)' }}>
                <Pill $active={activeTeams.length === 0} onClick={onTeamClear}>
                  All
                </Pill>
                {availableTeams.map(team => (
                  <Pill
                    key={team}
                    $active={activeTeams.includes(team)}
                    onClick={() => onTeamToggle(team)}
                  >
                    {formatSlug(team)}
                  </Pill>
                ))}
              </Pills>
            </div>
          )}

          {availableCertServices.length > 0 && (
            <div>
              <SectionLabel>Grade Type</SectionLabel>
              <Pills style={{ marginTop: 'var(--space-2)' }}>
                <Pill $active={activeCertServices.length === 0} onClick={onCertServiceClear}>
                  All
                </Pill>
                {availableCertServices.map(cs => (
                  <Pill
                    key={cs}
                    $active={activeCertServices.includes(cs)}
                    onClick={() => onCertServiceToggle(cs)}
                  >
                    {cs}
                  </Pill>
                ))}
              </Pills>
            </div>
          )}

          {availableGrades.length > 0 && (
            <div>
              <SectionLabel>Grade</SectionLabel>
              <Pills style={{ marginTop: 'var(--space-2)' }}>
                <Pill $active={activeGrades.length === 0} onClick={onGradeClear}>
                  All
                </Pill>
                {availableGrades.map(g => (
                  <Pill
                    key={g}
                    $active={activeGrades.includes(g)}
                    onClick={() => onGradeToggle(g)}
                  >
                    {formatGradeLabel(g)}
                  </Pill>
                ))}
              </Pills>
            </div>
          )}

          <div>
            <SectionLabel>Sort</SectionLabel>
            <YearSelect
              style={{ marginTop: 'var(--space-2)' }}
              value={sortBy}
              onChange={e => onSortChange(e.target.value)}
            >
              <option value="">Default</option>
              <option value="year_desc">Year — Newest First</option>
              <option value="year_asc">Year — Oldest First</option>
              <option value="grade_desc">Grade — Highest First</option>
              <option value="grade_asc">Grade — Lowest First</option>
            </YearSelect>
          </div>
        </AccordionBody>
      )}
    </Wrapper>
  )
}
