import { useState } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  background: transparent;
  border: 1px solid #2a2a2a;
  border-radius: var(--radius-full);
  padding: 0.5rem 1.25rem 0.5rem 2.75rem;
  position: relative;
  transition: border-color var(--transition-base);
  min-height: 2.625rem;

  &:focus-within { border-color: rgba(173, 198, 255, 0.4); }
`

const SearchIcon = styled.span`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 1.125rem;
  pointer-events: none;
`

const ActivePill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.375rem 0.2rem 0.625rem;
  border-radius: var(--radius-full);
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
  font-family: var(--font-headline);
  font-size: 0.625rem;
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
  color: var(--color-on-primary-container);
  opacity: 0.6;
  transition: opacity var(--transition-base);

  &:hover { opacity: 1; }

  .material-symbols-outlined { font-size: 0.875rem; }
`

const SearchInput = styled.input`
  flex: 1;
  min-width: 8rem;
  background: transparent;
  border: none;
  font-family: var(--font-headline);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: var(--color-on-background);
  outline: none;

  &::placeholder { color: #6b7280; }
`

const AccordionToggle = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-headline);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ $open }) => $open ? 'var(--color-primary)' : '#9ca3af'};
  transition: color var(--transition-base);
  align-self: flex-start;
  padding-left: 1rem;

  .material-symbols-outlined {
    font-size: 0.875rem;
    transition: transform var(--transition-base);
    transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
  }

  &:hover { color: ${({ $open }) => $open ? 'var(--color-primary)' : '#9ca3af'}; }
`

const AccordionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4) 0 var(--space-2) 1rem;
  border-top: 1px solid #1a1a1a;
`

const YearSelect = styled.select`
  background: transparent;
  border: 1px solid #2a2a2a;
  border-radius: var(--radius-full);
  padding: 0.4rem 1.25rem;
  font-family: var(--font-headline);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: var(--color-on-background);
  cursor: pointer;
  transition: border-color var(--transition-base);
  align-self: flex-start;

  &:focus { outline: none; border-color: rgba(173, 198, 255, 0.4); }

  option {
    background: #111;
    color: var(--color-on-background);
  }
`

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`

const SectionLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #4b5563;
`

const PillsRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`

const Pills = styled.div`
  display: flex;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;

  ${({ $expanded }) => $expanded ? `
    flex-wrap: wrap;
    overflow: visible;
  ` : `
    flex-wrap: nowrap;
    overflow: hidden;
  `}
`

const ExpandCaret = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #9ca3af;
  transition: color var(--transition-base);

  .material-symbols-outlined {
    font-size: 1rem;
    transition: transform var(--transition-base);
    transform: ${({ $expanded }) => $expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  }

  &:hover { color: var(--color-on-background); }
`

const Pill = styled.button`
  padding: 0.4rem 1.25rem;
  border-radius: var(--radius-full);
  font-family: var(--font-headline);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: color var(--transition-base), background-color var(--transition-base);

  ${({ $active }) => $active ? `
    background-color: var(--color-primary-container);
    color: var(--color-on-primary-container);
    font-weight: 700;
    border: 1px solid transparent;
  ` : `
    background-color: transparent;
    color: #9ca3af;
    border: 1px solid #2a2a2a;

    &:hover {
      color: var(--color-on-background);
      background-color: rgba(255, 255, 255, 0.05);
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

export function FilterBar({
  availableTypes, activeTypes, onTypeToggle, onTypeClear,
  availableTeams, activeTeams, onTeamToggle, onTeamClear,
  availableCertServices, activeCertServices, onCertServiceToggle, onCertServiceClear,
  availableGrades, activeGrades, onGradeToggle, onGradeClear,
  sortBy, onSortChange, search, onSearchChange,
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const toggleSection = key => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))

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
          placeholder={activePills.length ? 'Add keyword...' : 'Search the archive...'}
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
          <FilterSection>
            <SectionLabel>Item Type</SectionLabel>
            <PillsRow>
              <Pills $expanded={!!expandedSections.type}>
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
              <ExpandCaret
                $expanded={!!expandedSections.type}
                onClick={() => toggleSection('type')}
                aria-label={expandedSections.type ? 'Show fewer item types' : 'Show all item types'}
              >
                <span className="material-symbols-outlined">expand_more</span>
              </ExpandCaret>
            </PillsRow>
          </FilterSection>

          {availableTeams.length > 0 && (
            <FilterSection>
              <SectionLabel>Teams</SectionLabel>
              <PillsRow>
                <Pills $expanded={!!expandedSections.team}>
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
                <ExpandCaret
                  $expanded={!!expandedSections.team}
                  onClick={() => toggleSection('team')}
                  aria-label={expandedSections.team ? 'Show fewer teams' : 'Show all teams'}
                >
                  <span className="material-symbols-outlined">expand_more</span>
                </ExpandCaret>
              </PillsRow>
            </FilterSection>
          )}

          {availableCertServices.length > 0 && (
            <FilterSection>
              <SectionLabel>Grade Type</SectionLabel>
              <PillsRow>
                <Pills $expanded={!!expandedSections.certService}>
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
                <ExpandCaret
                  $expanded={!!expandedSections.certService}
                  onClick={() => toggleSection('certService')}
                  aria-label={expandedSections.certService ? 'Show fewer grade types' : 'Show all grade types'}
                >
                  <span className="material-symbols-outlined">expand_more</span>
                </ExpandCaret>
              </PillsRow>
            </FilterSection>
          )}

          {availableGrades.length > 0 && (
            <FilterSection>
              <SectionLabel>Grade</SectionLabel>
              <PillsRow>
                <Pills $expanded={!!expandedSections.grade}>
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
                <ExpandCaret
                  $expanded={!!expandedSections.grade}
                  onClick={() => toggleSection('grade')}
                  aria-label={expandedSections.grade ? 'Show fewer grades' : 'Show all grades'}
                >
                  <span className="material-symbols-outlined">expand_more</span>
                </ExpandCaret>
              </PillsRow>
            </FilterSection>
          )}

          <FilterSection>
            <SectionLabel>Sort</SectionLabel>
            <YearSelect
              value={sortBy}
              onChange={e => onSortChange(e.target.value)}
            >
              <option value="">Default</option>
              <option value="year_desc">Year — Newest First</option>
              <option value="year_asc">Year — Oldest First</option>
              <option value="grade_desc">Grade — Highest First</option>
              <option value="grade_asc">Grade — Lowest First</option>
            </YearSelect>
          </FilterSection>
        </AccordionBody>
      )}
    </Wrapper>
  )
}
