import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'
import { useItemDuplicates } from '../../hooks/useItemDuplicates'

// ─── Accordion header ─────────────────────────────────────────────────────────

const Wrap = styled.div``

const Header = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  padding: var(--space-2) 0;
  cursor: pointer;
  background: none;
  border: none;
  user-select: none;
`

const Chevron = styled.span`
  font-size: 1rem;
  color: var(--color-outline);
  transition: transform 200ms ease;
  transform: rotate(${({ $open }) => $open ? '90deg' : '0deg'});
  flex-shrink: 0;
`

const HeaderLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-outline);
  flex: 1;
`

const Body = styled.div`
  margin-top: var(--space-2);
`

const DupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`

const DupRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  background: var(--color-surface-high);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid rgba(140, 144, 159, 0.12);
`

const Thumb = styled.div`
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-outline);

  img { width: 100%; height: 100%; object-fit: cover; }
  .material-symbols-outlined { font-size: 1.25rem; }
`

const Info = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
`

const TitleBtn = styled.button`
  text-align: left;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover { color: var(--color-primary); }
`

const NotesInput = styled.input`
  width: 100%;
  background: var(--color-surface);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--color-on-surface-variant);

  &::placeholder { color: var(--color-outline); }
  &:focus {
    outline: none;
    border-color: rgba(173, 198, 255, 0.4);
  }
`

const DeleteBtn = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  color: var(--color-outline);
  transition: color var(--transition-base);

  .material-symbols-outlined { font-size: 1.1rem; }
  &:hover { color: var(--color-error); }
`

const Empty = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-outline);
  letter-spacing: 0.05em;
  padding: var(--space-2) 0;
`

// ─── Search ───────────────────────────────────────────────────────────────────

const SearchWrap = styled.div`
  position: relative;
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

const ResultsList = styled.div`
  position: absolute;
  top: calc(100% + var(--space-1));
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--color-surface-bright);
  border: 1px solid rgba(140, 144, 159, 0.2);
  border-radius: var(--radius-sm);
  max-height: 14rem;
  overflow-y: auto;
`

const ResultRow = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-on-surface-variant);

  &:hover { background: var(--color-surface-high); color: var(--color-on-surface); }
`

const ErrorMsg = styled.p`
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-error);
  margin-top: var(--space-2);
`

// ─── Component ────────────────────────────────────────────────────────────────

export function DuplicatesSection({ itemId, onOpenItem }) {
  const [open, setOpen] = useState(false)
  const { links, loading, addDuplicate, removeDuplicate, updateNotes } = useItemDuplicates(itemId)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [notesDraft, setNotesDraft] = useState({})
  const searchWrapRef = useRef(null)

  useEffect(() => {
    if (!search.trim()) return
    let cancelled = false
    const excludeIds = [itemId, ...links.map(l => l.otherItemId)]
    supabase
      .from('items')
      .select('id, title')
      .ilike('title', `%${search.trim()}%`)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(8)
      .then(({ data }) => {
        if (!cancelled) setResults(data ?? [])
      })
    return () => { cancelled = true }
  }, [search, itemId, links])

  useEffect(() => {
    function onClickOutside(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setResults([])
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleAdd(otherItemId) {
    setError(null)
    try {
      await addDuplicate(otherItemId)
      setSearch('')
      setResults([])
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRemove(link) {
    setError(null)
    try {
      await removeDuplicate(link)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleNotesChange(link, value) {
    setNotesDraft(prev => ({ ...prev, [link.otherItemId]: value }))
  }

  async function commitNotes(link) {
    const key = link.otherItemId
    if (!(key in notesDraft) || notesDraft[key] === (link.notes ?? '')) return
    setError(null)
    try {
      await updateNotes(link, notesDraft[key])
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Wrap>
      <Header type="button" onClick={() => setOpen(o => !o)}>
        <Chevron $open={open} className="material-symbols-outlined">chevron_right</Chevron>
        <HeaderLabel>Duplicates{links.length > 0 ? ` (${links.length})` : ''}</HeaderLabel>
      </Header>

      {open && (
        <Body>
          {loading ? (
            <Empty>Loading...</Empty>
          ) : links.length === 0 ? (
            <Empty>No duplicates linked.</Empty>
          ) : (
            <DupList>
              {links.map(link => (
                <DupRow key={link.otherItemId}>
                  <Thumb>
                    {link.otherImageUrl
                      ? <img src={link.otherImageUrl} alt="" />
                      : <span className="material-symbols-outlined">image_not_supported</span>}
                  </Thumb>
                  <Info>
                    <TitleBtn type="button" onClick={() => onOpenItem?.(link.otherItemId)}>
                      {link.otherTitle}
                    </TitleBtn>
                    <NotesInput
                      value={notesDraft[link.otherItemId] ?? link.notes ?? ''}
                      placeholder="Notes..."
                      onChange={e => handleNotesChange(link, e.target.value)}
                      onBlur={() => commitNotes(link)}
                    />
                  </Info>
                  <DeleteBtn type="button" onClick={() => handleRemove(link)} title="Remove duplicate link">
                    <span className="material-symbols-outlined">delete</span>
                  </DeleteBtn>
                </DupRow>
              ))}
            </DupList>
          )}

          <SearchWrap ref={searchWrapRef}>
            <SearchInput
              type="text"
              value={search}
              placeholder="Search items to link as duplicate..."
              onChange={e => setSearch(e.target.value)}
            />
            {search.trim() && results.length > 0 && (
              <ResultsList>
                {results.map(r => (
                  <ResultRow key={r.id} type="button" onClick={() => handleAdd(r.id)}>
                    {r.title}
                  </ResultRow>
                ))}
              </ResultsList>
            )}
          </SearchWrap>

          {error && <ErrorMsg>{error}</ErrorMsg>}
        </Body>
      )}
    </Wrap>
  )
}
