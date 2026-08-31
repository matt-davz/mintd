-- ============================================================
-- 0037_populate_1942_box_scores.sql
-- Populate box scores and notes for 1942 WS Games 3, 4 and
-- add notes to Game 5 game_context records.
--
-- Line scores sourced from Wikipedia / Baseball Almanac / SABR.
-- ============================================================

-- Game 3: Cardinals 2, Yankees 0 — Ernie White 6-hit shutout
-- Line: STL 001 000 001 = 2  5  1
--       NYY 000 000 000 = 0  6  1
UPDATE public.game_context
SET
  box_score = '{
    "innings": [
      {"inning": 1, "away": 0, "home": 0},
      {"inning": 2, "away": 0, "home": 0},
      {"inning": 3, "away": 1, "home": 0},
      {"inning": 4, "away": 0, "home": 0},
      {"inning": 5, "away": 0, "home": 0},
      {"inning": 6, "away": 0, "home": 0},
      {"inning": 7, "away": 0, "home": 0},
      {"inning": 8, "away": 0, "home": 0},
      {"inning": 9, "away": 1, "home": 0}
    ],
    "away": {"r": 2, "h": 5, "e": 1},
    "home": {"r": 0, "h": 6, "e": 1}
  }'::jsonb,
  player_box_score = '{
    "away": {
      "batting": [
        {"name": "Jimmy Brown", "position": "2B", "ab": 4, "r": 0, "h": 1, "rbi": 1, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "1-4 | RBI"},
        {"name": "Terry Moore", "position": "CF", "ab": 4, "r": 0, "h": 0, "rbi": 0, "bb": 0, "k": 1, "sb": 0, "summary": "0-4 | K"},
        {"name": "Enos Slaughter", "position": "RF", "ab": 4, "r": 0, "h": 1, "rbi": 1, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "1-4 | RBI"},
        {"name": "Stan Musial", "position": "LF", "ab": 4, "r": 0, "h": 0, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "0-4"},
        {"name": "Walker Cooper", "position": "C", "ab": 3, "r": 0, "h": 0, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "0-3"},
        {"name": "Johnny Hopp", "position": "1B", "ab": 3, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "1-3"},
        {"name": "Whitey Kurowski", "position": "3B", "ab": 2, "r": 1, "h": 0, "rbi": 0, "bb": 1, "k": 1, "sb": 0, "summary": "0-2 | BB, R"},
        {"name": "Marty Marion", "position": "SS", "ab": 3, "r": 1, "h": 1, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "1-3 | R"},
        {"name": "Ernie White", "position": "P", "ab": 2, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "1-2"}
      ],
      "pitching": [
        {"name": "Ernie White", "ip": "9.0", "h": 6, "r": 0, "er": 0, "bb": 0, "k": 6, "hr": 0, "note": "(W, 1-0)", "summary": "9.0 IP, 0 ER, 6 K, 0 BB — CG shutout"}
      ]
    },
    "home": {
      "batting": [
        {"name": "Phil Rizzuto", "position": "SS", "ab": 4, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 0, "hr": 0, "sb": 1, "summary": "1-4 | SB"},
        {"name": "Red Rolfe", "position": "3B", "ab": 4, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "1-4"},
        {"name": "Roy Cullenbine", "position": "RF", "ab": 4, "r": 0, "h": 0, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "0-4"},
        {"name": "Joe DiMaggio", "position": "CF", "ab": 4, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 1, "sb": 0, "summary": "1-4 | K"},
        {"name": "Charlie Keller", "position": "LF", "ab": 3, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "1-3"},
        {"name": "Joe Gordon", "position": "2B", "ab": 3, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "1-3"},
        {"name": "Bill Dickey", "position": "C", "ab": 3, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "1-3"},
        {"name": "Jerry Priddy", "position": "1B", "ab": 3, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "1-3"},
        {"name": "Spud Chandler", "position": "P", "ab": 2, "r": 0, "h": 0, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "0-2"},
        {"name": "Marv Breuer", "position": "P", "ab": 0, "r": 0, "h": 0, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "0-0"},
        {"name": "Jim Turner", "position": "P", "ab": 0, "r": 0, "h": 0, "rbi": 0, "bb": 0, "k": 0, "sb": 0, "summary": "0-0"}
      ],
      "pitching": [
        {"name": "Spud Chandler", "ip": "7.2", "h": 3, "r": 1, "er": 1, "bb": 1, "k": 1, "hr": 0, "note": "(L, 0-1)", "summary": "7.2 IP, 1 ER, 1 K, BB"},
        {"name": "Marv Breuer", "ip": "0.2", "h": 2, "r": 1, "er": 0, "bb": 0, "k": 0, "hr": 0, "note": "", "summary": "0.2 IP, 0 ER"},
        {"name": "Jim Turner", "ip": "0.2", "h": 0, "r": 0, "er": 0, "bb": 1, "k": 0, "hr": 0, "note": "", "summary": "0.2 IP, 0 ER, BB"}
      ]
    }
  }'::jsonb,
  notes = 'Ernie White pitched a masterful 6-hit shutout, walking none and striking out 6. First Yankees WS shutout since 1926 — also by the Cardinals. Record crowd of 69,123 at Yankee Stadium. Cardinals outfield of Moore, Musial, and Slaughter made spectacular catches to preserve the shutout.',
  updated_at = now()
