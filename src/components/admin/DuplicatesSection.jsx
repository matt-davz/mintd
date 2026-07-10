import { useState, useEffect, useMemo, useRef } from 'react'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'
import { useItemDuplicates } from '../../hooks/useItemDuplicates'

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Wrap = styled.div``

const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  user-select: none;
`

const ToggleLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-outline);
`

// ─── Expanded body ──────────────────────────────────────────────────────────

const Body = styled.div`
  margin-top: var(--space-4);
`

const SearchInput = styled.input`
  width: 100%;
  background: var(--color-surface-high);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-on-surface);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.4);
  }
`

// ─── Carousel ─────────────────────────────────────────────────────────────────

const CarouselRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  min-width: 0;
  overflow: hidden;
`

const NavBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-high);
  color: rgba(229, 226, 225, 0.5);
  transition: color var(--transition-base), background-color var(--transition-base);

  .material-symbols-outlined { font-size: 1rem; }

  &:hover {
    color: var(--color-on-surface);
    background-color: var(--color-surface-bright);
  }
`

const Track = styled.div`
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  flex: 1;
  min-width: 0;
  padding-bottom: 2px;
`

const EmptyMsg = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-outline);
  letter-spacing: 0.05em;
  padding: var(--space-4) 0;
`

// ─── Cards ────────────────────────────────────────────────────────────────────

const Card = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 0 0 160px;
  cursor: pointer;
  text-align: left;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-surface-low);
  border: 1px solid ${({ $selected }) => $selected ? 'rgba(173, 198, 255, 0.4)' : 'rgba(140, 144, 159, 0.1)'};
  box-shadow: ${({ $selected }) => $selected ? '0 0 0 1px rgba(173, 198, 255, 0.4)' : 'none'};
  transition: border-color var(--transition-base), box-shadow var(--transition-base);

  &:hover { border-color: rgba(173, 198, 255, 0.3); }
`

const CardImage = styled.div`
  aspect-ratio: 4/5;
  overflow: hidden;
  background-color: var(--color-surface-high);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
    filter: grayscale(20%);
    transition: opacity var(--transition-base), filter var(--transition-base), transform 500ms ease;
  }

  ${Card}:hover & img {
    opacity: 1;
    filter: grayscale(0%);
    transform: scale(1.04);
  }

  .material-symbols-outlined {
    font-size: 2rem;
    color: var(--color-surface-bright);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
`

const CardTitle = styled.p`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding: var(--space-2) var(--space-2);
`

const SelectedBadge = styled.span`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-on-primary);

  .material-symbols-outlined { font-size: 0.875rem; }
`

// ─── Save action ──────────────────────────────────────────────────────────────

const SaveRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
`

const SaveBtn = styled.button`
  padding: 0 var(--space-4);
  height: 2rem;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  color: var(--color-on-primary);
  font-family: var(--font-headline);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: opacity var(--transition-base);

  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const ErrorMsg = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-error);
`

// ─── Component ────────────────────────────────────────────────────────────────

const SCROLL_STEP = 516 // ~3 cards at 160px + gap

export function DuplicatesSection({ itemId, isDuplicate, onDuplicateChange }) {
  const { links, loading, saveDuplicates, clearAllDuplicates } = useItemDuplicates(itemId)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const trackRef = useRef(null)

  const linkedIds = useMemo(() => links.map(l => l.otherItemId), [links])
  const linkedKey = linkedIds.join(',')

  useEffect(() => {
    setSelectedIds(linkedIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedKey])

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([])
      return
    }
    let cancelled = false
    supabase
      .from('item_gallery')
      .select('id, title, primary_image_url')
      .ilike('title', `%${search.trim()}%`)
      .neq('id', itemId)
      .limit(12)
      .then(({ data }) => {
        if (!cancelled) setSearchResults(data ?? [])
      })
    return () => { cancelled = true }
  }, [search, itemId])

  const cards = useMemo(() => {
    const byId = new Map()
    links.forEach(l => byId.set(l.otherItemId, { id: l.otherItemId, title: l.otherTitle, primary_image_url: l.otherImageUrl }))
    searchResults.forEach(r => { if (!byId.has(r.id)) byId.set(r.id, r) })
    return Array.from(byId.values())
  }, [links, searchResults])

  const hasChanges = useMemo(() => {
    const a = [...selectedIds].sort().join(',')
    const b = [...linkedIds].sort().join(',')
    return a !== b
  }, [selectedIds, linkedIds])

  async function handleToggleDuplicate(e) {
    const checked = e.target.checked
    onDuplicateChange?.(checked)
    if (!checked) {
      setError(null)
      try {
        await clearAllDuplicates()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      await saveDuplicates(selectedIds)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function scrollPrev() {
    trackRef.current?.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' })
  }

  function scrollNext() {
    trackRef.current?.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' })
  }

  return (
    <Wrap>
      <ToggleRow>
        <input type="checkbox" checked={!!isDuplicate} onChange={handleToggleDuplicate} />
        <ToggleLabel>Duplicate{linkedIds.length > 0 ? ` (${linkedIds.length})` : ''}</ToggleLabel>
      </ToggleRow>

      {isDuplicate && (
        <Body>
          <SearchInput
            type="text"
            value={search}
            placeholder="Search items to link as duplicate..."
            onChange={e => setSearch(e.target.value)}
          />

          <CarouselRow>
            <NavBtn onClick={scrollPrev} aria-label="Scroll left">
              <span className="material-symbols-outlined">chevron_left</span>
            </NavBtn>
            <Track ref={trackRef}>
              {loading ? (
                <EmptyMsg>Loading...</EmptyMsg>
              ) : cards.length === 0 ? (
                <EmptyMsg>No items found.</EmptyMsg>
              ) : (
                cards.map(c => {
                  const selected = selectedIds.includes(c.id)
                  return (
                    <Card key={c.id} type="button" $selected={selected} onClick={() => toggleSelect(c.id)}>
                      <CardImage>
                        {c.primary_image_url
                          ? <img src={c.primary_image_url} alt={c.title} loading="lazy" />
                          : <span className="material-symbols-outlined">image_not_supported</span>}
                      </CardImage>
                      <CardTitle>{c.title}</CardTitle>
                      {selected && (
                        <SelectedBadge>
                          <span className="material-symbols-outlined">check</span>
                        </SelectedBadge>
                      )}
                    </Card>
                  )
                })
              )}
            </Track>
            <NavBtn onClick={scrollNext} aria-label="Scroll right">
              <span className="material-symbols-outlined">chevron_right</span>
            </NavBtn>
          </CarouselRow>

          <SaveRow>
            <SaveBtn type="button" onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? 'Saving...' : 'Save Duplicates'}
            </SaveBtn>
            {error && <ErrorMsg>{error}</ErrorMsg>}
          </SaveRow>
        </Body>
      )}
    </Wrap>
  )
}
