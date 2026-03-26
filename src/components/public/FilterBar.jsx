import styled from 'styled-components'
import { useTags } from '../../hooks/useTags'

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
`

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
`

const Pill = styled.button`
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-full);
  font-family: var(--font-headline);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: color var(--transition-base), background-color var(--transition-base), border-color var(--transition-base);

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

const SearchWrapper = styled.div`
  position: relative;
  flex-grow: 1;
  max-width: 28rem;

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

  &:focus {
    border-color: rgba(173, 198, 255, 0.4);
  }
`

export function FilterBar({ activeTag, onTagChange, search, onSearchChange }) {
  const { tags } = useTags()

  // Only show item_type tags in the filter bar
  const typeTags = tags.filter(t => t.category === 'item_type')

  return (
    <Wrapper>
      <Pills>
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

      <SearchWrapper>
        <span className="material-symbols-outlined">search</span>
        <SearchInput
          type="text"
          placeholder="Search the archive..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
      </SearchWrapper>
    </Wrapper>
  )
}
