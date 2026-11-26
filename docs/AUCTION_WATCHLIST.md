# Auction Watchlist (`/admin/auction-watchlist`)

A private, signed-in watchlist of lots across upcoming auctions. It shows current bid, time left, and close time in one place, so Zane doesn't have to switch between auction sites.

**This is private bidding intent.** The data lives only in `public.auction_watchlist_lots`. That table can't be read by `anon` (no RLS policy, table privileges revoked) and isn't joined into any public view. The page sits under `AdminGuard`, so any Clerk signed-in user can see it.

## Pieces

| Piece | Path |
|---|---|
| Migration (table, RLS, seed of Zane's 31 lots) | `supabase/migrations/0039_auction_watchlist.sql` |
| Edge Function (server-side price refresh) | `supabase/functions/auction-watchlist-refresh/index.ts` |
| Firecrawl markdown parsers + Heritage URL validation (pure) | `supabase/functions/auction-watchlist-refresh/parsers.ts` |
| Parser checks (Node, no framework) | `scripts/check-watchlist-parsers.mjs` |
| Page | `src/pages/admin/AuctionWatchlist.jsx` |
| Components | `src/components/admin/watchlist/` (`AuctionGroup`, `WatchlistLotCard`, `LotPrice`, `LotClosing`, `ManualPriceForm`, `AddLotForm`, `WatchlistToolbar`, `styles.js`) |
| Data hook | `src/hooks/useAuctionWatchlist.js` (uses `useSupabaseClient`, the Clerk JWT client) |
| Helpers (house registry, URL validation, time/price formatting) | `src/lib/auctionWatchlist.js` |

## Supported auction houses

| House | `house` key | Live refresh | Max frequency per lot | Notes |
|---|---|---|---|---|
| Robert Edward Auctions | `rea` | ✅ direct fetch | 10 min | `bid.collectrea.com/lots/{id}` |
| Huggins & Scott | `huggins_scott` | ✅ direct fetch | 10 min | `bid.hugginsandscott.com/lots/{id}` |
| Grey Flannel | `grey_flannel` | ✅ via Firecrawl, if `FIRECRAWL_API_KEY` is set; manual otherwise | 60 min | Direct server fetches get a Cloudflare challenge. URL rebuilt from the numeric item id |
| Love of the Game Auctions | `love_of_the_game` | ✅ via Firecrawl, if `FIRECRAWL_API_KEY` is set; manual otherwise | 60 min | Same CreateAuction platform as Grey Flannel. Direct server fetches get HTTP 403. `bid.loveofthegameauctions.com/bids/bidplace?itemid={id}`, rebuilt from the numeric item id |
| Leland's | `lelands` | ✅ via Firecrawl, if `FIRECRAWL_API_KEY` is set; manual otherwise | 60 min | Same CreateAuction platform as Grey Flannel. `auction.lelands.com/bids/bidplace?itemid={id}`, rebuilt from the numeric item id. Pasted `bidplace.aspx?itemid=` links are accepted and stored in the no-extension form |
| Heritage | `heritage` | ✅ via Firecrawl, if `FIRECRAWL_API_KEY` is set; manual otherwise | 60 min | Direct server fetches get a DataDome captcha. `lot_id` = `<saleNo>-<lotNo>`; stored `canonical_url` is validated before use |

REA and H&S run the same Livewire platform. The function parses each lot page for:
- `currentBid` from the `lots.lot-bidding` `wire:snapshot`, falling back to the `x-data` `currentBid:` value
- `endTime`, `status`, and `auctionPeriod` from the lot's `miniCountdown({...})`
- the first `{lotId}-1.jpg` image on the house's own Cloudinary account
- title and lot number from `<h1>Lot # N: …</h1>`, filled in only when missing

Six houses are supported. The seed holds Zane's 31 tracked lots (H&S 3, REA 18, Grey Flannel 2, Love of the Game 2, Leland's 5, Heritage 1).

### Grey Flannel, Love of the Game, Leland's, and Heritage (Firecrawl)

