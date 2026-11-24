// Yankees World Series ticket completion — shared by the public Museum timeline
// and the admin Dashboard "WS Ticket Quest".
//
// A game counts as collected when at least one ticket (item_tickets) or a
// NON-phantom ticket sheet game (ticket_sheet_games) links to its game_context.
// A series is complete only when EVERY game number 1..N is covered — never by
// comparing the number of assets to the game count.

// Number of games the Yankees played in each World Series they appeared in.
export const YANKEES_WS_GAMES = {
  1921: 8, 1922: 5, 1923: 6, 1926: 7, 1927: 4, 1928: 4, 1932: 4,
  1936: 6, 1937: 5, 1938: 4, 1939: 4, 1941: 5, 1942: 5, 1943: 5,
  1947: 7, 1949: 5, 1950: 4, 1951: 6, 1952: 7, 1953: 6, 1955: 7,
  1956: 7, 1957: 7, 1958: 7, 1960: 7, 1961: 5, 1962: 7, 1963: 4,
  1964: 7, 1976: 4, 1977: 6, 1978: 6, 1981: 6, 1996: 6, 1998: 4,
  1999: 4, 2000: 5, 2001: 7, 2003: 6, 2009: 6, 2024: 5,
}

export function isYankeesTeam(name) {
  return name === 'New York Yankees' || name === 'NYY'
}

const GC_COLS = 'id, season_year, series_game_number, home_team, away_team, home_score, away_score, game_date, game_type'

// Fetches every World Series ticket / non-phantom sheet game link.
// Uses only tables with public read policies (item_tickets, item_ticket_sheets,
// ticket_sheet_games, game_context), so it is safe on the public site.
// Note: item_tickets is readable for hidden items too — public callers must
// pass `includeItem` to buildYankeesWsSeries to restrict to visible items.
//
// Returns { links, error } where each link is { itemId, source, gameContext }.
export async function fetchWorldSeriesTicketLinks(supabase) {
  const [ticketRes, sheetRes] = await Promise.all([
    supabase
      .from('item_tickets')
      .select(`item_id, game_context!inner(${GC_COLS})`)
      .eq('game_context.game_type', 'world_series'),
    supabase
      .from('ticket_sheet_games')
      .select(`is_phantom, item_ticket_sheets!inner(item_id), game_context!inner(${GC_COLS})`)
      .eq('game_context.game_type', 'world_series')
      .eq('is_phantom', false),
  ])

  const error = ticketRes.error ?? sheetRes.error
  if (error) return { links: [], error }

  const links = [
    ...(ticketRes.data ?? []).map(r => ({ itemId: r.item_id, source: 'ticket', gameContext: r.game_context })),
    ...(sheetRes.data ?? [])
      .filter(r => !r.is_phantom && r.item_ticket_sheets?.item_id)
      .map(r => ({ itemId: r.item_ticket_sheets.item_id, source: 'sheet', gameContext: r.game_context })),
  ]
  return { links, error: null }
}

// Builds one record per Yankees World Series year (chronological):
//   { year, totalGames, games: [{ number, gameContext, itemIds }],
//     ownedSet, ownedCount, isComplete, startDate }
// `includeItem(itemId)` optionally restricts which items count (e.g. public-visible only).
export function buildYankeesWsSeries(links, { includeItem } = {}) {
  const byYear = new Map()
  for (const [yearStr, totalGames] of Object.entries(YANKEES_WS_GAMES)) {
    const games = Array.from({ length: totalGames }, (_, i) => ({ number: i + 1, gameContext: null, itemIds: [] }))
    byYear.set(Number(yearStr), { year: Number(yearStr), totalGames, games })
  }

  // Tickets first so they lead each game's item list; sheets follow.
  const ordered = [...links].sort((a, b) => (a.source === b.source ? 0 : a.source === 'ticket' ? -1 : 1))

  for (const { itemId, gameContext: gc } of ordered) {
    if (!gc || !itemId) continue
    if (includeItem && !includeItem(itemId)) continue
    const series = byYear.get(gc.season_year)
    const game = gc.series_game_number
    if (!series || !Number.isInteger(game) || game < 1 || game > series.totalGames) continue
    if (!isYankeesTeam(gc.home_team) && !isYankeesTeam(gc.away_team)) continue

    const slot = series.games[game - 1]
    if (!slot.itemIds.includes(itemId)) slot.itemIds.push(itemId)
    // Prefer a game context that carries a final score
    if (!slot.gameContext || (slot.gameContext.home_score == null && gc.home_score != null)) {
      slot.gameContext = gc
    }
  }

  return [...byYear.values()].map(series => {
    const ownedSet = new Set(series.games.filter(g => g.itemIds.length > 0).map(g => g.number))
    const dates = series.games.map(g => g.gameContext?.game_date).filter(Boolean).sort()
    return {
      ...series,
      ownedSet,
      ownedCount: ownedSet.size,
      isComplete: series.games.every(g => g.itemIds.length > 0),
      startDate: dates[0] ?? null,
    }
  })
}

// "Game 3" · "Games 3–5" · "Games 1, 3"
export function formatGameList(numbers) {
  const nums = [...new Set(numbers)].sort((a, b) => a - b)
  if (nums.length === 0) return ''
  if (nums.length === 1) return `Game ${nums[0]}`
  const contiguous = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1)
  return contiguous ? `Games ${nums[0]}–${nums[nums.length - 1]}` : `Games ${nums.join(', ')}`
}

// Attaches gallery item records to a series from buildYankeesWsSeries.
// Adds games[].items and itemGames (itemId -> game numbers it covers in this series).
export function resolveSeriesItems(series, itemsById) {
  const itemGames = new Map()
  const games = series.games.map(game => {
    const items = game.itemIds.map(id => itemsById.get(id)).filter(Boolean)
    for (const item of items) {
      if (!itemGames.has(item.id)) itemGames.set(item.id, [])
      itemGames.get(item.id).push(game.number)
    }
    return { ...game, items }
  })
  return { ...series, games, itemGames }
}

// One representative item per game for the series collage, in game order.
// A sheet spanning several games appears once; items with images are preferred.
export function seriesCollageTiles(series) {
  const used = new Set()
  const tiles = []
  for (const game of series.games) {
    const fresh = game.items.filter(i => !used.has(i.id))
    const pick = fresh.find(i => i.primary_image_url) ?? fresh[0]
    if (!pick) continue
    used.add(pick.id)
    tiles.push({ item: pick, games: series.itemGames.get(pick.id) ?? [game.number] })
  }
  return tiles
}
