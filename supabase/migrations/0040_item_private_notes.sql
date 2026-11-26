-- ============================================================
-- 0040_item_private_notes.sql
-- Genuinely private, admin-only notes per collection item.
--
-- Why a separate table: items.notes is readable by anon through both
-- `items` and the public `item_gallery` view, so it is NOT private.
-- Anything sensitive (comps, pricing strategy, provenance contacts)
-- belongs here instead.
--
-- Privacy:
--   * RLS: only `authenticated` (Clerk JWT via third-party auth) and
--     `service_role` have policies. No anon policy.
--   * Table privileges are revoked from anon (and PUBLIC) as defence
--     in depth.
--   * Not joined into item_gallery or any other public view. Do not add
--     it to one.
--
-- Idempotent: safe to re-run. The seed uses ON CONFLICT DO NOTHING so a
-- re-run never overwrites a note that has since been edited in the admin UI.
-- ============================================================

create table if not exists public.item_private_notes (
  item_id    uuid        primary key references public.items(id) on delete cascade,
  body       text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.item_private_notes is
  'PRIVATE admin-only notes, one row per item. Authenticated + service_role only; never exposed publicly. Unlike items.notes (anon-readable).';

drop trigger if exists item_private_notes_updated_at on public.item_private_notes;
create trigger item_private_notes_updated_at
  before update on public.item_private_notes
  for each row execute function public.set_updated_at();

-- ── Privileges + RLS ─────────────────────────────────────────────────────────

alter table public.item_private_notes enable row level security;

revoke all on public.item_private_notes from anon;
revoke all on public.item_private_notes from public;
grant select, insert, update, delete on public.item_private_notes to authenticated;
grant all on public.item_private_notes to service_role;

drop policy if exists "authenticated_read_item_private_notes"   on public.item_private_notes;
drop policy if exists "authenticated_insert_item_private_notes" on public.item_private_notes;
drop policy if exists "authenticated_update_item_private_notes" on public.item_private_notes;
drop policy if exists "authenticated_delete_item_private_notes" on public.item_private_notes;
drop policy if exists "service_manage_item_private_notes"       on public.item_private_notes;

create policy "authenticated_read_item_private_notes" on public.item_private_notes
  for select to authenticated using (auth.role() = 'authenticated');
create policy "authenticated_insert_item_private_notes" on public.item_private_notes
  for insert to authenticated with check (auth.role() = 'authenticated');
create policy "authenticated_update_item_private_notes" on public.item_private_notes
  for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated_delete_item_private_notes" on public.item_private_notes
  for delete to authenticated using (auth.role() = 'authenticated');
create policy "service_manage_item_private_notes" on public.item_private_notes
  for all to service_role using (true) with check (true);

-- ── Seed: pending comps for 1949 Bowman #224 Satchel Paige RC (PSA NM 7) ─────
-- Leland's 2026 Fall Classic closes Dec 5, 2026 10:00 PM ET
-- (= 2026-12-06 03:00 UTC). No sale prices are recorded here — they are
-- added by hand after the auction closes. Inserts nothing if the item
-- does not exist.

insert into public.item_private_notes (item_id, body)
select i.id,
       E'PENDING COMPS (add final sale prices after Leland''s 2026 Fall Classic closes Dec 5, 2026 10:00 PM ET; extended bidding may apply)\n'
    || E'- Lot 120, 1949 Bowman #224 Satchel Paige, PSA 8 (OC): https://auction.lelands.com/bids/bidplace?itemid=138632\n'
    || E'- Lot 119, 1949 Bowman #224 Satchel Paige, PSA 4: https://auction.lelands.com/bids/bidplace?itemid=139902\n'
    || E'Final prices: not yet recorded.'
from public.items i
where i.id = 'de385e68-0558-561d-b61d-bca5c76498e0'
on conflict (item_id) do nothing;
