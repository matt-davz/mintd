-- ============================================================
-- 0039_auction_watchlist.sql
-- Private admin auction watchlist: lots Zane is tracking across
-- upcoming auctions (REA, Huggins & Scott, Grey Flannel,
-- Love of the Game, Leland's, Heritage).
--
-- PRIVATE BIDDING INTENT. This table is never readable by anon:
--   * RLS: only `authenticated` (Clerk JWT via third-party auth) and
--     `service_role` have policies.
--   * Table privileges are revoked from anon as defence in depth.
--   * Nothing here is exposed through item_gallery or any public view.
--
-- Prices: current_bid is only ever written by the
-- auction-watchlist-refresh Edge Function after a fresh fetch
-- (bid_source = 'live') or by an explicit manual entry in the admin
-- page (bid_source = 'manual'). The seed below deliberately leaves
-- current_bid / opening_bid / bid_checked_at NULL — no price snapshots
-- are seeded. A live check of a lot with no bids leaves current_bid
-- NULL and records the opening bid separately in opening_bid.
--
-- SSRF defence: the refresh function never fetches source_url. For
-- REA / H&S / Grey Flannel / Love of the Game / Leland's it rebuilds the
-- fetch URL from (house, lot_id) with a fixed host. For Heritage it re-validates the
-- stored canonical_url with a URL parser (exact host, path ending in
-- lot_id). The CHECK constraints below additionally pin canonical_url
-- (and image_url) to the allowed host/shape for each house so rows
-- inserted directly through PostgREST can't smuggle other hosts.
--
-- Idempotent: safe to re-run (IF NOT EXISTS / DROP ... IF EXISTS /
-- ON CONFLICT DO NOTHING). Note: re-running re-inserts any seeded lot
-- that was removed from the watchlist in the UI.
-- ============================================================

create table if not exists public.auction_watchlist_lots (
  id                   uuid        primary key default gen_random_uuid(),
  canonical_url        text        not null,
  source_url           text        not null,
  house                text        not null,
  auction_name         text        not null,
  lot_id               text        not null,
  lot_number           text,
  title                text,
  owner                text,
  priority             text        not null default 'normal',
  scheduled_close_at   timestamptz,
  closing_note         text,
  current_bid          numeric(12,2),
  opening_bid          numeric(12,2),
  currency             text        not null default 'USD',
  bid_checked_at       timestamptz,
  bid_source           text,
  image_url            text,
  lot_status           text        not null default 'unknown',
  refresh_status       text        not null default 'never',
  refresh_attempted_at timestamptz,
  last_error           text,
  created_by           text        default (auth.jwt() ->> 'sub'),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint auction_watchlist_lots_canonical_url_key unique (canonical_url),
  constraint auction_watchlist_lots_house_lot_key     unique (house, lot_id),

  constraint auction_watchlist_house_check
    check (house in ('rea', 'huggins_scott', 'grey_flannel', 'love_of_the_game', 'lelands', 'heritage')),
  constraint auction_watchlist_priority_check
    check (priority in ('normal', 'must_win')),
  constraint auction_watchlist_bid_source_check
    check (bid_source is null or bid_source in ('live', 'manual')),
  constraint auction_watchlist_bid_nonneg_check
    check (current_bid is null or current_bid >= 0),
  constraint auction_watchlist_opening_bid_nonneg_check
    check (opening_bid is null or opening_bid >= 0),
  constraint auction_watchlist_bid_checked_check
    check (current_bid is null or (bid_checked_at is not null and bid_source is not null)),
  constraint auction_watchlist_currency_check
    check (currency ~ '^[A-Z]{3}$'),
  constraint auction_watchlist_lot_status_check
    check (lot_status in ('unknown', 'live', 'extended', 'closed')),
  constraint auction_watchlist_refresh_status_check
    check (refresh_status in ('never', 'ok', 'manual', 'blocked', 'error', 'unsupported')),
  -- Images only from each house's own image host/path (as validated by the refresh function).
  constraint auction_watchlist_image_url_check check (
    image_url is null
    or (house = 'rea'           and image_url ~ '^https://res\.cloudinary\.com/robertedwardauctions/image/upload/[A-Za-z0-9_,:./-]+$')
    or (house = 'huggins_scott' and image_url ~ '^https://res\.cloudinary\.com/hugginsandscott/image/upload/[A-Za-z0-9_,:./-]+$')
    or (house = 'grey_flannel'  and lot_id ~ '^[0-9]{1,10}$'
        and image_url ~ ('^https://bid\.greyflannelauctions\.com/images_items/item_' || lot_id || '_[0-9]{1,3}_[0-9]{1,12}\.(jpg|jpeg|png)$'))
    or (house = 'love_of_the_game' and lot_id ~ '^[0-9]{1,10}$'
        and image_url ~ ('^https://bid\.loveofthegameauctions\.com/images_items/item_' || lot_id || '_[0-9]{1,3}_[0-9]{1,12}\.(jpg|jpeg|png)$'))
    or (house = 'lelands'       and lot_id ~ '^[0-9]{1,10}$'
        and image_url ~ ('^https://auction\.lelands\.com/images_items/item_' || lot_id || '_[0-9]{1,3}_[0-9]{1,12}\.(jpg|jpeg|png)$'))
    or (house = 'heritage'      and image_url ~ '^https://dyn1\.heritagestatic\.com/ha\?p=[0-9-]{1,40}&it=product$')
  ),
  -- lot_id shape + canonical URL host pinned per house
  constraint auction_watchlist_lot_url_check check (
    (house = 'rea'           and lot_id ~ '^[0-9]{1,10}$'
       and canonical_url = 'https://bid.collectrea.com/lots/' || lot_id)
    or (house = 'huggins_scott' and lot_id ~ '^[0-9]{1,10}$'
       and canonical_url = 'https://bid.hugginsandscott.com/lots/' || lot_id)
    or (house = 'grey_flannel'  and lot_id ~ '^[0-9]{1,10}$'
       and canonical_url = 'https://bid.greyflannelauctions.com/bids/bidplace?itemid=' || lot_id)
    or (house = 'love_of_the_game' and lot_id ~ '^[0-9]{1,10}$'
       and canonical_url = 'https://bid.loveofthegameauctions.com/bids/bidplace?itemid=' || lot_id)
    or (house = 'lelands'       and lot_id ~ '^[0-9]{1,10}$'
       and canonical_url = 'https://auction.lelands.com/bids/bidplace?itemid=' || lot_id)
    or (house = 'heritage'      and lot_id ~ '^[0-9]{1,8}-[0-9]{1,10}$'
       and canonical_url ~ '^https://(sports|www)\.ha\.com/itm/[A-Za-z0-9/_-]+/a/[0-9]{1,8}-[0-9]{1,10}\.s$'
       and canonical_url like '%/a/' || lot_id || '.s')
  ),
  constraint auction_watchlist_source_url_check
    check (source_url ~ '^https://(bid\.collectrea\.com|bid\.hugginsandscott\.com|bid\.greyflannelauctions\.com|bid\.loveofthegameauctions\.com|auction\.lelands\.com|sports\.ha\.com|www\.ha\.com)/')
);

comment on table public.auction_watchlist_lots is
  'PRIVATE admin auction watchlist (bidding intent). Authenticated + service_role only; never exposed publicly.';
comment on column public.auction_watchlist_lots.lot_id is
  'Auction-house lot identifier used to rebuild the fetch URL. REA/H&S/Grey Flannel/Love of the Game/Leland''s: numeric id from the URL. Heritage: "<saleNo>-<lotNo>" e.g. 50089-81460.';
comment on column public.auction_watchlist_lots.scheduled_close_at is
  'Scheduled close in UTC. For REA/H&S this is when extended bidding begins, not a guaranteed final close.';
comment on column public.auction_watchlist_lots.current_bid is
  'Last verified current bid. Only written after a fresh fetch (bid_source=live) or explicit manual entry (bid_source=manual). Never estimated.';
comment on column public.auction_watchlist_lots.opening_bid is
  'Opening / starting bid as shown on the lot page (Grey Flannel, Love of the Game, Leland''s, Heritage). Never used as current_bid. With bid_source=live and current_bid NULL it means the last check found no bids.';
comment on column public.auction_watchlist_lots.refresh_attempted_at is
  'Last time the refresh function tried this lot. Caps refresh frequency: 10 min for REA/H&S, 60 min for Firecrawl-scraped houses (Grey Flannel, Love of the Game, Leland''s, Heritage).';

create index if not exists idx_auction_watchlist_close
  on public.auction_watchlist_lots (scheduled_close_at);

drop trigger if exists auction_watchlist_lots_updated_at on public.auction_watchlist_lots;
create trigger auction_watchlist_lots_updated_at
  before update on public.auction_watchlist_lots
  for each row execute function public.set_updated_at();

-- ── Privileges + RLS ─────────────────────────────────────────────────────────

alter table public.auction_watchlist_lots enable row level security;

revoke all on public.auction_watchlist_lots from anon;
grant select, insert, update, delete on public.auction_watchlist_lots to authenticated;
grant all on public.auction_watchlist_lots to service_role;

drop policy if exists "authenticated_read_auction_watchlist"   on public.auction_watchlist_lots;
drop policy if exists "authenticated_insert_auction_watchlist" on public.auction_watchlist_lots;
drop policy if exists "authenticated_update_auction_watchlist" on public.auction_watchlist_lots;
drop policy if exists "authenticated_delete_auction_watchlist" on public.auction_watchlist_lots;
drop policy if exists "service_manage_auction_watchlist"       on public.auction_watchlist_lots;

create policy "authenticated_read_auction_watchlist" on public.auction_watchlist_lots
  for select to authenticated using (auth.role() = 'authenticated');
create policy "authenticated_insert_auction_watchlist" on public.auction_watchlist_lots
  for insert to authenticated with check (auth.role() = 'authenticated');
create policy "authenticated_update_auction_watchlist" on public.auction_watchlist_lots
  for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated_delete_auction_watchlist" on public.auction_watchlist_lots
  for delete to authenticated using (auth.role() = 'authenticated');
create policy "service_manage_auction_watchlist" on public.auction_watchlist_lots
  for all to service_role using (true) with check (true);

-- ── Seed: Zane's 29 tracked lots (from mintdassist/tracked-auction-lots.json) ─
-- Deadlines converted from the listed local time to UTC:
--   Huggins & Scott  2026-12-03 21:00 America/New_York (EST) = 2026-12-04 02:00 UTC
--   REA              2026-12-06 21:00 America/New_York (EST) = 2026-12-07 02:00 UTC
--   Grey Flannel     2026-12-13 20:00 America/New_York (EST) = 2026-12-14 01:00 UTC
--   Love of the Game 2026-12-12 21:00 America/New_York (EST) = 2026-12-13 02:00 UTC
--                    (lot pages print "9:00 PM EDT"; December is EST, so the
--                    wall time is read as America/New_York local time)
--   Leland's         2026-12-05 22:00 America/New_York (EST) = 2026-12-06 03:00 UTC
--   Heritage         2026-12-19 22:00 America/Chicago  (CST) = 2026-12-20 04:00 UTC
-- No prices, images, or statuses are seeded — those arrive only via refresh.

insert into public.auction_watchlist_lots
  (house, auction_name, lot_id, lot_number, title, owner, priority,
   canonical_url, source_url, scheduled_close_at, closing_note)
select house, auction_name, lot_id, lot_number, title, 'Zane', priority,
       canonical_url, source_url, scheduled_close_at::timestamptz, closing_note
from (values
  -- Huggins & Scott — Fall 2026
  ('huggins_scott', 'Fall 2026', '21486', '1446', '1960 World Series Game 1 ticket stub, Clemente debut', 'normal',
   'https://bid.hugginsandscott.com/lots/21486', 'https://bid.hugginsandscott.com/lots/21486', '2026-12-04 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-03T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('huggins_scott', 'Fall 2026', '20934', '1419', '1956 World Series Game 6 ticket stub, Jackie Robinson walk-off', 'normal',
   'https://bid.hugginsandscott.com/lots/20934', 'https://bid.hugginsandscott.com/lots/20934', '2026-12-04 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-03T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('huggins_scott', 'Fall 2026', '19879', '1473', '1963 World Series Game 2 full ticket', 'normal',
   'https://bid.hugginsandscott.com/lots/19879', 'https://bid.hugginsandscott.com/lots/19879', '2026-12-04 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-03T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),

  -- Robert Edward Auctions — Fall 2026
  ('rea', 'Fall 2026', '210386', '3682', 'July 6, 1941 Yankees program and ticket stub pair, DiMaggio 47th and 48th consecutive hits', 'must_win',
   'https://bid.collectrea.com/lots/210386', 'https://bid.collectrea.com/lots/210386', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '176323', '3680', 'June 16, 1941 DiMaggio hit-streak ticket stub', 'must_win',
   'https://bid.collectrea.com/lots/176323', 'https://bid.collectrea.com/lots/176323', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '185303', '3679', 'June 15, 1941 DiMaggio hit-streak ticket stub PSA 5', 'must_win',
   'https://bid.collectrea.com/lots/185303', 'https://bid.collectrea.com/lots/185303', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '210383', '3728', '1961 Mantle and Maris program and ticket collection', 'normal',
   'https://bid.collectrea.com/lots/210383', 'https://bid.collectrea.com/lots/210383', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '201838', '3883', '1961 Maris 61st home run Type I photo', 'normal',
   'https://bid.collectrea.com/lots/201838', 'https://bid.collectrea.com/lots/201838', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '196877', '3792', '1926 Ruth and Hornsby World Series Type I photo', 'normal',
   'https://bid.collectrea.com/lots/196877', 'https://bid.collectrea.com/lots/196877', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '205155', '3722', '1963 World Series Game 1 Koufax-signed ticket stub', 'normal',
   'https://bid.collectrea.com/lots/205155', 'https://bid.collectrea.com/lots/205155', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '200787', '3653', '1927 Yankees World Series program', 'normal',
   'https://bid.collectrea.com/lots/200787', 'https://bid.collectrea.com/lots/200787', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '202539', '3770', 'September 25, 2014 Yankees–Orioles full ticket PSA MINT 9, Derek Jeter final home game', 'normal',
   'https://bid.collectrea.com/lots/202539', 'https://bid.collectrea.com/lots/202539', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '202559', '3763', '2000 Mets–Yankees World Series Game 5 full ticket PSA MINT 9, Derek Jeter MVP', 'normal',
   'https://bid.collectrea.com/lots/202559', 'https://bid.collectrea.com/lots/202559', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '198542', '3686', '1947 Brooklyn Dodgers–Yankees World Series Game 4 ticket stub, Jackie Robinson''s first World Series', 'normal',
   'https://bid.collectrea.com/lots/198542', 'https://bid.collectrea.com/lots/198542', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '211274', '3731', '1963 Yankees–Dodgers World Series Games 1 and 2 ticket stub pair, Koufax 15 strikeouts in Game 1', 'normal',
   'https://bid.collectrea.com/lots/211274', 'https://bid.collectrea.com/lots/211274', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '211562', '5087', '1996 Yankees–Braves World Series Game 1 full ticket PSA MINT 9, Smoltz vs. Pettitte', 'normal',
   'https://bid.collectrea.com/lots/211562', 'https://bid.collectrea.com/lots/211562', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '210357', '5066', '1952–1961 Yankees World Series ticket stub PSA-graded trio', 'normal',
   'https://bid.collectrea.com/lots/210357', 'https://bid.collectrea.com/lots/210357', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '210521', '3174', 'Signed 1992 Bowman #302 Mariano Rivera rookie PSA MINT 9, GEM MINT 10 signature', 'normal',
   'https://bid.collectrea.com/lots/210521', 'https://bid.collectrea.com/lots/210521', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '200785', '3505', 'Joe Sewell signed handwritten letter, Babe Ruth called shot content, JSA', 'normal',
   'https://bid.collectrea.com/lots/200785', 'https://bid.collectrea.com/lots/200785', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '210353', '3717', 'October 21, 1956 Brooklyn Dodgers Tour of Japan ticket stub PSA VG 3, Jackie Robinson pictured', 'normal',
   'https://bid.collectrea.com/lots/210353', 'https://bid.collectrea.com/lots/210353', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),
  ('rea', 'Fall 2026', '198265', '3803', 'Circa 1934 Jimmie Foxx Tour of Japan Type I photo PSA/DNA', 'normal',
   'https://bid.collectrea.com/lots/198265', 'https://bid.collectrea.com/lots/198265', '2026-12-07 02:00:00+00',
   'Auction homepage countdown expires at 2026-12-06T21:00:00-05:00 and labels that point ''Until Extended Bidding.'' Lot pages show auction ending 9:59 PM; actual lot close may extend.'),

  -- Grey Flannel — December 13, 2026 Holiday Auction #68
  ('grey_flannel', 'December 13, 2026 Holiday Auction #68', '59791', '150', '2017 Shohei Ohtani Nippon-Ham Fighters game-used jersey, final season in Japan', 'normal',
   'https://bid.greyflannelauctions.com/bids/bidplace?itemid=59791', 'https://bid.greyflannelauctions.com/bids/bidplace?itemid=59791', '2026-12-14 01:00:00+00',
   'Both lot pages list auction end as Dec 13, 2026 at 8:00 PM EST. Check live lot pages for any extended bidding or changed closing times.'),
  ('grey_flannel', 'December 13, 2026 Holiday Auction #68', '59792', '151', '2016 Shohei Ohtani NPB All-Star Game player-worn jersey, NPB LOA', 'normal',
   'https://bid.greyflannelauctions.com/bids/bidplace?itemid=59792', 'https://bid.greyflannelauctions.com/bids/bidplace?itemid=59792', '2026-12-14 01:00:00+00',
   'Both lot pages list auction end as Dec 13, 2026 at 8:00 PM EST. Check live lot pages for any extended bidding or changed closing times.'),

  -- Love of the Game Auctions — Fall 2026 Premier Auction
  ('love_of_the_game', 'Fall 2026 Premier Auction', '49085', '17', '1921 W551 complete 10-card strip with Babe Ruth, Ty Cobb, Tris Speaker and Walter Johnson', 'normal',
   'https://bid.loveofthegameauctions.com/bids/bidplace?itemid=49085', 'https://bid.loveofthegameauctions.com/bids/bidplace?itemid=49085', '2026-12-13 02:00:00+00',
   'Both lot pages list Dec 12, 2026 at 9:00 PM Eastern. Auction rules require a bid on each lot before 9 PM Eastern to enter extended bidding, which may continue afterward under a 15-minute auction-wide rule.'),
  ('love_of_the_game', 'Fall 2026 Premier Auction', '49605', '41', '1923 Fleer #47 Babe Ruth, SGC Authentic', 'normal',
   'https://bid.loveofthegameauctions.com/bids/bidplace?itemid=49605', 'https://bid.loveofthegameauctions.com/bids/bidplace?itemid=49605', '2026-12-13 02:00:00+00',
   'Both lot pages list Dec 12, 2026 at 9:00 PM Eastern. Auction rules require a bid on each lot before 9 PM Eastern to enter extended bidding, which may continue afterward under a 15-minute auction-wide rule.'),

  -- Leland's — 2026 Fall Classic
  ('lelands', '2026 Fall Classic', '138859', '4', 'Lou Gehrig''s 1934 Tour of Japan album with All-American team signatures and original photographs (PSA)', 'normal',
   'https://auction.lelands.com/bids/bidplace?itemid=138859', 'https://auction.lelands.com/bids/bidplace?itemid=138859', '2026-12-06 03:00:00+00',
   'Lot page (checked 2026-11-26) lists auction end as Dec 5, 2026 at 10:00 PM EST. Check the live lot page for any extended bidding or changed closing time.'),
  ('lelands', '2026 Fall Classic', '138815', '636', '1934 Tour of Japan All-American and Japan teams original photograph featuring Babe Ruth and Lou Gehrig (PSA Type I)', 'normal',
   'https://auction.lelands.com/bids/bidplace?itemid=138815', 'https://auction.lelands.com/bids/bidplace?itemid=138815', '2026-12-06 03:00:00+00',
   'Lot page lists auction end as Dec 5, 2026 at 10:00 PM EST. Check the live lot page for any extended bidding or changed closing time.'),
  ('lelands', '2026 Fall Classic', '138843', '663', '1934 Lou and Eleanor Gehrig Christmas card from Japan during the Tour of Japan', 'normal',
   'https://auction.lelands.com/bids/bidplace?itemid=138843', 'https://auction.lelands.com/bids/bidplace?itemid=138843', '2026-12-06 03:00:00+00',
   'Lot page lists auction end as Dec 5, 2026 at 10:00 PM EST. Check the live lot page for any extended bidding or changed closing time.'),

  -- Heritage — Winter Sports Catalog #50089
  ('heritage', 'Winter Sports Catalog #50089', '50089-81460', '81460', '1937 Yankees team-signed baseball, Gehrig sweet spot', 'normal',
   'https://sports.ha.com/itm/baseball-collectibles/balls/1937-new-york-yankees-team-signed-baseball-with-lou-gehrig-sweet-spot/a/50089-81460.s',
   'https://sports.ha.com/itm/baseball-collectibles/balls/1937-new-york-yankees-team-signed-baseball-with-lou-gehrig-sweet-spot/a/50089-81460.s?ic4=GalleryView-ShortDescription-071515',
   '2026-12-20 04:00:00+00',
   'Lot page: Session 2 (Lots 81422-82181) normal bidding closes 10:00 PM Central Time, Saturday, December 19, 2026; Heritage extended bidding begins then. Live refresh re-reads this cutoff.')
) as seed(house, auction_name, lot_id, lot_number, title, priority, canonical_url, source_url, scheduled_close_at, closing_note)
on conflict (canonical_url) do nothing;
