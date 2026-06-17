import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('teams')
        .select()
        .order('name')
      setTeams(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  return { teams, loading }
}
