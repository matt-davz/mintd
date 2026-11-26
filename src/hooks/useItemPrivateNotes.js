import { useCallback, useEffect, useState } from 'react'
import { useSupabaseClient } from './useSupabaseClient'

const TABLE = 'item_private_notes'
const COLUMNS = 'item_id, body, updated_at'

function friendlyError(error) {
  if (!error) return null
  if (error.code === '42501' || /jwt|permission/i.test(error.message ?? '')) {
    return 'Not authorized — your session may have expired. Sign in again.'
  }
  return error.message || 'Something went wrong.'
}

const CONFLICT_MSG = 'This note was changed elsewhere since it loaded. Click "Reload saved" (your draft is kept), then Discard to see the latest text or Save again to overwrite it.'

/**
 * Private (admin-only) notes for one item. Uses the Clerk-authenticated
 * Supabase client — the table is RLS-locked to `authenticated` and is
 * never readable with the anon key.
 *
 * Saves are guarded by the loaded `updated_at` so a stale editor can't
 * silently overwrite newer text.
 */
export function useItemPrivateNotes(itemId) {
  const supabase = useSupabaseClient()
  const [note, setNote] = useState(null) // { body, updated_at } | null when no row
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!itemId) return
    let cancelled = false
    supabase
      .from(TABLE)
      .select(COLUMNS)
      .eq('item_id', itemId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setLoadError(friendlyError(error))
        else {
          setNote(data)
          setLoadError(null)
        }
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [supabase, itemId, reloadKey])

  const reload = useCallback(() => {
    setLoading(true)
    setReloadKey(k => k + 1)
  }, [])

  const save = useCallback(async (body) => {
    if (note) {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ body })
        .eq('item_id', itemId)
        .eq('updated_at', note.updated_at)
        .select(COLUMNS)
      if (error) throw new Error(friendlyError(error))
      if (!data?.length) throw new Error(CONFLICT_MSG)
      setNote(data[0])
      return data[0]
    }
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ item_id: itemId, body })
      .select(COLUMNS)
      .single()
    if (error) throw new Error(error.code === '23505' ? CONFLICT_MSG : friendlyError(error))
    setNote(data)
    return data
  }, [supabase, itemId, note])

  return { note, loading, loadError, reload, save }
}
