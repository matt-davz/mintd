import { useCallback, useEffect, useState } from 'react'
import { useSupabaseClient } from './useSupabaseClient'
import { HOUSES } from '../lib/auctionWatchlist'

const TABLE = 'auction_watchlist_lots'
const COLUMNS = [
  'id', 'canonical_url', 'source_url', 'house', 'auction_name', 'lot_id', 'lot_number',
  'title', 'priority', 'scheduled_close_at', 'closing_note', 'current_bid', 'currency',
  'bid_checked_at', 'bid_source', 'image_url', 'lot_status', 'refresh_status',
  'refresh_attempted_at', 'last_error',
].join(', ')

function friendlyError(error) {
  if (!error) return null
  if (error.code === '23505') return 'That lot is already on the watchlist.'
  if (error.code === '42501' || /jwt|permission/i.test(error.message ?? '')) {
    return 'Not authorized — your session may have expired. Sign in again.'
  }
  return error.message || 'Something went wrong.'
}

/**
 * Private auction watchlist (admin only). Uses the Clerk-authenticated
 * Supabase client so RLS restricts the table to signed-in users.
 */
export function useAuctionWatchlist() {
  const supabase = useSupabaseClient()
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase
      .from(TABLE)
      .select(COLUMNS)
      .order('scheduled_close_at', { ascending: true, nullsFirst: false })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(friendlyError(err))
        else {
          setLots(data ?? [])
          setError(null)
        }
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [supabase, reloadKey])

  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  const patchLocal = useCallback((row) => {
    setLots(prev => prev.map(l => (l.id === row.id ? row : l)))
  }, [])

  const updateLot = useCallback(async (id, patch) => {
    const { data, error: err } = await supabase.from(TABLE).update(patch).eq('id', id).select(COLUMNS).single()
    if (err) throw new Error(friendlyError(err))
    patchLocal(data)
    return data
  }, [supabase, patchLocal])

  /** Server-side refresh (Edge Function) — only registered lots, rate-limited per lot. */
  const refresh = useCallback(async (lotIds) => {
    const { data, error: err } = await supabase.functions.invoke('auction-watchlist-refresh', {
      body: lotIds ? { lot_ids: lotIds } : {},
    })
    if (err) {
      let message = err.message
      try {
        const body = await err.context?.json?.()
        if (body?.error) message = body.error
      } catch { /* keep generic message */ }
      throw new Error(message || 'Refresh failed.')
    }
    reload()
    return data
  }, [supabase, reload])

  const addLot = useCallback(async (fields) => {
    const { data, error: err } = await supabase.from(TABLE).insert(fields).select(COLUMNS).single()
    if (err) throw new Error(friendlyError(err))
    setLots(prev => [...prev, data])
    let refreshError = null
    if (HOUSES[data.house]?.liveRefresh) {
      try { await refresh([data.id]) } catch (e) { refreshError = e.message }
    }
    return { lot: data, refreshError }
  }, [supabase, refresh])

  const removeLot = useCallback(async (id) => {
    const { error: err } = await supabase.from(TABLE).delete().eq('id', id)
    if (err) throw new Error(friendlyError(err))
    setLots(prev => prev.filter(l => l.id !== id))
  }, [supabase])

  /** Explicit manual price — always flagged bid_source = 'manual'. */
  const setManualPrice = useCallback((id, amount) => updateLot(id, {
    current_bid: amount,
    bid_source: 'manual',
    bid_checked_at: new Date().toISOString(),
    refresh_status: 'manual',
    last_error: null,
  }), [updateLot])

  return { lots, loading, error, reload, refresh, addLot, removeLot, updateLot, setManualPrice }
}