WHERE id = '9d5b6cba-15bd-4a35-aae1-d8ec2b57fe19';


-- Game 4: Cardinals 9, Yankees 6 — Max Lanier 3 IP shutout relief for the win
-- Line: STL 000 600 201 = 9  12  1
--       NYY 100 005 000 = 6  10  1
UPDATE public.game_context
SET
  box_score = '{
    "innings": [
      {"inning": 1, "away": 0, "home": 1},
      {"inning": 2, "away": 0, "home": 0},
      {"inning": 3, "away": 0, "home": 0},
      {"inning": 4, "away": 6, "home": 0},
      {"inning": 5, "away": 0, "home": 0},
      {"inning": 6, "away": 0, "home": 5},
      {"inning": 7, "away": 2, "home": 0},
      {"inning": 8, "away": 0, "home": 0},
      {"inning": 9, "away": 1, "home": 0}
    ],
    "away": {"r": 9, "h": 12, "e": 1},
    "home": {"r": 6, "h": 10, "e": 1}
  }'::jsonb,
  player_box_score = '{
    "away": {
      "batting": [
        {"name": "Jimmy Brown", "position": "2B", "ab": 4, "r": 1, "h": 1, "rbi": 0, "bb": 1, "k": 0, "hr": 0, "sb": 0, "summary": "1-4 | BB, R"},
        {"name": "Terry Moore", "position": "CF", "ab": 5, "r": 1, "h": 2, "rbi": 1, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "2-5 | RBI, R"},
        {"name": "Enos Slaughter", "position": "RF", "ab": 4, "r": 1, "h": 1, "rbi": 0, "bb": 1, "k": 0, "hr": 0, "sb": 0, "summary": "1-4 | BB, R"},
        {"name": "Stan Musial", "position": "LF", "ab": 5, "r": 2, "h": 3, "rbi": 1, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "3-5 | RBI, 2 R"},
        {"name": "Walker Cooper", "position": "C", "ab": 5, "r": 0, "h": 1, "rbi": 1, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "1-5 | RBI"},
        {"name": "Johnny Hopp", "position": "1B", "ab": 5, "r": 1, "h": 1, "rbi": 0, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "1-5 | R"},
        {"name": "Whitey Kurowski", "position": "3B", "ab": 4, "r": 1, "h": 1, "rbi": 2, "bb": 1, "k": 0, "hr": 0, "sb": 0, "summary": "1-4 | 2 RBI, BB, R"},
        {"name": "Marty Marion", "position": "SS", "ab": 3, "r": 1, "h": 0, "rbi": 1, "bb": 1, "k": 0, "hr": 0, "sb": 0, "summary": "0-3 | RBI, BB, R"},
        {"name": "Mort Cooper", "position": "P", "ab": 3, "r": 1, "h": 1, "rbi": 2, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "1-3 | 2 RBI, R"},
        {"name": "Max Lanier", "position": "P", "ab": 1, "r": 0, "h": 1, "rbi": 1, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "1-1 | RBI"}
      ],
      "pitching": [
        {"name": "Mort Cooper", "ip": "5.1", "h": 8, "r": 6, "er": 5, "bb": 1, "k": 2, "hr": 1, "note": "", "summary": "5.1 IP, 5 ER, 2 K, BB"},
        {"name": "Harry Gumbert", "ip": "0.2", "h": 2, "r": 0, "er": 0, "bb": 0, "k": 0, "hr": 0, "note": "", "summary": "0.2 IP, 0 ER"},
        {"name": "Howie Pollet", "ip": "0.0", "h": 0, "r": 0, "er": 0, "bb": 0, "k": 0, "hr": 0, "note": "", "summary": "0.0 IP — got final out of 6th"},
        {"name": "Max Lanier", "ip": "3.0", "h": 0, "r": 0, "er": 0, "bb": 0, "k": 1, "hr": 0, "note": "(W, 1-0)", "summary": "3.0 IP, 0 ER, K — shutout relief"}
      ]
    },
    "home": {
      "batting": [
        {"name": "Phil Rizzuto", "position": "SS", "ab": 5, "r": 1, "h": 1, "rbi": 0, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "1-5 | R"},
        {"name": "Red Rolfe", "position": "3B", "ab": 3, "r": 2, "h": 2, "rbi": 0, "bb": 1, "k": 0, "hr": 0, "sb": 0, "summary": "2-3 | BB, 2 R"},
        {"name": "Roy Cullenbine", "position": "RF", "ab": 4, "r": 1, "h": 2, "rbi": 2, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "2-4 | 2 RBI, R"},
        {"name": "Joe DiMaggio", "position": "CF", "ab": 4, "r": 0, "h": 0, "rbi": 0, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "0-4"},
        {"name": "Charlie Keller", "position": "LF", "ab": 4, "r": 1, "h": 1, "rbi": 3, "bb": 0, "k": 0, "hr": 1, "sb": 0, "summary": "1-4 | HR, 3 RBI, R"},
        {"name": "Joe Gordon", "position": "2B", "ab": 4, "r": 1, "h": 0, "rbi": 0, "bb": 0, "k": 1, "hr": 0, "sb": 0, "summary": "0-4 | K, R"},
        {"name": "Bill Dickey", "position": "C", "ab": 4, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "1-4"},
        {"name": "Jerry Priddy", "position": "1B", "ab": 4, "r": 0, "h": 2, "rbi": 1, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "2-4 | RBI"},
        {"name": "Hank Borowy", "position": "P", "ab": 1, "r": 0, "h": 0, "rbi": 0, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "0-1"},
        {"name": "Atley Donald", "position": "P", "ab": 1, "r": 0, "h": 1, "rbi": 0, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "1-1"},
        {"name": "Tiny Bonham", "position": "P", "ab": 1, "r": 0, "h": 0, "rbi": 0, "bb": 0, "k": 0, "hr": 0, "sb": 0, "summary": "0-1"}
      ],
      "pitching": [
        {"name": "Hank Borowy", "ip": "3.1", "h": 5, "r": 4, "er": 4, "bb": 2, "k": 0, "hr": 0, "note": "", "summary": "3.1 IP, 4 ER, 2 BB"},
        {"name": "Atley Donald", "ip": "0.2", "h": 3, "r": 2, "er": 2, "bb": 0, "k": 0, "hr": 0, "note": "(L, 0-1)", "summary": "0.2 IP, 2 ER"},
        {"name": "Tiny Bonham", "ip": "5.0", "h": 4, "r": 3, "er": 3, "bb": 2, "k": 1, "hr": 0, "note": "", "summary": "5.0 IP, 3 ER, K, 2 BB"}
      ]
    }
  }'::jsonb,
  notes = 'Cardinals erupt for 6 runs in the 4th inning to blow the game open. Yankees rally with 5 in the 6th — Charlie Keller''s 3-run HR cuts it to 6-5, Jerry Priddy''s double ties it at 6-6. Cardinals retake the lead for good in the 7th on Walker Cooper''s RBI single. Max Lanier pitches 3 scoreless innings of relief. Record crowd of 69,902 at Yankee Stadium.',
  updated_at = now()
WHERE id = 'a4f2c8d1-1942-4004-b000-000000000004';


-- Game 5: Add notes (box_score and player_box_score already populated)
UPDATE public.game_context
SET
  notes = 'Phil Rizzuto leads off with a HR in the 1st. Enos Slaughter ties it with a solo shot in the 4th. DiMaggio RBI single puts Yankees up 2-1. Cooper''s sac fly ties it in the 6th. Whitey Kurowski''s 2-run HR in the 9th wins the Series — Cardinals dethrone the Yankees for the first time since 1926. Johnny Beazley CG, 2nd win of the Series.',
  updated_at = now()
WHERE id = 'c66c1205-5629-4775-900d-0feadec85f56'
  AND notes IS NULL;
