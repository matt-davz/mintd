import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { DETAIL_TABLE, HAS_GAME_CONTEXT } from '../lib/itemTypeConfig'

export function useItem(id) {
  const [item, setItem] = useState(null)
  const [signatories, setSignatories] = useState([])
  const [certifications, setCertifications] = useState([])
  const [population, setPopulation] = useState([])
  const [images, setImages] = useState([])
  const [detail, setDetail] = useState(null)
  const [gameContext, setGameContext] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetchRef = useRef(() => {})

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function fetchData() {
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

      // Fetch type-specific detail + game context
      const itemType = itemRes.data.item_type
      const detailTable = itemType ? DETAIL_TABLE[itemType] : null

      if (detailTable) {
        const { data: detailData } = await supabase
          .from(detailTable)
          .select()
          .eq('item_id', id)
          .maybeSingle()

        if (!cancelled && detailData) {
          setDetail(detailData)

          if (HAS_GAME_CONTEXT.has(itemType) && detailData.game_context_id) {
            const { data: gcData } = await supabase
              .from('game_context')
              .select()
              .eq('id', detailData.game_context_id)
              .single()

            if (!cancelled) setGameContext(gcData ?? null)
          }
        }
      }

      // Fetch population data
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

    refetchRef.current = fetchData
    fetchData()
    return () => { cancelled = true }
  }, [id])

  const refetch = useCallback(() => refetchRef.current(), [])

  return { item, signatories, certifications, population, images, detail, gameContext, loading, error, refetch }
}
