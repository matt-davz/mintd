-- ============================================================
-- 0041_auction_price_comps.sql
-- Private admin "Price Comps": auction lots tracked ONLY to learn the
-- verified closing price of items similar to ones already owned.
-- Not purchase intent — kept separate from the Want List rows/counts
-- and from auction_watchlist_lots.
--
-- Privacy (same model as 0039 / 0040):
--   * RLS: only `authenticated` (Clerk JWT via third-party auth) and
--     `service_role` have policies. No anon policy.
--   * Table privileges revoked from anon and PUBLIC as defence in depth.
--   * Not joined into item_gallery or any public view. Do not add it.
--
-- Prices: final_price is NULL until a realized price has been verified
-- from the auction house's results. It is never a current bid, an
-- estimate, or derived from the scheduled close time. A row is
-- "verified" iff final_price IS NOT NULL, which requires verified_at
-- and result_url (see CHECKs). price_basis records whether the figure
-- is the hammer price, includes the buyer's premium, or is unknown.
--
-- Idempotent: safe to re-run. The seed uses ON CONFLICT DO NOTHING so a
-- re-run never overwrites a result recorded in the admin UI (it will
-- re-insert a seeded comp that was removed in the UI).
-- ============================================================

create table if not exists public.auction_price_comps (
  id                 uuid          primary key default gen_random_uuid(),
  auction_house      text          not null,
  auction_name       text,
  lot_number         text,
  title              text          not null,
  source_url         text          not null,
  scheduled_close_at timestamptz,
  owned_item_id      uuid          references public.items(id) on delete set null,
  final_price        numeric(12,2),
  currency           text          not null default 'USD',
  price_basis        text          not null default 'unknown',
  result_url         text,
  verified_at        timestamptz,
  notes              text,
  created_by         text          default (auth.jwt() ->> 'sub'),
  created_at         timestamptz   not null default now(),
  updated_at         timestamptz   not null default now(),

  constraint auction_price_comps_source_url_key unique (source_url),

  constraint auction_price_comps_house_check
    check (char_length(btrim(auction_house)) between 1 and 100),
  constraint auction_price_comps_title_check
    check (char_length(btrim(title)) between 1 and 300),
  constraint auction_price_comps_auction_name_check
    check (auction_name is null or char_length(auction_name) <= 200),
  constraint auction_price_comps_lot_number_check
    check (lot_number is null or char_length(lot_number) <= 20),
  constraint auction_price_comps_source_url_check
    check (char_length(source_url) <= 1000 and source_url ~ '^https://[^[:space:]/]+\.[^[:space:]]*$'),
  constraint auction_price_comps_result_url_check
    check (result_url is null or (char_length(result_url) <= 1000 and result_url ~ '^https://[^[:space:]/]+\.[^[:space:]]*$')),
  constraint auction_price_comps_notes_check
    check (notes is null or char_length(notes) <= 1000),
  constraint auction_price_comps_currency_check
    check (currency ~ '^[A-Z]{3}$'),
  constraint auction_price_comps_price_basis_check
    check (price_basis in ('hammer', 'buyer_premium_inclusive', 'unknown')),
  constraint auction_price_comps_final_price_nonneg_check
    check (final_price is null or final_price >= 0),
  -- Verified ⇔ final_price present; a verified price needs a timestamp and a results source.
  constraint auction_price_comps_verified_check
    check (
      (final_price is null and verified_at is null)
      or (final_price is not null and verified_at is not null and result_url is not null)
    ),
  -- A result can't be verified before the lot was scheduled to close.
  constraint auction_price_comps_verified_after_close_check
    check (verified_at is null or scheduled_close_at is null or verified_at >= scheduled_close_at)
);

comment on table public.auction_price_comps is
  'PRIVATE admin-only price comps: auction lots tracked only for their verified closing price. Authenticated + service_role only; never exposed publicly. final_price is NULL until verified — never a current bid.';
comment on column public.auction_price_comps.price_basis is
  'hammer = excludes buyer''s premium; buyer_premium_inclusive = includes it; unknown = source did not say.';

create index if not exists idx_auction_price_comps_owned_item on public.auction_price_comps (owned_item_id);
create index if not exists idx_auction_price_comps_close      on public.auction_price_comps (scheduled_close_at);

drop trigger if exists auction_price_comps_updated_at on public.auction_price_comps;
create trigger auction_price_comps_updated_at
  before update on public.auction_price_comps
  for each row execute function public.set_updated_at();

-- ── Privileges + RLS ─────────────────────────────────────────────────────────

alter table public.auction_price_comps enable row level security;

revoke all on public.auction_price_comps from anon;
revoke all on public.auction_price_comps from public;
grant select, insert, update, delete on public.auction_price_comps to authenticated;
grant all on public.auction_price_comps to service_role;

drop policy if exists "authenticated_read_auction_price_comps"   on public.auction_price_comps;
drop policy if exists "authenticated_insert_auction_price_comps" on public.auction_price_comps;
drop policy if exists "authenticated_update_auction_price_comps" on public.auction_price_comps;
drop policy if exists "authenticated_delete_auction_price_comps" on public.auction_price_comps;
drop policy if exists "service_manage_auction_price_comps"       on public.auction_price_comps;

create policy "authenticated_read_auction_price_comps" on public.auction_price_comps
  for select to authenticated using (auth.role() = 'authenticated');
create policy "authenticated_insert_auction_price_comps" on public.auction_price_comps
  for insert to authenticated with check (auth.role() = 'authenticated');
create policy "authenticated_update_auction_price_comps" on public.auction_price_comps
  for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated_delete_auction_price_comps" on public.auction_price_comps
  for delete to authenticated using (auth.role() = 'authenticated');
create policy "service_manage_auction_price_comps" on public.auction_price_comps
  for all to service_role using (true) with check (true);

-- ── Seed: two PENDING Leland's comps for the owned 1949 Bowman #224 Paige ────
-- Leland's 2026 Fall Classic. Scheduled initial close Dec 5, 2026 10:00 PM ET
-- (= 2026-12-06 03:00 UTC); extended bidding may push the real close later.
-- No final prices are seeded — they are recorded in the admin UI only after
-- Leland's publishes the realized price. Inserts nothing if the owned item
-- does not exist.

insert into public.auction_price_comps
  (auction_house, auction_name, lot_number, title, source_url, scheduled_close_at, owned_item_id, notes)
select v.auction_house, v.auction_name, v.lot_number, v.title, v.source_url,
       v.scheduled_close_at::timestamptz, i.id, v.notes
from public.items i
cross join (values
  ('Leland''s', '2026 Fall Classic', '120',
   '1949 Bowman #224 Satchel Paige PSA 8 (OC)',
   'https://auction.lelands.com/bids/bidplace?itemid=138632',
   '2026-12-06T03:00:00Z',
   'Scheduled initial close; extended bidding possible.'),
  ('Leland''s', '2026 Fall Classic', '119',
   '1949 Bowman #224 Satchel Paige PSA 4',
   'https://auction.lelands.com/bids/bidplace?itemid=139902',
   '2026-12-06T03:00:00Z',
   'Scheduled initial close; extended bidding possible.')
) as v(auction_house, auction_name, lot_number, title, source_url, scheduled_close_at, notes)
where i.id = 'de385e68-0558-561d-b61d-bca5c76498e0'
on conflict (source_url) do nothing;
