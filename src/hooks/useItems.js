import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('item_cards')
        .select()
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (error) setError(error.message)
      else setItems(data ?? [])
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [])

  return { items, loading, error }
}
