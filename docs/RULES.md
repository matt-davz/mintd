# Rules

Mandatory checklists for common changes. If you make a change in one area, you must update all related areas listed here.

---

## Schema Change

When adding, removing, or modifying a column on any table:

1. **Migration** — create a new migration file in `supabase/migrations/`
2. **Schema docs** — update `docs/DATABASE_SCHEMA.md` to reflect the change
3. **Item Editor** — update the admin editor (`ItemViewerModal`, `ItemEditor`, or relevant type-specific fields component) to support the new field
4. **Item Detail (public)** — update the public item detail display (`ItemDetail`, `ItemTypeDetails`, `GameContextDisplay`, or relevant type display component) to render the new data

## Game Context Schema Change

When adding, removing, or modifying a column on the `game_context` table:

1. All steps from **Schema Change** above
2. **MLB Lookup Toolbar** — update `GameLookupToolbar.jsx` so that auto-fill from the MLB Stats API populates the new/changed fields
