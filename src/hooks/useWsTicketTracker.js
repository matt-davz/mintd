import { useCallback, useEffect, useState } from 'react'
import { useSupabaseClient } from './useSupabaseClient'

/**
 * Reads the WS Ticket Tracker sheet's "Don't Have" World Series games via the
 * `ws-ticket-tracker` Edge Function (Clerk JWT; the Google credential stays
 * server-side).
 *
 * status: 'loading' | 'ready' | 'unconfigured' | 'error'
 * On 'ready': missing = [{ year, game, row }], readAt (ISO), gamesParsed.
 */
export function useWsTicketTracker() {
  const supabase = useSupabaseClient()
  const [state, setState] = useState({ status: 'loading', missing: [], readAt: null, gamesParsed: 0, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase.functions.invoke('ws-ticket-tracker', { body: {} }).then(async ({ data, error }) => {
      if (cancelled) return
      if (error) {
        let body = null
        try { body = await error.context?.json?.() } catch { /* non-JSON error body */ }
        if (cancelled) return
        if (body?.configured === false) {
          setState({ status: 'unconfigured', missing: [], readAt: null, gamesParsed: 0, error: body.error ?? null })
        } else {
          setState({ status: 'error', missing: [], readAt: null, gamesParsed: 0, error: body?.error || error.message || 'Could not read the tracker sheet.' })
        }
        return
      }
      if (!Array.isArray(data?.missing)) {
        setState({ status: 'error', missing: [], readAt: null, gamesParsed: 0, error: 'Unexpected response from the tracker sheet function.' })
        return
      }
      setState({ status: 'ready', missing: data.missing, readAt: data.read_at ?? null, gamesParsed: data.games_parsed ?? 0, error: null })
    })
    return () => { cancelled = true }
  }, [supabase, reloadKey])

  const reload = useCallback(() => {
    setState(s => ({ ...s, status: 'loading', error: null }))
    setReloadKey(k => k + 1)
  }, [])

  return { ...state, reload }
}
