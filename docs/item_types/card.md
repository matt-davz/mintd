# Item Type: Card

Trading cards — graded or raw. Includes vintage, modern, rookie cards, and serial-numbered parallels.

## Card-Specific Fields

| Field | Type | Notes |
|---|---|---|
| `card_set_name` | text | e.g. "1952 Topps", "2011 Bowman Chrome" |
| `card_number` | text | Card number within the set, e.g. "#311" |
| `manufacturer` | text | Topps, Bowman, Panini, Fleer, Donruss, Leaf, Upper Deck, etc. |
| `year_issued` | integer | Year the card was produced |
| `parallel_variation` | text | e.g. "Gold Refractor", "Chrome", "Prizm", "1st Edition" — null if base |
| `is_rookie_card` | boolean | Official rookie card designation |
| `serial_number` | integer | Individual copy number, e.g. 45 (out of 500) — null if not serialised |
| `print_run` | integer | Total copies in the print run, e.g. 500 — null if not serialised |

## Status

- [ ] `item_cards` table not yet created
