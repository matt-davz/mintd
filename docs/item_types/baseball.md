# Item Type: Baseball

Signed or game-used baseballs. Covers individual signatures, team-signed balls, and game-used balls with or without signatures.

## Baseball-Specific Fields

| Field | Type | Notes |
|---|---|---|
| `is_game_used` | boolean | Whether the ball was used in an actual game |
| `game_used_type` | enum | `game`, `batting_practice`, `home_run`, `ceremonial_first_pitch`, `display` — null if not game used |
| `manufacturer` | text | Rawlings, Wilson, etc. |
| `league_stamp` | text | Stamp printed on ball — e.g. "American League", "Commissioner's", "World Series", "Official MLB" |
| `is_team_signed` | boolean | True if signed by an entire team roster |
| `inscription` | text | Any written inscription on the ball beyond signatures, e.g. "500 HR Club" |

## Game Context

If tied to a specific game → link to `game_context` table *(planned)* via `game_context_id`.

## Status

- [ ] `item_baseballs` table not yet created
- [ ] `game_context` table not yet created
