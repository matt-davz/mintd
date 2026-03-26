import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useItems({ tagSlug = null, search = '' } = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      let query = supabase.from('item_cards').select()

      if (tagSlug) {
        query = query.contains('tag_slugs', [tagSlug])
      }

      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (cancelled) return
      if (error) setError(error.message)
      else setItems(data ?? [])
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [tagSlug, search])

  return { items, loading, error }
}
