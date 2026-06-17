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

      const [galleryRes, orderRes] = await Promise.all([
        supabase.from('item_gallery').select(),
        supabase.from('item_order').select(),
      ])

      if (cancelled) return

      if (galleryRes.error) {
        setError(galleryRes.error.message)
        setLoading(false)
        return
      }
      if (orderRes.error) {
        setError(orderRes.error.message)
        setLoading(false)
        return
      }

      const orderMap = new Map((orderRes.data ?? []).map(r => [r.item_id, r.display_order]))

      const sorted = [...(galleryRes.data ?? [])].sort((a, b) => {
        const aO = orderMap.get(a.id)
        const bO = orderMap.get(b.id)
        if (aO != null && bO != null) return aO - bO
        if (aO != null) return -1
        if (bO != null) return 1
        return new Date(b.created_at) - new Date(a.created_at)
      })

      setItems(sorted)
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [])

  return { items, loading, error }
}
