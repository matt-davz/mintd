import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSeriesTickets(seasonYear, currentItemId) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!seasonYear || !currentItemId) {
      setTickets([])
      return
    }
    let cancelled = false
    setLoading(true)

    supabase
      .from('item_gallery')
      .select('*')
      .eq('item_type', 'ticket')
      .eq('season_year', seasonYear)
      .not('series_game_number', 'is', null)
      .neq('id', currentItemId)
      .order('series_game_number', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        setTickets(data ?? [])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [seasonYear, currentItemId])

  return { tickets, loading }
}
