# Item Type: Bat

Game-used or display baseball bats. Covers player model bats, signed bats, and game-used lumber.

## Bat-Specific Fields

| Field | Type | Notes |
|---|---|---|
| `manufacturer` | text | Louisville Slugger, Marucci, Rawlings, Mizuno, Old Hickory, etc. |
| `model_number` | text | Player model code, e.g. "C271", "P72", "R161" |
| `length_inches` | numeric | Length of the bat in inches, e.g. 34.0 |
| `weight_oz` | numeric | Weight in ounces, e.g. 32.0 |
| `is_game_used` | boolean | Whether the bat was used in an actual game |
| `year_used` | integer | Season year the bat was used — null if not game used |
| `is_cracked` | boolean | Whether the bat is cracked (common with game-used) |
| `has_pine_tar` | boolean | Visible pine tar present |
| `inscription` | text | Any written inscription beyond signatures |

## Game Context

If tied to a specific game → link to `game_context` table *(planned)* via `game_context_id`.

## Status

- [ ] `item_bats` table not yet created
- [ ] `game_context` table not yet created
