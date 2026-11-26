import { useEffect, useMemo, useState } from 'react'
import { useSupabaseClient } from './useSupabaseClient'

// Item metadata (title, type, primary image) for every item linked to a
// Yankees World Series game in the admin WS Ticket Quest.
//
// Gallery items already loaded by the Dashboard are reused as-is. Linked items
// that aren't in `item_gallery` (hidden / non-baseball items — the view filters
// them out) are fetched with the Clerk-authenticated client, only for the IDs
// the gallery doesn't cover.
//
// Returns { itemsById, pending, failed }:
//   itemsById — Map<id, { id, title, item_type, primary_image_url, hidden }>
//   pending   — true while the extra lookup is in flight
//   failed    — true if the extra lookup errored (IDs absent from itemsById
//               should then render as "details unavailable", still owned)
export function useWsQuestItems(series, galleryItems, galleryLoading) {
  const supabase = useSupabaseClient()

  const galleryById = useMemo(() => {
    const map = new Map()
    for (const item of galleryItems ?? []) {
      map.set(item.id, {
        id: item.id,
        title: item.title,
        item_type: item.item_type,
        primary_image_url: item.primary_image_url ?? null,
        hidden: false,
      })
    }
    return map
  }, [galleryItems])

  // Sorted, joined key so the effect only reruns when the missing set changes.
  const missingKey = useMemo(() => {
    if (galleryLoading) return ''
    const ids = new Set()
    for (const s of series) {
      for (const g of s.games) {
        for (const id of g.itemIds) if (!galleryById.has(id)) ids.add(id)
      }
    }
    return [...ids].sort().join(',')
  }, [series, galleryById, galleryLoading])

  const [extra, setExtra] = useState({ key: '', byId: new Map(), failed: false })

  useEffect(() => {
    if (!missingKey) return
    let cancelled = false
    const ids = missingKey.split(',')
    supabase
      .from('items')
      .select('id, title, item_type, images(cloudinary_url, is_primary, display_order)')
      .in('id', ids)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Failed to load WS quest item details', error)
        const byId = new Map()
        for (const row of data ?? []) {
          const imgs = [...(row.images ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          const primary = imgs.find(i => i.is_primary) ?? imgs[0]
          byId.set(row.id, {
            id: row.id,
            title: row.title,
            item_type: row.item_type,
            primary_image_url: primary?.cloudinary_url ?? null,
            hidden: true,
          })
        }
        setExtra({ key: missingKey, byId, failed: !!error })
      })
    return () => { cancelled = true }
  }, [supabase, missingKey])

  const extraReady = !missingKey || extra.key === missingKey

  const itemsById = useMemo(() => {
    if (!extraReady || extra.byId.size === 0) return galleryById
    const merged = new Map(galleryById)
    for (const [id, item] of extra.byId) merged.set(id, item)
    return merged
  }, [galleryById, extra, extraReady])

  return {
    itemsById,
    pending: galleryLoading || !extraReady,
    failed: extraReady && !!missingKey && extra.failed,
  }
}
