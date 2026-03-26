import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTags() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('tags')
        .select()
        .order('category')
        .order('name')
      setTags(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  return { tags, loading }
}
