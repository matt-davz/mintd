# Item Type: Photograph

Baseball photographs — original prints, wire photos, cabinet cards, news service photos, etc.

## Photo-Specific Fields

| Field | Type | Notes |
|---|---|---|
| `photo_type` | enum | `type_1`, `type_2`, `type_3` — critical for value; Type 1 = original print from negative |
| `photo_size` | text | Dimensions in inches, e.g. "8x10", "4x6" |
| `photo_format` | enum | `original_print`, `wire_photo`, `news_service`, `cabinet_card`, `cdv`, `reprint` |
| `photo_era` | enum | `sepia`, `black_and_white`, `color` |
| `photographer` | text | Photographer name if known |
| `agency_source` | text | e.g. Associated Press, United Press, specific studio name |
| `event_subject` | text | What is depicted in the photo |
| `photo_date` | date | When the photo was taken (may differ from year produced) |

## Autograph Fields (if signed)

Autograph data lives on shared tables — no photo-specific autograph columns needed:

- **Is signed** → `items.is_autographed`
- **Signatories + auto grade** → `signatories` table
- **Signature location** (bottom, border, image area) → `signatories.signature_location` *(column to be added)*
- **Ink color** (black, blue, fountain pen) → `signatories.ink_color` *(column to be added)*

## Game Context

If the photo depicts a specific game → link to `game_context` table *(planned)*.

## Status

- [ ] `item_photos` table not yet created
- [ ] `signatories.signature_location` + `signatories.ink_color` columns not yet added
