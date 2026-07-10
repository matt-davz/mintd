import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

function orderPair(a, b) {
  return a < b ? [a, b] : [b, a]
}

export function useItemDuplicates(itemId) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(false)
  const refetchRef = useRef(() => {})

  useEffect(() => {
    if (!itemId) return
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      const { data: rows } = await supabase
        .from('item_duplicates')
        .select()
        .or(`item_id.eq.${itemId},duplicate_of_id.eq.${itemId}`)

      if (cancelled) return

      const otherIds = (rows ?? []).map(r => r.item_id === itemId ? r.duplicate_of_id : r.item_id)
      let others = []
      if (otherIds.length) {
        const { data } = await supabase
          .from('item_gallery')
          .select('id, title, primary_image_url')
          .in('id', otherIds)
        others = data ?? []
      }

      if (cancelled) return

      setLinks((rows ?? []).map(r => {
        const otherId = r.item_id === itemId ? r.duplicate_of_id : r.item_id
        const other = others.find(o => o.id === otherId)
        return {
          item_id: r.item_id,
          duplicate_of_id: r.duplicate_of_id,
          notes: r.notes,
          otherItemId: otherId,
          otherTitle: other?.title ?? 'Unknown item',
          otherImageUrl: other?.primary_image_url ?? null,
        }
      }))
      setLoading(false)
    }

    refetchRef.current = fetchData
    fetchData()
    return () => { cancelled = true }
  }, [itemId])

  const refetch = useCallback(() => refetchRef.current(), [])

  async function syncIsDuplicateFlag(id) {
    const { count } = await supabase
      .from('item_duplicates')
      .select('*', { count: 'exact', head: true })
      .or(`item_id.eq.${id},duplicate_of_id.eq.${id}`)
    await supabase.from('items').update({ is_duplicate: (count ?? 0) > 0 }).eq('id', id)
  }

  async function addDuplicate(otherItemId) {
    const [lo, hi] = orderPair(itemId, otherItemId)
    const { error } = await supabase.from('item_duplicates').insert({ item_id: lo, duplicate_of_id: hi })
    if (error) throw new Error(error.message)
    await Promise.all([
      supabase.from('items').update({ is_duplicate: true }).eq('id', itemId),
      supabase.from('items').update({ is_duplicate: true }).eq('id', otherItemId),
    ])
    await refetchRef.current()
  }

  async function removeDuplicate(link) {
    const { error } = await supabase
      .from('item_duplicates')
      .delete()
      .eq('item_id', link.item_id)
      .eq('duplicate_of_id', link.duplicate_of_id)
    if (error) throw new Error(error.message)
    await Promise.all([
      syncIsDuplicateFlag(link.item_id),
      syncIsDuplicateFlag(link.duplicate_of_id),
    ])
    await refetchRef.current()
  }

  async function updateNotes(link, notes) {
    const { error } = await supabase
      .from('item_duplicates')
      .update({ notes: notes || null })
      .eq('item_id', link.item_id)
      .eq('duplicate_of_id', link.duplicate_of_id)
    if (error) throw new Error(error.message)
    await refetchRef.current()
  }

  async function saveDuplicates(selectedItemIds) {
    const currentIds = links.map(l => l.otherItemId)
    const toAdd = selectedItemIds.filter(id => !currentIds.includes(id))
    const toRemove = currentIds.filter(id => !selectedItemIds.includes(id))

    if (toAdd.length) {
      const rows = toAdd.map(otherId => {
        const [lo, hi] = orderPair(itemId, otherId)
        return { item_id: lo, duplicate_of_id: hi }
      })
      const { error } = await supabase.from('item_duplicates').insert(rows)
      if (error) throw new Error(error.message)
    }

    if (toRemove.length) {
      const orFilter = toRemove
        .map(otherId => {
          const [lo, hi] = orderPair(itemId, otherId)
          return `and(item_id.eq.${lo},duplicate_of_id.eq.${hi})`
        })
        .join(',')
      const { error } = await supabase.from('item_duplicates').delete().or(orFilter)
      if (error) throw new Error(error.message)
    }

    const affectedIds = new Set([itemId, ...toAdd, ...toRemove])
    await Promise.all(Array.from(affectedIds).map(id => syncIsDuplicateFlag(id)))
    await refetchRef.current()
  }

  async function clearAllDuplicates() {
    const otherIds = links.map(l => l.otherItemId)
    const { error } = await supabase
      .from('item_duplicates')
      .delete()
      .or(`item_id.eq.${itemId},duplicate_of_id.eq.${itemId}`)
    if (error) throw new Error(error.message)
    await Promise.all([itemId, ...otherIds].map(id => syncIsDuplicateFlag(id)))
    await refetchRef.current()
  }

  return {
    links: itemId ? links : [],
    loading,
    refetch,
    addDuplicate,
    removeDuplicate,
    updateNotes,
    saveDuplicates,
    clearAllDuplicates,
  }
}
