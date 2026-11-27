import { useCallback, useEffect, useState } from 'react'
import { useSupabaseClient } from './useSupabaseClient'

const TABLE = 'auction_price_comps'
const COLUMNS = [
  'id', 'auction_house', 'auction_name', 'lot_number', 'title', 'source_url', 'scheduled_close_at',
  'owned_item_id', 'final_price', 'currency', 'price_basis', 'result_url', 'verified_at', 'notes', 'updated_at',
  'owned_item:items(id, title)',
].join(', ')

const CONFLICT_MSG = 'This comp was changed elsewhere since it loaded. Reload the page and try again.'

function friendlyError(error) {
  if (!error) return null
  if (error.code === '23505') return 'That lot URL is already tracked as a comp.'
  if (error.code === '23514') return 'The database rejected these values (check URLs, price and that the result is after the scheduled close).'
  if (error.code === '42501' || /jwt|permission/i.test(error.message ?? '')) {
    return 'Not authorized — your session may have expired. Sign in again.'
  }
  return error.message || 'Something went wrong.'
}

/**
 * Private auction price comps (admin only). Uses the Clerk-authenticated
 * Supabase client — the table is RLS-locked to `authenticated` and is never
 * readable with the anon key. Updates are guarded by the loaded `updated_at`
 * so a stale page can't silently overwrite a newer result.
 */
export function useAuctionPriceComps() {
  const supabase = useSupabaseClient()
  const [comps, setComps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase
      .from(TABLE)
      .select(COLUMNS)
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(friendlyError(err))
        else {
          setComps(data ?? [])
          setError(null)
        }
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [supabase, reloadKey])

  const reload = useCallback(() => {
    setLoading(true)
    setReloadKey(k => k + 1)
  }, [])

  const addComp = useCallback(async (fields) => {
    const { data, error: err } = await supabase.from(TABLE).insert(fields).select(COLUMNS).single()
    if (err) throw new Error(friendlyError(err))
    setComps(prev => [...prev, data])
    return data
  }, [supabase])

  const updateComp = useCallback(async (comp, patch) => {
    const { data, error: err } = await supabase
      .from(TABLE)
      .update(patch)
      .eq('id', comp.id)
      .eq('updated_at', comp.updated_at)
      .select(COLUMNS)
    if (err) throw new Error(friendlyError(err))
    if (!data?.length) throw new Error(CONFLICT_MSG)
    setComps(prev => prev.map(c => (c.id === comp.id ? data[0] : c)))
    return data[0]
  }, [supabase])

  const removeComp = useCallback(async (id) => {
    const { error: err } = await supabase.from(TABLE).delete().eq('id', id)
    if (err) throw new Error(friendlyError(err))
    setComps(prev => prev.filter(c => c.id !== id))
  }, [supabase])

  return { comps, loading, error, reload, addComp, updateComp, removeComp }
}

/** Owned items for the comp form's item picker (all items, incl. hidden). Loads only when `enabled`. */
export function useOwnedItemOptions(enabled) {
  const supabase = useSupabaseClient()
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || items) return
    let cancelled = false
    supabase
      .from('items')
      .select('id, title')
      .order('title', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(friendlyError(err))
        else setItems(data ?? [])
      })
    return () => { cancelled = true }
  }, [supabase, enabled, items])

  return { items, error }
}
