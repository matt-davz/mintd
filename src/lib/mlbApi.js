// ─── MLB Stats API — game lookup & team data ─────────────────────────────────
// Pure data + fetch functions. No React imports.

const MLB_BASE = 'https://statsapi.mlb.com/api/v1'

// ─── Team Data ───────────────────────────────────────────────────────────────

export const CURRENT_TEAMS = [
  { id: 108, abbrev: 'LAA',  name: 'Los Angeles Angels',     city: 'Anaheim',        league: 'AL' },
  { id: 109, abbrev: 'AZ',   name: 'Arizona Diamondbacks',   city: 'Phoenix',        league: 'NL' },
  { id: 110, abbrev: 'BAL',  name: 'Baltimore Orioles',      city: 'Baltimore',      league: 'AL' },
  { id: 111, abbrev: 'BOS',  name: 'Boston Red Sox',         city: 'Boston',         league: 'AL' },
  { id: 112, abbrev: 'CHC',  name: 'Chicago Cubs',           city: 'Chicago',        league: 'NL' },
  { id: 113, abbrev: 'CIN',  name: 'Cincinnati Reds',        city: 'Cincinnati',     league: 'NL' },
  { id: 114, abbrev: 'CLE',  name: 'Cleveland Guardians',    city: 'Cleveland',      league: 'AL' },
  { id: 115, abbrev: 'COL',  name: 'Colorado Rockies',       city: 'Denver',         league: 'NL' },
  { id: 116, abbrev: 'DET',  name: 'Detroit Tigers',         city: 'Detroit',        league: 'AL' },
  { id: 117, abbrev: 'HOU',  name: 'Houston Astros',         city: 'Houston',        league: 'AL' },
  { id: 118, abbrev: 'KC',   name: 'Kansas City Royals',     city: 'Kansas City',    league: 'AL' },
  { id: 119, abbrev: 'LAD',  name: 'Los Angeles Dodgers',    city: 'Los Angeles',    league: 'NL' },
  { id: 120, abbrev: 'WSH',  name: 'Washington Nationals',   city: 'Washington',     league: 'NL' },
  { id: 121, abbrev: 'NYM',  name: 'New York Mets',          city: 'New York',       league: 'NL' },
  { id: 133, abbrev: 'OAK',  name: 'Athletics',              city: 'Sacramento',     league: 'AL' },
  { id: 134, abbrev: 'PIT',  name: 'Pittsburgh Pirates',     city: 'Pittsburgh',     league: 'NL' },
  { id: 135, abbrev: 'SD',   name: 'San Diego Padres',       city: 'San Diego',      league: 'NL' },
  { id: 136, abbrev: 'SEA',  name: 'Seattle Mariners',       city: 'Seattle',        league: 'AL' },
  { id: 137, abbrev: 'SF',   name: 'San Francisco Giants',   city: 'San Francisco',  league: 'NL' },
  { id: 138, abbrev: 'STL',  name: 'St. Louis Cardinals',    city: 'St. Louis',      league: 'NL' },
  { id: 139, abbrev: 'TB',   name: 'Tampa Bay Rays',         city: 'St. Petersburg', league: 'AL' },
  { id: 140, abbrev: 'TEX',  name: 'Texas Rangers',          city: 'Arlington',      league: 'AL' },
  { id: 141, abbrev: 'TOR',  name: 'Toronto Blue Jays',      city: 'Toronto',        league: 'AL' },
  { id: 142, abbrev: 'MIN',  name: 'Minnesota Twins',        city: 'Minneapolis',    league: 'AL' },
  { id: 143, abbrev: 'PHI',  name: 'Philadelphia Phillies',  city: 'Philadelphia',   league: 'NL' },
  { id: 144, abbrev: 'ATL',  name: 'Atlanta Braves',         city: 'Atlanta',        league: 'NL' },
  { id: 145, abbrev: 'CWS',  name: 'Chicago White Sox',      city: 'Chicago',        league: 'AL' },
  { id: 146, abbrev: 'MIA',  name: 'Miami Marlins',          city: 'Miami',          league: 'NL' },
  { id: 147, abbrev: 'NYY',  name: 'New York Yankees',       city: 'New York',       league: 'AL' },
  { id: 158, abbrev: 'MIL',  name: 'Milwaukee Brewers',      city: 'Milwaukee',      league: 'NL' },
]

