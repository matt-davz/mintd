# Shared: Game Context

A standalone `game_context` table for structured game data. Reused across item types — tickets, programs, baseballs, bats, bases, gloves, and photos can all reference the same game row rather than duplicating the data.

## Fields

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `game_date` | date | Date the game was played |
| `home_team` | text | Home team name |
| `away_team` | text | Away team name |
| `venue` | text | Stadium/ballpark name |
| `city` | text | City where the game was played |
| `season_year` | integer | MLB season year |
| `game_type` | enum | `regular_season`, `alds`, `alcs`, `nlds`, `nlcs`, `world_series`, `all_star`, `spring_training`, `exhibition` |
| `series_game_number` | integer | Game number within a postseason series, e.g. 7 — null for regular season |
| `game_result` | enum | `home_win`, `home_loss`, `tie`, `unknown` |
| `home_score` | integer | Final score — home team |
| `away_score` | integer | Final score — away team |
| `notes` | text | Any additional game context, e.g. "Clinching game", "Derek Jeter's last game" |

## Usage

Item type tables reference this via a nullable `game_context_id` FK. One `game_context` row can be shared by multiple items (e.g. a ticket and a baseball from the same game point to the same row).

## Relationship to Current `items` Fields

The following columns currently on `items` would move here:

- `game_date` → `game_context.game_date`
- `location` → `game_context.venue` / `city`
- `is_world_series_game` + `ws_game_number` → `game_context.game_type` + `series_game_number`
- `is_clinch_game` + `clinch_number` → `game_context.notes` or a dedicated flag

## Status

- [ ] `game_context` table not yet created
- [ ] Migration needed to move relevant fields off `items`
