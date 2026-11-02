
## 1/1 and Finest Known Badges (2026-11-02, requested by Zane)

### Problem
Some grade badges previously had PSA pop report text ("Pop 2 with 3 Higher") baked into the grade field — fixed by cleaning 3 cert records. But beyond that, there's no badge system for 1/1 or Finest Known items.

### Definitions (per Zane)
- **1/1**: The item is truly one-of-a-kind. Two paths:
  1. PSA total population = 1 (only one graded across all grades) → auto-derive from pop data
  2. Physically unique item (e.g. Gehrig kimono, Ruth proof card) → manually set via `is_one_of_one` flag
- **Finest Known**: Top-graded example with none higher, but other copies exist at lower grades
  - Derived: `pop.higher == 0 AND pop.total > 1`
- These are **mutually exclusive** — a true 1/1 doesn't need a "finest" label
- A Type 1 photo is NOT 1/1 just because it's an original — multiple Type 1 prints can exist from the same event

### Implementation
- DB: Add `is_one_of_one` boolean to `items` table (default false) for manually flagged unique items
- Frontend: Two new badge types on ItemCard and ItemDetail:
  - **1/1 badge**: show when `pop.total == 1` OR `items.is_one_of_one == true`
  - **Finest Known badge**: show when `pop.higher == 0 AND pop.total > 1`
- Badge styling should be visually distinct from grade badges (different color/shape)
- Pop report text must NEVER appear in grade badges — only in the Population Analysis section
