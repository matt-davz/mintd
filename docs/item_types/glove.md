# Item Type: Glove

Game-used fielding gloves from notable players or games.

## Glove-Specific Fields

| Field | Type | Notes |
|---|---|---|
| `manufacturer` | text | Rawlings, Wilson, Mizuno, Nike, Nokona, etc. |
| `model` | text | Model name/number, e.g. "Heart of the Hide", "A2000" |
| `player_position` | enum | `pitcher`, `catcher`, `first_base`, `second_base`, `third_base`, `shortstop`, `outfield` |
| `handedness` | enum | `left_hand_throw`, `right_hand_throw` — which hand the glove goes on |
| `year_used` | integer | Season year the glove was used — null if not game used |
| `is_game_used` | boolean | True if used in actual games |

## Game Context

If tied to a specific game → link to `game_context` table *(planned)* via `game_context_id`.

## Status

- [ ] `item_gloves` table not yet created
- [ ] `game_context` table not yet created