export const HISTORICAL_TEAMS = [
  // Relocated / renamed franchises the API returns with their period-accurate names
  { id: 119, abbrev: 'BRK',  name: 'Brooklyn Dodgers',          city: 'Brooklyn',       league: 'NL' },
  { id: 137, abbrev: 'NYG',  name: 'New York Giants',           city: 'New York',       league: 'NL' },
  { id: 133, abbrev: 'PHA',  name: 'Philadelphia Athletics',    city: 'Philadelphia',   league: 'AL' },
  { id: 133, abbrev: 'KCA',  name: 'Kansas City Athletics',     city: 'Kansas City',    league: 'AL' },
  { id: 133, abbrev: 'OAK',  name: 'Oakland Athletics',         city: 'Oakland',        league: 'AL' },
  { id: 142, abbrev: 'WSH',  name: 'Washington Senators',       city: 'Washington',     league: 'AL' },
  { id: 120, abbrev: 'MON',  name: 'Montreal Expos',            city: 'Montreal',       league: 'NL' },
  { id: 144, abbrev: 'BSN',  name: 'Boston Braves',             city: 'Boston',         league: 'NL' },
  { id: 144, abbrev: 'MLN',  name: 'Milwaukee Braves',          city: 'Milwaukee',      league: 'NL' },
  { id: 158, abbrev: 'SEP',  name: 'Seattle Pilots',            city: 'Seattle',        league: 'AL' },
  { id: 139, abbrev: 'TBD',  name: 'Tampa Bay Devil Rays',      city: 'St. Petersburg', league: 'AL' },
  { id: 146, abbrev: 'FLA',  name: 'Florida Marlins',           city: 'Miami',          league: 'NL' },
  { id: 117, abbrev: 'HOU',  name: 'Houston Colt .45s',         city: 'Houston',        league: 'NL' },
  { id: 114, abbrev: 'CLE',  name: 'Cleveland Indians',         city: 'Cleveland',      league: 'AL' },
  { id: 114, abbrev: 'CLE',  name: 'Cleveland Naps',            city: 'Cleveland',      league: 'AL' },
  { id: 108, abbrev: 'CAL',  name: 'California Angels',         city: 'Anaheim',        league: 'AL' },
  { id: 108, abbrev: 'ANA',  name: 'Anaheim Angels',            city: 'Anaheim',        league: 'AL' },
  { id: 138, abbrev: 'STL',  name: 'St. Louis Browns',          city: 'St. Louis',      league: 'AL' },
  { id: 113, abbrev: 'CIN',  name: 'Cincinnati Redlegs',        city: 'Cincinnati',     league: 'NL' },
  { id: 134, abbrev: 'PIT',  name: 'Pittsburg Pirates',         city: 'Pittsburgh',     league: 'NL' },
]

export const ALL_TEAMS = [...CURRENT_TEAMS, ...HISTORICAL_TEAMS]

// ─── Lookup Maps ─────────────────────────────────────────────────────────────

// Full API name → abbreviation (populated from ALL_TEAMS)
const TEAM_NAME_TO_ABBREV = Object.fromEntries(
  ALL_TEAMS.map(t => [t.name, t.abbrev])
)

// Team ID → city (use current team data as canonical)
const TEAM_ID_TO_CITY = Object.fromEntries(
  CURRENT_TEAMS.map(t => [t.id, t.city])
)

// Team ID → league ('AL' | 'NL')
const TEAM_ID_TO_LEAGUE = Object.fromEntries(
  CURRENT_TEAMS.map(t => [t.id, t.league])
)

// ─── Game Type Mapping ───────────────────────────────────────────────────────

