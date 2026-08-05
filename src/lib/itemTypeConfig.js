// ─── Item Type Configuration ──────────────────────────────────────────────────
// Pure data — no React imports. Single source of truth for type metadata.

export const ITEM_TYPES = [
  'ticket', 'ticket_sheet', 'card', 'baseball', 'bat', 'jersey',
  'photo', 'magazine', 'program', 'book', 'base', 'glove',
  'miscellaneous', 'stadium_giveaway',
]

export const HAS_GAME_CONTEXT = new Set([
  'ticket', 'ticket_sheet', 'baseball', 'bat', 'jersey', 'photo', 'program',
  'base', 'glove', 'stadium_giveaway',
])

// Types whose single game_context is linked via a `game_context_id` FK column
// on their detail table. `ticket_sheet` is intentionally excluded — it links
// multiple games through the `ticket_sheet_games` junction table instead, so
// the single-game-context machinery (useItem, timeline, editor save path) must
// not assume a `game_context_id` column on `item_ticket_sheets`.
export const GAME_CONTEXT_VIA_DETAIL_FK = new Set([
  'ticket', 'baseball', 'bat', 'jersey', 'photo', 'program', 'base', 'glove',
  'stadium_giveaway',
])

export const DETAIL_TABLE = {
  ticket:   'item_tickets',
  ticket_sheet: 'item_ticket_sheets',
  card:     'item_cards',
  baseball: 'item_baseballs',
  bat:      'item_bats',
  jersey:   'item_jerseys',
  photo:    'item_photos',
  magazine: 'item_magazines',
  program:  'item_programs',
  book:     'item_books',
  base:     'item_bases',
  glove:    'item_gloves',
  miscellaneous:    'item_miscellaneous',
  stadium_giveaway: 'item_stadium_giveaways',
}

export const EMPTY_DETAIL = {
  ticket:   { is_full_ticket: false, section: '', row: '', seat: '', face_value: '', printer: '' },
  ticket_sheet: { sheet_size: '', is_uncut: true, printer: '', section: '', row: '', seat: '', face_value: '', includes_phantom_game: false, phantom_game_label: '' },
  card:     { card_set_name: '', card_number: '', manufacturer: '', year_issued: '', parallel_variation: '', is_rookie_card: false, serial_number: '', print_run: '' },
  baseball: { is_game_used: false, game_used_type: '', manufacturer: '', league_stamp: '', is_team_signed: false, inscription: '' },
  bat:      { manufacturer: '', model_number: '', length_inches: '', weight_oz: '', is_game_used: false, year_used: '', is_cracked: false, has_pine_tar: false, inscription: '' },
  jersey:   { player_number: '', team: '', year_worn: '', is_game_worn: false, size: '', manufacturer: '', jersey_type: '', has_special_patch: false, patch_description: '' },
  photo:    { photo_type: '', photo_size: '', photo_format: '', photo_era: '', photographer: '', agency_source: '', event_subject: '', photo_date: '' },
  magazine: { publication_name: '', issue_date: '', volume: '', issue_number: '', publisher: '', cover_subject: '', is_cover_signed: false },
  program:  { game_type: '', publisher: '' },
  book:     { author: '', publisher: '', year_published: '', edition: '', isbn: '', is_first_edition: false, is_signed_by_author: false },
  base:     { base_position: '', is_game_used: false, manufacturer: '', has_mlb_authentication: false },
  glove:    { manufacturer: '', model: '', player_position: '', handedness: '', year_used: '', is_game_used: false },
  miscellaneous:    { category: '', description: '' },
  stadium_giveaway: { event_name: '', event_date: '', giveaway_item_type: '', manufacturer: '' },
}

export const EMPTY_GAME_CONTEXT = {
  game_date: '', home_team: '', away_team: '', venue: '', city: '',
  season_year: '', game_type: '', series_game_number: '',
  game_result: '', home_score: '', away_score: '', notes: '',
  box_score: null,
}

export const NUMERIC_FIELDS = new Set([
  'face_value', 'sheet_size', 'year_issued', 'serial_number', 'print_run',
  'length_inches', 'weight_oz', 'year_used', 'year_worn',
  'year_published',
])

/** True if every value is '', false, or null */
export function isFormEmpty(obj) {
  return Object.values(obj).every(v => v === '' || v === false || v === null)
}

/** Convert a detail/gc form object to a DB-ready payload */
export function serializeForm(obj) {
  const out = {}
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'boolean') {
      out[key] = val
    } else if (val === '') {
      out[key] = null
    } else if (NUMERIC_FIELDS.has(key)) {
      out[key] = Number(val)
    } else {
      out[key] = val
    }
  }
  return out
}
