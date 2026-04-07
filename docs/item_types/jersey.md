# Item Type: Jersey

Game-worn or display baseball jerseys. Covers individual player jerseys, team-issued, and replica/throwback pieces.

## Jersey-Specific Fields

| Field | Type | Notes |
|---|---|---|
| `player_number` | text | Jersey number worn, e.g. "7", "42" |
| `team` | text | Team name on the jersey |
| `year_worn` | integer | Season year the jersey was worn — null if not game worn |
| `is_game_worn` | boolean | True if worn in actual games, false if display/replica |
| `size` | text | e.g. "44", "48", "XL" |
| `manufacturer` | text | Majestic, Nike, Rawlings, Mitchell & Ness, Wilson, etc. |
| `jersey_type` | enum | `home`, `away`, `alternate`, `spring_training`, `all_star`, `throwback` |
| `has_special_patch` | boolean | True if the jersey has a commemorative or special patch |
| `patch_description` | text | Description of any patches, e.g. "2009 World Series patch", "Jackie Robinson #42 memorial patch" |

## Game Context

If tied to a specific season or game → link to `game_context` table *(planned)* via `game_context_id`.

## Status

- [ ] `item_jerseys` table not yet created
- [ ] `game_context` table not yet created
