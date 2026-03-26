import { useState } from 'react'
import styled from 'styled-components'
import { useTags } from '../../hooks/useTags'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4);
`

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;

  .material-symbols-outlined {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-size: 1.125rem;
    pointer-events: none;
  }
`

const SearchInput = styled.input`
  width: 100%;
  background: transparent;
  border: 1px solid #2a2a2a;
  border-radius: var(--radius-full);
  padding: 0.625rem 1.5rem 0.625rem 2.75rem;
  font-family: var(--font-headline);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: var(--color-on-background);
  outline: none;
  transition: border-color var(--transition-base);

  &::placeholder { color: #6b7280; }
  &:focus { border-color: rgba(173, 198, 255, 0.4); }
`

const FilterToggle = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-headline);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${({ $open }) => $open ? 'var(--color-primary)' : '#6b7280'};
  white-space: nowrap;
  transition: color var(--transition-base);
  flex-shrink: 0;

  .material-symbols-outlined {
    font-size: 1rem;
    transition: transform var(--transition-base);
    transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
  }

  @media (min-width: 768px) {
    display: none;
  }
`

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);

  /* On mobile: hidden unless open */
  @media (max-width: 767px) {
    display: ${({ $open }) => $open ? 'flex' : 'none'};
  }
`

const Pill = styled.button`
  padding: 0.5rem 1.5rem;
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

export function FilterBar({ activeTag, onTagChange, search, onSearchChange }) {
  const [pillsOpen, setPillsOpen] = useState(false)
  const { tags } = useTags()

  const typeTags = tags.filter(t => t.category === 'item_type')

  return (
    <Wrapper>
      <TopRow>
        <SearchWrapper>
          <span className="material-symbols-outlined">search</span>
          <SearchInput
            type="text"
            placeholder="Search the archive..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </SearchWrapper>

        <FilterToggle $open={pillsOpen} onClick={() => setPillsOpen(o => !o)}>
          Filters
          <span className="material-symbols-outlined">expand_more</span>
        </FilterToggle>
      </TopRow>

      <Pills $open={pillsOpen}>
        <Pill $active={!activeTag} onClick={() => onTagChange(null)}>
          All
        </Pill>
        {typeTags.map(tag => (
          <Pill
            key={tag.id}
            $active={activeTag === tag.slug}
            onClick={() => onTagChange(tag.slug)}
          >
            {tag.name}
          </Pill>
        ))}
      </Pills>
    </Wrapper>
  )
}
