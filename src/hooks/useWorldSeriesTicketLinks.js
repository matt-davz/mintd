import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchWorldSeriesTicketLinks } from '../lib/worldSeries'

// Loads every World Series ticket / non-phantom ticket-sheet game link once.
// Feed `links` into buildYankeesWsSeries (src/lib/worldSeries.js) to get
// per-year completion.
export function useWorldSeriesTicketLinks() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchWorldSeriesTicketLinks(supabase).then(({ links, error }) => {
      if (cancelled) return
      if (error) console.error('Failed to load World Series ticket links', error)
      setLinks(links)
      setError(error?.message ?? null)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return { links, loading, error }
}
