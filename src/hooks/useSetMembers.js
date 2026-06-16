import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSetMembers(setId, currentItemId) {
  const [members, setMembers] = useState([])
  const [setName, setSetName] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!setId) {
      setMembers([])
      setSetName(null)
      return
    }
    let cancelled = false
    setLoading(true)

    Promise.all([
      supabase
        .from('item_gallery')
        .select()
        .eq('set_id', setId)
        .neq('id', currentItemId)
        .order('created_at', { ascending: true }),
      supabase
        .from('sets')
        .select('name')
        .eq('id', setId)
        .single(),
    ]).then(([membersRes, setRes]) => {
      if (cancelled) return
      setMembers(membersRes.data ?? [])
      setSetName(setRes.data?.name ?? null)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [setId, currentItemId])

  return { members, setName, loading }
}
