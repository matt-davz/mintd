import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useItem(id) {
  const [item, setItem] = useState(null)
  const [signatories, setSignatories] = useState([])
  const [certifications, setCertifications] = useState([])
  const [population, setPopulation] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      const [itemRes, sigRes, certRes, imgRes] = await Promise.all([
        supabase.from('items').select().eq('id', id).single(),
        supabase.from('signatories').select().eq('item_id', id).order('display_order'),
        supabase.from('certifications').select().eq('item_id', id),
        supabase.from('images').select().eq('item_id', id).order('display_order'),
      ])

      if (cancelled) return

      if (itemRes.error) {
        setError(itemRes.error.message)
        setLoading(false)
        return
      }

      setItem(itemRes.data)
      setSignatories(sigRes.data ?? [])
      setCertifications(certRes.data ?? [])
      setImages(imgRes.data ?? [])

      // Fetch population for any PSA/PSA-DNA certs
      const psaCerts = (certRes.data ?? []).filter(c =>
        ['PSA', 'PSA/DNA'].includes(c.cert_service)
      )

      if (psaCerts.length > 0) {
        const certIds = psaCerts.map(c => c.id)
        const { data: popData } = await supabase
          .from('latest_population')
          .select()
          .in('cert_id', certIds)

        if (!cancelled) setPopulation(popData ?? [])
      }

      if (!cancelled) setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [id])

  return { item, signatories, certifications, population, images, loading, error }
}