These houses are scraped through Firecrawl (Grey Flannel, Love of the Game, and Heritage block direct server requests; Leland's runs the same CreateAuction page and uses the same path). Grey Flannel, Love of the Game, and Leland's all run CreateAuction's `bidplace` page and share one parser (`parseCreateAuction` in `parsers.ts`), pinned to each site's own exact host. The function calls Firecrawl's scrape API (`POST https://api.firecrawl.dev/v2/scrape` with `{ url, formats: ['markdown'], maxAge: 0 }`) and parses the returned markdown in `parsers.ts`. Each scrape costs one Firecrawl credit.

- **Fetch URL.** Grey Flannel: `https://bid.greyflannelauctions.com/bids/bidplace?itemid=<lot_id>`. Love of the Game: `https://bid.loveofthegameauctions.com/bids/bidplace?itemid=<lot_id>`. Leland's: `https://auction.lelands.com/bids/bidplace?itemid=<lot_id>`. All three are rebuilt from the all-digit id on a fixed host. Heritage: the stored `canonical_url`, accepted only if `new URL()` gives https, host exactly `sports.ha.com` or `www.ha.com`, no username/password/port/query/fragment, a path `/itm/…/a/<sale>-<lot>.s` that equals the stored `lot_id`, and a serialised form identical to the stored string. `source_url` is never used.
- **Lot identity.** Nothing is written unless the scraped page is the expected lot:
  - Grey Flannel / Love of the Game / Leland's: Firecrawl's final URL must be on that house's exact host and carry the same `itemid` (`bidplace` or `bidplace.aspx`) (or, with no URL in the metadata, the page must reference `images_items/item_<lot_id>_`). The page must have exactly one `Lot # N:` heading, and `N` must match the stored `lot_number` (if set). A page from one house never satisfies another house's adapter (Leland's Prev/Next links to other item ids don't count).
  - Heritage: the final URL and `og:url` must end in `/a/<sale>-<lot>.s` on an allowed host. Every `LOT #N` marker must be the stored lot, and the sale number must appear on the page.
- **Current bid.** Read only from a line labeled **Current Bid** (Grey / Love of the Game / Leland's: `### CURRENT BID: $1,464.00`, Heritage: `Current Bid: $3,000`). `Starting Bid`, `Bid Next Minimum`, and `Minimum Next Bid` are never read as the current bid. If the page shows conflicting amounts, the check fails. On the CreateAuction sites, a current bid below the `Starting Bid` also fails the check. A `$0.00` current bid is never a live price.
- **No bids.** Heritage `Status: Starting Bid Not Met` (or 0 bidders) with a `Starting Bid`, or Grey Flannel / Love of the Game / Leland's `Bids: 0`, counts as a successful check. Love of the Game no-bid lots print `CURRENT BID: $0.00`; with `Bids: 0` that is ignored, and without a bid count a `$0.00` reading fails the check instead of being saved. It saves `current_bid = NULL`, sets `opening_bid` to the starting bid, sets `bid_source = 'live'`, and stamps `bid_checked_at`. The UI shows **No bids yet** plus "Opening bid $X". If the page shows no Current Bid and is not clearly a no-bid lot, the check fails.
- **Close time.** Heritage: the lot's session line, e.g. `(Lots 81422-82181) - 10:00 PM Central Time, Saturday, December 19, 2026.`. It is used only when the lot number falls inside the range. Grey Flannel / Love of the Game / Leland's: the auction `End:` line (`12/13/2026 8:00 PM EST`; Leland's `12/5/2026 10:00 PM EST` → `2026-12-06T03:00Z`). The zone label is ignored and the wall time is read in `America/New_York`, because Love of the Game prints `12/12/2026 9:00 PM EDT` even though December is EST (→ `2026-12-13T02:00Z`). All are converted to UTC through their IANA zone.
- **Images.** Grey Flannel: `bid.greyflannelauctions.com/images_items/item_<lot_id>_N_M.jpg`. Love of the Game: `bid.loveofthegameauctions.com/images_items/item_<lot_id>_N_M.jpg`. Leland's: `auction.lelands.com/images_items/item_<lot_id>_N_M.jpg` (verified on the lot 4 page, 2026-11-26). Images on any other host or for another item id are ignored (`image_url` stays NULL). Heritage: `og:image` normalized to `https://dyn1.heritagestatic.com/ha?p=<digits/dashes>&it=product`. The DB CHECK allows only these shapes, per house.
- **Status.** A `Time Left` countdown marks the lot `live`. Grey Flannel / Love of the Game / Leland's `Time Left: Closed/Ended` marks it `closed`. Closed Heritage lots aren't detected. After the scheduled time, the UI still says "May still be in extended bidding".

**Without `FIRECRAWL_API_KEY`**, Grey Flannel, Love of the Game, Leland's, and Heritage lots are marked `unsupported`. They show the last manual price (labeled **Manual**) or **Unavailable**, plus a direct link to the lot page. The group header shows "Manual prices". The page doesn't auto-trigger refreshes for them.

**Testing the parsers:**
```bash
node scripts/check-watchlist-parsers.mjs [grey.json] [heritage-no-bid.json] [heritage-active.json] [lotg-49085.json] [lotg-49605.json] [lelands-138859.json]
```
This needs Node ≥ 22.18 (built-in TypeScript stripping). All 25 fixture checks run against small inline fixtures in the script (minimal synthetic markdown matching the observed Grey Flannel, Love of the Game, Leland's, and Heritage page structure), so a clean checkout always runs and must pass them. The Love of the Game fixtures cover both watchlist lots (17 / item 49085, 41 / item 49605): 0 bids → no current bid, opening bid, close time, image, and rejection of the other lot / item id / house. The Leland's fixture (lot 4 / item 138859, 17 bids) covers the labelled current bid ($32,744, never the $15,000 start), close time, image, `.aspx` final URLs, rejection of the Prev/Next item ids and other hosts, and refusal of below-start / conflicting / `$0` / missing bids. Client `parseLotUrl()` is checked too: `.aspx` and no-extension Leland's links canonicalise to the same URL, and look-alike hosts, ports, credentials, and other paths are rejected. Optionally, saved full Firecrawl responses (CLI JSON or a REST v2 envelope, never committed) are run through the same lot checks too. They default to `/tmp/mintd-*-firecrawl.json`, `/tmp/lotg-<itemid>.json`, and `/tmp/lelands-<itemid>.json` and are left out if absent; a path passed explicitly must exist. The active-bid Heritage fixture (lot 50089-81457) is a parser fixture only. It is not a watchlist lot and must never be seeded.

## Honesty rules

- `current_bid` is written only after a fresh 200 response that parsed cleanly and matched the expected lot (`bid_source = 'live'`), or after an explicit manual entry (`bid_source = 'manual'`). A DB constraint requires `bid_checked_at` and `bid_source` whenever `current_bid` is set.
- The opening bid is never shown as the current bid. It goes in `opening_bid`, labeled "Opening bid", next to **No bids yet**.
- A failed refresh keeps the last verified price (and `bid_checked_at`, so it goes stale). It records `refresh_status` (`blocked` / `error`) and `last_error`. The card shows the error and when the last attempt was made.
- The seed sets no prices. Every lot shows **Unavailable** until the first refresh.
- Stale readings are flagged: older than 60 min, or older than 15 min once the lot is within 24 h of its scheduled close. Firecrawl-scraped houses can only refresh hourly, so their threshold is never below 90 min. Every reading shows "Checked Xm ago".
- Countdowns are to the **scheduled** close. REA and H&S are labeled "Until extended bidding". Other houses (Grey Flannel, Love of the Game, Leland's, Heritage) are labeled "Extended bidding may apply"; Love of the Game requires a bid before 9 PM ET to enter its 15-minute auction-wide extended bidding. After the scheduled time the UI says "May still be in extended bidding". It says closed only if the last refresh reported `lot_status = 'closed'`.

## Security

- **SSRF:** the function never fetches a URL from the request, and never uses `source_url`. For REA, H&S, Grey Flannel, Love of the Game, and Leland's it builds the URL from `(house, lot_id)` with a fixed https host, and `lot_id` must be all digits. For Heritage it re-validates the stored `canonical_url` with the URL parser (see above), on top of the table's CHECK constraint. Direct fetches don't follow redirects (`redirect: 'manual'`), are capped at 2 MB, and time out after 12 s. Firecrawl calls go only to the fixed `api.firecrawl.dev` endpoint. They time out after 45 s, responses are capped at 4 MB, and the scraped page must identify the expected lot. Client-side `parseLotUrl()` and the table's CHECK constraints pin the same hosts and URL shapes.
- **Firecrawl key:** read only from the Edge secret `FIRECRAWL_API_KEY` (`Deno.env`). It is never stored in the repo, the DB, or the client, and never echoed in responses or `last_error`. The response only says `firecrawl_configured: true/false`.
- **Auth:** the function rejects requests without a non-expired `role: authenticated` bearer token. It then runs all reads and writes through PostgREST **as the caller**, using the anon key plus the caller's Clerk JWT, so RLS applies. PostgREST verifies the token signature through the Clerk third-party auth integration. **The service role key is not used.**
- **Rate limiting / credits:** REA and H&S lots are fetched at most once every 10 minutes. Grey Flannel, Love of the Game, Leland's, and Heritage lots are fetched at most once every **60 minutes**. Both are tracked in `refresh_attempted_at`. The slot is claimed *before* fetching, so a failed scrape also waits the full interval instead of retrying and burning credits. Concurrency is 3 (direct) and 2 (Firecrawl). Each call handles at most 60 lots and at most 6 Firecrawl scrapes; extra lots are reported as `deferred`, nearest close first. The page auto-refreshes once per visit, and only when some lot is due. Adding a lot from one of these houses triggers one scrape.

## Setup / deployment

Nothing here has been applied or deployed yet.

1. **Clerk ↔ Supabase third-party auth must be working.** `useSupabaseClient` sends `getToken({ template: 'supabase' })`. Supabase must trust Clerk (Dashboard → Authentication → Third-party auth → Clerk), and the token must carry `"role": "authenticated"`. If the `supabase` JWT template doesn't exist in Clerk, create it, or switch the hook to Clerk's native Supabase integration. Until this works, the page shows "Couldn't load the watchlist".
2. **Apply the migration:**
   ```bash
   supabase db push            # or run 0039_auction_watchlist.sql in the SQL editor
   ```
   It is idempotent. Re-running it re-inserts any seeded lot that was removed in the UI.
3. **Deploy the Edge Function with gateway JWT verification off.** The function verifies the token itself through PostgREST, and the gateway's legacy check rejects Clerk tokens:
   ```bash
   supabase functions deploy auction-watchlist-refresh --no-verify-jwt
   ```
   `SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically. `parsers.ts` is bundled with the function.
4. *(Optional, after Matt's review)* Turn on Grey Flannel, Love of the Game, Leland's, and Heritage live refresh by setting `FIRECRAWL_API_KEY` as a Supabase Edge Function secret. Matt: at deployment time, open `~/.openclaw/secrets.json` on the server, read the existing Firecrawl key there, and enter it as the value of the `FIRECRAWL_API_KEY` secret (Supabase dashboard → Edge Functions → Secrets, or `supabase secrets set`). The key itself is never written down here or anywhere else in the repo. Don't copy it into source, docs, `.env.local`, any `VITE_*` variable, a committed script, or shell history you share. Confirm it's set (names only, no values) with:
   ```bash
   supabase secrets list
   ```
   No redeploy is needed for secrets. If you skip this step, those four houses stay in manual-entry mode. Expect at most about 24 credits per lot per day, and only while the page is open: refreshes run on page visit or **Refresh prices**, not on a schedule. Remove the key with `supabase secrets unset FIRECRAWL_API_KEY` to go back to manual mode.
5. *(Optional)* Restrict CORS:
   ```bash
   supabase secrets set WATCHLIST_ALLOWED_ORIGINS=https://<your-netlify-domain>,http://localhost:5173
   ```
   The default is `*`. Auth is bearer-token based, so CORS is not the security boundary.
6. Open `/admin/auction-watchlist` and click **Refresh prices**. REA and H&S lots should show live bids. With the Firecrawl key set, Grey Flannel lot 150 shows its current bid and Heritage lot 81460 shows "No bids yet · Opening bid $2,000", Love of the Game lots 17 and 41 show "No bids yet" with opening bids $2,500 and $1,000, and Leland's lot 4 shows its current bid ($32,744 with 17 bids on 2026-11-26; the live value will differ) (as of the samples). Leland's lots 636, 663, 1017, and 1061 show whatever their pages report on that refresh (current bid, or "No bids yet" plus opening bid). With 10 Firecrawl-scraped lots and a cap of 6 scrapes per call, the first refresh reports 4 as `deferred` (nearest close first); click **Refresh prices** again to pick them up. Without the key, they show the manual-mode notice and take manual prices.

## Adding lots

Use **Add lot**, then paste a lot URL from one of the six supported hosts. For REA and H&S, only the URL and auction name are needed. Title, lot number, close time, and image come from the first refresh. For Grey Flannel, Love of the Game, Leland's, and Heritage, the first refresh fills these in too, but only when `FIRECRAWL_API_KEY` is set. Without it, enter a title and close time (with time zone) yourself. For Grey Flannel, Love of the Game, and Leland's, entering the lot number also lets the refresh check it against the page. The lot is saved to Supabase, so it syncs across devices.

## Missing-ticket opportunities (WS Ticket Tracker × watchlist)

A private panel at the top of `/admin/auction-watchlist`. It lists watchlist lots that may still be up for auction and explicitly name a World Series game that Zane's **WS Ticket Tracker** Google Sheet marks **Don't Have**. Each row shows the sheet year/game and sheet row (linked to that exact row of the sheet, `gid=0`), the lot link, house and lot number, current bid (`LotPrice`, with Checked/Manual/Stale flags), and time left (`LotClosing`, which keeps the extended-bidding caveat after the scheduled close).

| Piece | Path |
|---|---|
| Edge Function (reads the sheet) | `supabase/functions/ws-ticket-tracker/index.ts` |
| Sheet parser (pure) | `supabase/functions/ws-ticket-tracker/sheet.ts` |
| Lot-title matcher + cross-reference (pure) | `src/lib/wsTicketOpportunities.js` |
| Hook | `src/hooks/useWsTicketTracker.js` |
| Components | `src/components/admin/watchlist/WsOpportunitiesPanel.jsx`, `WsOpportunityGame.jsx` |
| Checks | `node scripts/check-ws-ticket-matcher.mjs` (Node ≥ 22.18, inline fixtures only) |

### Data source

- Spreadsheet `120JePbptof1PYYnld1HPsNnMzAoyxGBrf0GWBq7EuSU`, tab `Sheet1`, fixed bounded range `A1:C1000`. Column A holds the label, B the Have check, and C the Don't Have check. These values are constants in the function. Nothing in the request can change them.
- Row 1 must read `Game | Have | Don't Have`. If it doesn't, the function returns an error ("Sheet layout changed") instead of guessing.
- A section header must look like `YEAR Team vs Team — …`. Headers that mention a tour, Japan, an exhibition, an All-Star game, spring training, or barnstorming are skipped, along with every game row under them. Game rows start with `GM N` (or `Game N`).
- A game counts as missing only when C is checked and B is not. Accepted check values are `✓ ✔ ☑ ✅ x TRUE yes`; blank, `FALSE` and `no` count as unchecked. A row with both boxes checked, or with an unrecognised value, is skipped. So is a year that appears twice, or a game number that repeats within its year.
- The function returns only `{ year, game, row }` for Don't Have games, plus `games_parsed`, `read_at` and `source`. Labels, scores, Have rows and totals are never returned.
- The sheet is read when the page loads and again on **Re-read sheet**. Nothing is cached apart from the Google access token, which lasts about an hour.

### Matching rules (`parseWsTicketLotTitle`)

A lot matches only when its **title** has all of these:
- exactly one distinct year (a range such as `1952–1961`, or two different years, is rejected)
- "World Series", followed directly by `Game N`, or a list such as `Games 1 and 2`, `Games 2 & 6` or `Games 1, 2 and 3` (1–9)
- a ticket term (`ticket(s)` or `stub(s)`)

A title is rejected when any of these apply:
- It names a game range (`Games 3-5`, `3 through 5`).
- It mentions a game number outside the explicit list (for example "Game 7 … Game 6 rain check"). "Games 1 and 2 … in Game 1" is allowed.
- It names a non-ticket or multi-item piece: program, scorecard, photo, pin, pennant, baseball, bat, jersey, uniform, card, album, poster, magazine, lithograph, press, pass, ring, trophy, letter, collection, archive, group, or "lot of".
- It names a non-genuine ticket: reprint, replica, facsimile, phantom, proof.
- It names a different "World Series": Little League, College, Negro League, Junior, Women's, Amateur, Caribbean, Softball, Youth, Senior.

A lot that covers several explicit games appears under each of those games that is missing, with a "Covers Games 1 & 2" badge. A single game can list several lots, nearest scheduled close first. A lot never marks a game as owned or missing; only the sheet does.

### Which lots count as possibly open (`isLotPossiblyOpen`)

`buildWsOpportunities(missing, lots, now)` takes the page clock (`now`, epoch ms, refreshed every minute) and keeps a lot only when:
- `lot_status` is not `'closed'` (a confirmed close hides it immediately, even before the scheduled time), **and**
- it has a parseable `scheduled_close_at`, **and**
- `now` is before `scheduled_close_at + 24 h` (`EXTENDED_BIDDING_GRACE_MS`).

So a lot shows normally before its scheduled close. For up to 24 hours after, it still shows, with the `LotClosing` "May still be in extended bidding" caveat, because extended/soft-close bidding can run past the scheduled time. After 24 hours it is hidden even if no refresh has confirmed it closed. A lot with no known close time is hidden: `lot_status = 'live'` comes from the last refresh and may be stale, so it isn't treated as a reliable sign the lot is up now. Such lots still appear in the main watchlist below.

On 2026-11-26 the sheet had 283 rows (41 series sections, from 1919 to 2009). There are 239 game rows: 153 are checked Have and 86 are checked Don't Have. The TOTALS row says 141 / 98, which disagrees with the checkmarks. The panel counts the checkmarks and ignores TOTALS. Run against the 31 seeded lots, the panel matches 8 missing games with 9 lots:
- 1941 G4: Leland's 1017
- 1947 G4: REA 3686
- 1956 G6: H&S 1419
- 1960 G1: H&S 1446
- 1963 G1: REA 3722, plus REA 3731 (the Games 1 & 2 pair)
- 1963 G2: H&S 1473, plus REA 3731
- 1996 G1: REA 5087
- 2000 G5: REA 3763

### Panel states

| State | Shown when |
|---|---|
| Reading the sheet… | The request is in flight |
| **Sheet not connected** | The function returned 503 `{ configured: false }` because the `GOOGLE_SERVICE_ACCOUNT` secret is missing or invalid JSON. The panel says the sheet connection needs Matt to finish setup (no secret names or doc paths in the UI). No matches are shown. |
| **Sheet unavailable** | Auth failed, Google returned an error, sharing is missing, the layout changed, or the request timed out. The error is shown and no matches are listed. |
| **Sheet read Xm ago** | A successful read. Only this state shows matches. |

### Security

- **Auth:** this works the same way as `auction-watchlist-refresh`. The function requires a non-expired `role: authenticated` bearer token. It then proves the token with a one-row read of `auction_watchlist_lots` through PostgREST, as the caller under RLS. Signature failures return 401 before Google is contacted. The service role key is not used.
- **Google credential:** `GOOGLE_SERVICE_ACCOUNT` is the full service-account JSON. It is stored only as an Edge Function secret and is never in the repo, the client, a `VITE_*` variable, or `.env.local`. It is used to mint a read-only token (`spreadsheets.readonly` scope) and is never logged or returned. Only messages the function writes itself reach the client.
- Google requests time out after 10 s, don't follow redirects, and the sheet response is capped at 1 MB.

### Deploy (Matt, after review)

1. Share the sheet (Viewer) with the service account's `client_email`, if it isn't shared already. The service account in `~/.openclaw/secrets.json` was independently confirmed to read it on 2026-11-26.
2. Set the secret from the existing value in `~/.openclaw/secrets.json` (key `GOOGLE_SERVICE_ACCOUNT`). Pipe it straight from the file so it never shows up in shell history or docs:
   ```bash
   supabase secrets set GOOGLE_SERVICE_ACCOUNT="$(jq -c '.GOOGLE_SERVICE_ACCOUNT | if type == "string" then fromjson else . end' ~/.openclaw/secrets.json)"
   supabase secrets list   # names only
   ```
   Alternatively, paste the JSON into Supabase dashboard → Edge Functions → Secrets.
3. Deploy with gateway JWT verification off. The function verifies the token itself, as `auction-watchlist-refresh` does:
   ```bash
   supabase functions deploy ws-ticket-tracker --no-verify-jwt
   ```
4. Open `/admin/auction-watchlist`. The panel header should read "Sheet read just now · 86 Don't Have games …", or whatever counts the sheet has by then.

`WATCHLIST_ALLOWED_ORIGINS`, if set, restricts CORS for this function too.

### Current limits

- Only Sheet1 World Series sections are used. Sheet1 A1:C1000 currently has no Japan Tours rows, and tour or exhibition sections would be skipped anyway.
- Matching uses lot titles only. A real ticket lot whose title leaves out the year, the game number, or "ticket"/"stub" won't show up, and neither will one whose description says it's a ticket while the title doesn't. To get it matched, edit the title in the DB.
- Exclusion words are blunt. A title like "World Series Game 4 ticket stub, Mantle card back" would be dropped.
- The sheet is read with `FORMATTED_VALUE`. Checkbox cells read as `TRUE`/`FALSE`, and both are handled.
- No data is cached. Each page load and each **Re-read sheet** makes one Sheets API call.
