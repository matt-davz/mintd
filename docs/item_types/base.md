# Item Type: Base

Game-used bases from notable baseball games.

## Base-Specific Fields

| Field | Type | Notes |
|---|---|---|
| `base_position` | enum | `first`, `second`, `third`, `home` |
| `is_game_used` | boolean | True if used in an actual game |
| `manufacturer` | text | e.g. Schutt, Hollywood Bases |
| `has_mlb_authentication` | boolean | True if comes with official MLB authenticated hologram/tag |

## Game Context

Specific game the base was used in lives on the `game_context` table *(planned)* — linked via `game_context_id`.

## Status

- [ ] `item_bases` table not yet created
- [ ] `game_context` table not yet created
