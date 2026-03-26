import { useState } from 'react'
import styled from 'styled-components'
import { useItems } from '../../hooks/useItems'
import { ItemCard } from '../../components/public/ItemCard'
import { FilterBar } from '../../components/public/FilterBar'

const Page = styled.div`
  max-width: 1536px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-8) var(--space-12);
`

const Hero = styled.div`
  margin-bottom: var(--space-12);
`

const Heading = styled.h1`
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: clamp(3.5rem, 10vw, 7rem);
  letter-spacing: -0.04em;
  text-transform: uppercase;
  line-height: 1;
  color: var(--color-on-background);
  opacity: 0.9;
  margin-bottom: var(--space-12);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-10);

  @media (min-width: 640px)  { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
  @media (min-width: 1280px) { grid-template-columns: repeat(4, 1fr); }
`

const StatusText = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #6b7280;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: var(--space-16);
  text-align: center;
`

export default function Gallery() {
  const [activeTag, setActiveTag] = useState(null)
  const [search, setSearch] = useState('')

  const { items, loading, error } = useItems()

  const filtered = items.filter(item => {
    const matchesTag = !activeTag || (item.tag_slugs ?? []).includes(activeTag)
    const matchesSearch = !search.trim() || item.title.toLowerCase().includes(search.trim().toLowerCase())
    return matchesTag && matchesSearch
  })

  return (
    <Page>
      <Hero>
        <Heading>The Archive</Heading>
        <FilterBar
          activeTag={activeTag}
          onTagChange={setActiveTag}
          search={search}
          onSearchChange={setSearch}
        />
      </Hero>

      {error && <StatusText>Error loading collection: {error}</StatusText>}

      {!error && (
        <>
          <Grid>
            {filtered.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </Grid>

          {!loading && filtered.length === 0 && (
            <StatusText>No items found.</StatusText>
          )}

          {loading && (
            <StatusText>Loading...</StatusText>
          )}
        </>
      )}
    </Page>
  )
}