function resolveGameType(apiType, homeTeamId) {
  switch (apiType) {
    case 'R': return 'regular_season'
    case 'W': return 'world_series'
    case 'A': return 'all_star'
    case 'S': return 'spring_training'
    case 'E': return 'exhibition'
    case 'D': {
      const league = TEAM_ID_TO_LEAGUE[homeTeamId]
      return league === 'AL' ? 'alds' : 'nlds'
    }
    case 'L': {
      const league = TEAM_ID_TO_LEAGUE[homeTeamId]
      return league === 'AL' ? 'alcs' : 'nlcs'
    }
    case 'F': return 'regular_season' // wild card — no dedicated enum value
    default:  return ''
  }
}

function parseSeriesGameNumber(description) {
  if (!description) return ''
  const match = description.match(/Game\s+(\d)/i)
  return match ? match[1] : ''
}

function deriveGameResult(teams) {
  if (teams.home.isWinner) return 'home_win'
  if (teams.away.isWinner) return 'home_loss'
  if (teams.home.score === teams.away.score
    && teams.home.score != null
    && !teams.home.isWinner && !teams.away.isWinner) return 'tie'
  return 'unknown'
}

// ─── Response Parser ─────────────────────────────────────────────────────────

function parseLinescore(linescore) {
  if (!linescore?.innings?.length) return null
  return {
    innings: linescore.innings.map(i => ({
      inning: i.num,
      away: i.away?.runs ?? 0,
      home: i.home?.runs ?? 0,
    })),
    away: {
      r: linescore.teams?.away?.runs ?? 0,
      h: linescore.teams?.away?.hits ?? 0,
      e: linescore.teams?.away?.errors ?? 0,
    },
    home: {
      r: linescore.teams?.home?.runs ?? 0,
      h: linescore.teams?.home?.hits ?? 0,
      e: linescore.teams?.home?.errors ?? 0,
    },
  }
}

export function parseGame(apiGame) {
  const home = apiGame.teams.home
  const away = apiGame.teams.away
  return {
    game_date:          apiGame.officialDate || '',
    home_team:          TEAM_NAME_TO_ABBREV[home.team.name] || home.team.name,
    away_team:          TEAM_NAME_TO_ABBREV[away.team.name] || away.team.name,
    venue:              apiGame.venue?.name || '',
    city:               TEAM_ID_TO_CITY[home.team.id] || '',
    season_year:        apiGame.season || '',
    game_type:          resolveGameType(apiGame.gameType, home.team.id),
    series_game_number: parseSeriesGameNumber(apiGame.description),
    game_result:        deriveGameResult(apiGame.teams),
    home_score:         home.score != null ? String(home.score) : '',
    away_score:         away.score != null ? String(away.score) : '',
    notes:              apiGame.description || '',
    box_score:          parseLinescore(apiGame.linescore),
  }
}

// ─── Fetch Functions ─────────────────────────────────────────────────────────

function extractGames(data) {
  if (!data.dates) return []
  return data.dates.flatMap(d => d.games || [])
}

export async function fetchGamesByDate(dateStr) {
  const res = await fetch(`${MLB_BASE}/schedule?date=${dateStr}&sportId=1&hydrate=linescore`)
  if (!res.ok) throw new Error(`MLB API error: ${res.status}`)
  const data = await res.json()
  return extractGames(data).map(parseGame)
}

export async function fetchGamesByMatchup(teamId1, teamId2, seasonYear) {
  const res = await fetch(
    `${MLB_BASE}/schedule?startDate=${seasonYear}-01-01&endDate=${seasonYear}-12-31&teamId=${teamId1}&sportId=1&hydrate=linescore`
  )
  if (!res.ok) throw new Error(`MLB API error: ${res.status}`)
  const data = await res.json()
  const games = extractGames(data)
  // Filter to games involving both teams
  const filtered = games.filter(g => {
    const ids = [g.teams.home.team.id, g.teams.away.team.id]
    return ids.includes(teamId1) && ids.includes(teamId2)
  })
  return filtered.map(parseGame)
}

export async function fetchWorldSeriesGames(year) {
  const res = await fetch(
    `${MLB_BASE}/schedule/postseason?sportId=1&season=${year}&gameType=W&hydrate=linescore`
  )
  if (!res.ok) throw new Error(`MLB API error: ${res.status}`)
  const data = await res.json()
  return extractGames(data).map(parseGame)
}
