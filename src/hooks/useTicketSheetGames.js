import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Loads the game contexts on a ticket_sheet item.
//   item.id → item_ticket_sheets (sheetId)
//           → ticket_sheet_games joined with game_context, ordered by display_order
//
// Returns { games, sheetId, loading, refetch }. `games` rows carry the junction
// fields (display_order, is_phantom, game_label) plus a nested `game_context`.
export function useTicketSheetGames(itemId) {
  const [games, setGames] = useState([])
  const [sheetId, setSheetId] = useState(null)
  const [loading, setLoading] = useState(false)
  const refetchRef = useRef(() => {})

  useEffect(() => {
    if (!itemId) {
      setGames([])
      setSheetId(null)
      return
    }
    let cancelled = false

    async function run() {
      setLoading(true)

      const { data: sheet } = await supabase
        .from('item_ticket_sheets')
        .select('id')
        .eq('item_id', itemId)
        .maybeSingle()

      if (cancelled) return

      if (!sheet) {
        setSheetId(null)
        setGames([])
        setLoading(false)
        return
      }

      setSheetId(sheet.id)

      const { data } = await supabase
        .from('ticket_sheet_games')
        .select('*, game_context(*)')
        .eq('ticket_sheet_id', sheet.id)
        .order('display_order', { ascending: true })

      if (cancelled) return
      setGames(data ?? [])
      setLoading(false)
    }

    refetchRef.current = run
    run()
    return () => { cancelled = true }
  }, [itemId])

  const refetch = useCallback(() => refetchRef.current(), [])

  return { games, sheetId, loading, refetch }
}
