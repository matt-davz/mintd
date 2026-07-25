-- ============================================================
-- 0034_populate_museum_titles.sql
-- Populate museum_title on items for all legendary items.
-- Run AFTER 0034_legendary_museum_title.sql.
--
-- Naming convention:
--   WS tickets (non-auto): [tidbit] — Ticket Stub / Full Ticket
--   WS tickets (auto):     [tidbit] — Ticket Stub / Full Ticket — Signed by [Name(s)]
--   Programs (WS):         [tidbit] — Program
--   Non-WS / special:      [tidbit] — [item type] (no game/score, those come from game_context)
--   Photo:                 [tidbit] — Photo
-- ============================================================

-- 1921 WS Game 1 — First Yankees World Series Appearance — Ticket Stub (non-auto)
update public.items set museum_title = 'First Yankees World Series Appearance — Ticket Stub'
  where id = '5685bf0b-07ce-5a19-bc21-d9c7d1b07011';

-- 1923 Yankee Stadium Grand Opening Program (regular season, no game/score block)
update public.items set museum_title = 'Yankee Stadium Grand Opening — Program'
  where id = '6133b57c-06e5-5396-ac93-f6ff72be4347';

-- 1927 WS Game 4 — Babe Ruth HR — Full Ticket (non-auto)
update public.items set museum_title = 'Babe Ruth World Series Home Run — Full Ticket'
  where id = 'bc6f09a7-9993-534d-8fea-3f14676174ee';

-- 1927 WS Game 4 — Series Sweep — Program (non-auto)
update public.items set museum_title = 'Bronx Bombers Clinch Series Sweep — Program'
  where id = 'c4c8bdbd-b641-4b3e-ba6a-465a34b60476';

-- 1932 WS Game 3 — Called Shot — Full Ticket (non-auto)
update public.items set museum_title = 'Babe Ruth Called Shot (WS HR #14) — Full Ticket'
  where id = 'e92dffeb-738a-55ee-8caf-7ab7b236bc06';

-- 1941 Gehrig Memorial — exhibition, no game/score block
update public.items set museum_title = 'Lou Gehrig Memorial — Ticket Stub — Signed by Connie Mack'
  where id = '64d0bfcf-9a98-576f-b88c-4759bf3c97d0';

-- 1949 WS Game 1 — Tommy Henrich Walk-Off HR — Ticket Stub (auto)
update public.items set museum_title = 'Tommy Henrich First WS Walk-Off Home Run — Ticket Stub — Signed by Tommy Henrich'
  where id = '6a5d1a6a-2a8d-47aa-a66c-b02287fa0baf';

-- 1956 WS Game 5 — Don Larsen Perfect Game — Full Ticket (auto, 3 signers)
update public.items set museum_title = 'Don Larsen Perfect Game — Full Ticket — Signed by Don Larsen, Sal Maglie & Whitey Ford'
  where id = '5117686c-e69c-5a10-bf11-890b63c546f7';

-- 1961 Maris 61st HR — regular season, no game/score block
update public.items set museum_title = 'Roger Maris 61st Home Run — Ticket Stub — Signed by Roger Maris'
  where id = '66da9a6b-d49f-51d3-9733-afca417fab7c';

-- 1977 WS Game 6 — Reggie Three HRs — Full Ticket (auto)
update public.items set museum_title = 'Reggie Jackson Three Home Runs — Full Ticket — Signed by Reggie Jackson'
  where id = 'a3d15d60-43c8-4bbd-8efd-18ba718805b0';

-- 1948 Babe Bows Out photo — no game context
update public.items set museum_title = '"Babe Bows Out" Pulitzer-Winning Photo — Nat Fein, 1948'
  where id = 'c384f509-8767-46ff-918b-8555b67198c6';
