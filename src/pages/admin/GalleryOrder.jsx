import { useState, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../../lib/supabase'

// ─── Layout ───────────────────────────────────────────────────────────────────

const PageHeading = styled.div`
  margin-bottom: var(--space-8);
`

const PageTitle = styled.h1`
  font-family: var(--font-headline);
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-on-surface);
  margin-bottom: var(--space-2);
`

const PageSub = styled.p`
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: rgba(229, 226, 225, 0.4);
`

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
`

const SaveBtn = styled.button`
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 600;
  padding: var(--space-2) var(--space-5);
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`

const ResetBtn = styled.button`
  font-family: var(--font-body);
  font-size: 0.875rem;
  padding: var(--space-2) var(--space-4);
  background: transparent;
  color: var(--color-outline);
  border: 1px solid rgba(140, 144, 159, 0.3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: var(--color-on-surface);
    border-color: rgba(140, 144, 159, 0.6);
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`

const DirtyDot = styled.span`
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  border-radius: 50%;
  display: inline-block;
  margin-left: var(--space-1);
`

const DirtyLabel = styled.span`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
`

const ErrorBanner = styled.div`
  background: var(--color-error-container);
  color: var(--color-on-error-container);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);
`

// ─── Sections ─────────────────────────────────────────────────────────────────

const Section = styled.section`
  margin-bottom: var(--space-10);
`

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid rgba(66, 71, 84, 0.5);
`

const SectionTitle = styled.h2`
  font-family: var(--font-headline);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-on-surface);
`

const SectionCount = styled.span`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-outline);
`

const EmptyState = styled.div`
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: rgba(229, 226, 225, 0.3);
  padding: var(--space-8) 0;
  text-align: center;
  border: 1px dashed rgba(66, 71, 84, 0.5);
  border-radius: var(--radius-lg);
`

// ─── Pinned list ──────────────────────────────────────────────────────────────

const PinnedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`

const CardRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: ${({ $dragging }) => $dragging ? 'var(--color-surface-high)' : 'var(--color-surface-low)'};
  border: 1px solid ${({ $dragging }) => $dragging ? 'var(--color-primary)' : 'transparent'};
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-3);
  transition: background 0.1s, border-color 0.1s;
  opacity: ${({ $dragging }) => $dragging ? 0.85 : 1};
  cursor: default;
`

const DragHandle = styled.div`
  color: var(--color-outline);
  cursor: grab;
  display: flex;
  align-items: center;
  flex-shrink: 0;

  &:active {
    cursor: grabbing;
  }

  .material-symbols-outlined {
    font-size: 1.1rem;
  }
`

const PositionBadge = styled.div`
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-outline);
  width: 24px;
  text-align: right;
  flex-shrink: 0;
`

const Thumbnail = styled.img`
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  background: var(--color-surface-high);
`

const ThumbnailPlaceholder = styled.div`
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-high);
  flex-shrink: 0;
`

const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const CardTitle = styled.div`
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CardMeta = styled.div`
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-outline);
  margin-top: 2px;
`

const UnpinBtn = styled.button`
  font-family: var(--font-mono);
  font-size: 0.7rem;
  padding: var(--space-1) var(--space-2);
  background: transparent;
  color: var(--color-outline);
  border: 1px solid rgba(140, 144, 159, 0.25);
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: var(--color-error);
    border-color: rgba(255, 180, 171, 0.4);
  }
`

// ─── Unpinned grid ────────────────────────────────────────────────────────────

const UnpinnedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-2);
`

const GridCard = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-surface-low);
  border-radius: var(--radius-md);
  padding: var(--space-3);
`

const PinBtn = styled.button`
  font-family: var(--font-mono);
  font-size: 0.7rem;
  padding: var(--space-1) var(--space-2);
  background: transparent;
  color: var(--color-primary);
  border: 1px solid rgba(173, 198, 255, 0.3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover {
    background: rgba(173, 198, 255, 0.08);
  }
`

const SearchInput = styled.input`
  font-family: var(--font-body);
  font-size: 0.875rem;
  width: 100%;
  max-width: 360px;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-low);
  color: var(--color-on-surface);
  border: 1px solid rgba(66, 71, 84, 0.6);
  border-radius: var(--radius-md);
  outline: none;
  margin-bottom: var(--space-4);
  transition: border-color 0.15s;

  &::placeholder {
    color: var(--color-outline);
  }

  &:focus {
    border-color: var(--color-primary);
  }
