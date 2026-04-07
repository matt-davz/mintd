# Item Type: Program

Official game day programs — regular season, playoff, World Series, and All-Star programs.

## Program-Specific Fields

| Field | Type | Notes |
|---|---|---|
| `event_type` | enum | `regular_season`, `alds`, `alcs`, `nlds`, `nlcs`, `world_series`, `all_star`, `spring_training` |
| `publisher` | text | Publishing house or team/league |
| `series_game_number` | integer | Game number within the series for playoff/WS programs, e.g. 7 — null for regular season |

## Game Context

Teams, venue, and game date live on the `game_context` table *(planned)* — linked via `game_context_id`.

## Status

- [ ] `item_programs` table not yet created
- [ ] `game_context` table not yet created
