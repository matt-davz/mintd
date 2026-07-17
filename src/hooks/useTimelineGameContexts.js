import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { HAS_GAME_CONTEXT, DETAIL_TABLE } from '../lib/itemTypeConfig'

// Batches a game_context lookup for a set of timeline items: one query per
// detail table actually referenced, then one query into game_context.
export function useTimelineGameContexts(items) {
  const [gameContextsByItemId, setGameContextsByItemId] = useState({})

  useEffect(() => {
    const idsByTable = {}
    for (const item of items) {
      if (!item.game_date || !HAS_GAME_CONTEXT.has(item.item_type)) continue
      const table = DETAIL_TABLE[item.item_type]
      ;(idsByTable[table] ??= []).push(item.id)
    }

    if (Object.keys(idsByTable).length === 0) {
      setGameContextsByItemId({})
      return
    }

    let cancelled = false

    async function run() {
      const detailRows = await Promise.all(
        Object.entries(idsByTable).map(([table, ids]) =>
          supabase.from(table).select('item_id, game_context_id').in('item_id', ids)
        )
      )

      const itemIdToGameContextId = {}
      for (const { data } of detailRows) {
        for (const row of data ?? []) {
          if (row.game_context_id) itemIdToGameContextId[row.item_id] = row.game_context_id
        }
      }

      const gameContextIds = [...new Set(Object.values(itemIdToGameContextId))]
      if (gameContextIds.length === 0) {
        if (!cancelled) setGameContextsByItemId({})
        return
      }

      const { data: contexts } = await supabase
        .from('game_context')
        .select('id, home_team, away_team, home_score, away_score')
        .in('id', gameContextIds)

      const gameContextById = Object.fromEntries((contexts ?? []).map(gc => [gc.id, gc]))

      const result = {}
      for (const [itemId, gcId] of Object.entries(itemIdToGameContextId)) {
        if (gameContextById[gcId]) result[itemId] = gameContextById[gcId]
      }

      if (!cancelled) setGameContextsByItemId(result)
    }

    run()
    return () => { cancelled = true }
  }, [items])

  return gameContextsByItemId
}