`

// ─── Sortable card ────────────────────────────────────────────────────────────

function SortableCard({ item, position, onUnpin }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <CardRow ref={setNodeRef} style={style} $dragging={isDragging}>
      <DragHandle {...attributes} {...listeners}>
        <span className="material-symbols-outlined">drag_indicator</span>
      </DragHandle>
      <PositionBadge>{position}</PositionBadge>
      {item.primary_image_url
        ? <Thumbnail src={item.primary_image_url} alt={item.title} />
        : <ThumbnailPlaceholder />
      }
      <CardInfo>
        <CardTitle title={item.title}>{item.title}</CardTitle>
        <CardMeta>{[item.item_type, item.season_year].filter(Boolean).join(' · ')}</CardMeta>
      </CardInfo>
      <UnpinBtn onClick={() => onUnpin(item.id)}>Remove</UnpinBtn>
    </CardRow>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GalleryOrder() {
  const [allItems, setAllItems] = useState([])
  const [pinnedIds, setPinnedIds] = useState([])
  const [savedPinnedIds, setSavedPinnedIds] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const [itemsRes, orderRes] = await Promise.all([
        supabase.from('item_gallery').select('id, title, item_type, season_year, primary_image_url').order('created_at', { ascending: false }),
        supabase.from('item_order').select('item_id, display_order').order('display_order', { ascending: true }),
      ])

      if (itemsRes.error) { setError(itemsRes.error.message); setLoading(false); return }
      if (orderRes.error) { setError(orderRes.error.message); setLoading(false); return }

      setAllItems(itemsRes.data ?? [])

      const ordered = (orderRes.data ?? []).map(r => r.item_id)
      setPinnedIds(ordered)
      setSavedPinnedIds(ordered)
      setLoading(false)
    }

    load()
  }, [])

  const pinnedItems = useMemo(() => {
    const map = new Map(allItems.map(i => [i.id, i]))
    return pinnedIds.map(id => map.get(id)).filter(Boolean)
  }, [allItems, pinnedIds])

  const unpinnedItems = useMemo(() => {
    const pinned = new Set(pinnedIds)
    return allItems.filter(i => !pinned.has(i.id))
  }, [allItems, pinnedIds])

  const filteredUnpinned = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return unpinnedItems
    return unpinnedItems.filter(i =>
      i.title.toLowerCase().includes(q) ||
      (i.item_type && i.item_type.toLowerCase().includes(q)) ||
      (i.season_year && String(i.season_year).includes(q))
    )
  }, [unpinnedItems, search])

  const isDirty = pinnedIds.join(',') !== savedPinnedIds.join(',')

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setPinnedIds(ids => {
      const oldIndex = ids.indexOf(active.id)
      const newIndex = ids.indexOf(over.id)
      return arrayMove(ids, oldIndex, newIndex)
    })
  }

  function handlePin(itemId) {
    setPinnedIds(ids => [...ids, itemId])
  }

  function handleUnpin(itemId) {
    setPinnedIds(ids => ids.filter(id => id !== itemId))
  }

  function handleReset() {
    setPinnedIds([...savedPinnedIds])
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const removedIds = savedPinnedIds.filter(id => !pinnedIds.includes(id))

      if (pinnedIds.length > 0) {
        const rows = pinnedIds.map((id, index) => ({ item_id: id, display_order: index + 1 }))
        const { error: upsertErr } = await supabase
          .from('item_order')
          .upsert(rows, { onConflict: 'item_id' })
        if (upsertErr) throw upsertErr
      }

      if (removedIds.length > 0) {
        const { error: deleteErr } = await supabase
          .from('item_order')
          .delete()
          .in('item_id', removedIds)
        if (deleteErr) throw deleteErr
      }

      setSavedPinnedIds([...pinnedIds])
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div>
      <PageHeading>
        <PageTitle>Gallery Order</PageTitle>
        <PageSub>Pinned items appear first in the public gallery in the order set below. All other items follow in default order.</PageSub>
      </PageHeading>

      <ActionBar>
        <SaveBtn onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? 'Saving…' : 'Save Order'}
        </SaveBtn>
        <ResetBtn onClick={handleReset} disabled={!isDirty || saving}>
          Reset
        </ResetBtn>
        {isDirty && (
          <DirtyLabel>
            <DirtyDot />
            Unsaved changes
          </DirtyLabel>
        )}
      </ActionBar>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Section>
        <SectionHeader>
          <SectionTitle>Pinned Items</SectionTitle>
          <SectionCount>{pinnedItems.length} item{pinnedItems.length !== 1 ? 's' : ''}</SectionCount>
        </SectionHeader>

        {pinnedItems.length === 0 ? (
          <EmptyState>No items pinned — use the &ldquo;+ Pin&rdquo; buttons below to curate the gallery front.</EmptyState>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pinnedIds} strategy={verticalListSortingStrategy}>
              <PinnedList>
                {pinnedItems.map((item, index) => (
                  <SortableCard
                    key={item.id}
                    item={item}
                    position={index + 1}
                    onUnpin={handleUnpin}
                  />
                ))}
              </PinnedList>
            </SortableContext>
          </DndContext>
        )}
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>All Items</SectionTitle>
          <SectionCount>{unpinnedItems.length} item{unpinnedItems.length !== 1 ? 's' : ''} not pinned</SectionCount>
        </SectionHeader>

        {unpinnedItems.length === 0 ? (
          <EmptyState>All items are pinned.</EmptyState>
        ) : (
          <>
            <SearchInput
              type="text"
              placeholder="Search by title, type, or year…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {filteredUnpinned.length === 0 ? (
              <EmptyState>No items match &ldquo;{search}&rdquo;</EmptyState>
            ) : (
              <UnpinnedGrid>
                {filteredUnpinned.map(item => (
                  <GridCard key={item.id}>
                    {item.primary_image_url
                      ? <Thumbnail src={item.primary_image_url} alt={item.title} />
                      : <ThumbnailPlaceholder />
                    }
                    <CardInfo>
                      <CardTitle title={item.title}>{item.title}</CardTitle>
                      <CardMeta>{[item.item_type, item.season_year].filter(Boolean).join(' · ')}</CardMeta>
                    </CardInfo>
                    <PinBtn onClick={() => handlePin(item.id)}>+ Pin</PinBtn>
                  </GridCard>
                ))}
              </UnpinnedGrid>
            )}
          </>
        )}
      </Section>
    </div>
  )
}
