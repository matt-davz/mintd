# Item Type: Ticket / Stub

Full tickets and torn stubs from baseball games. Treated as the same type with a flag distinguishing full vs stub.

## Ticket-Specific Fields

| Field | Type | Notes |
|---|---|---|
| `is_full_ticket` | boolean | true = full unused ticket, false = torn stub |
| `section` | text | Section number/name printed on ticket |
| `row` | text | Row identifier |
| `seat` | text | Seat number |
| `face_value` | numeric | Printed price on the ticket |
| `game_result` | enum | `win`, `loss`, `tie`, `unknown` — result for the home team |
| `printer` | text | Ticket printer/manufacturer if noted (e.g. National Ticket Co.) |

## Game Context

Game-specific data (date, teams, venue, postseason round, WS game number) lives on the `game_context` table *(planned)* — linked via `game_context_id`.

## Status

- [ ] `item_tickets` table not yet created
- [ ] `game_context` table not yet created
