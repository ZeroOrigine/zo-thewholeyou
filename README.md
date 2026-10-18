# The Whole You

A free 3D dream adventure for ages 5 and up, made by Advik. 53 chapters, 38 dreamers, a black hole, a castle, a paper moon. Every dream shows you a piece of yourself.

Live: https://thewholeyou.zeroorigine.com

## What is here

| Path | What |
|---|---|
| `docs/index.html` | The whole game, one file (three.js r147 from jsdelivr) |
| `docs/models/*.txt` | Base64 GLB bodies: Soldier (max), Michelle (mia), ReadyPlayerMe (dad), RobotExpressive (bot), Xbot |
| `docs/privacy.html` | Privacy notice |
| `supabase/functions/thewholeyou-api` | The one door on zo-platform: /health, /pulse, /complete, /night/run |
| `notes/` | Adoption record |

## Rules this product follows

- Child-directed. No accounts, no ads, no purchases, no cookies, no device id.
- Progress lives in the player's browser (localStorage) only.
- Two anonymous counters leave the device: one `page_view` beacon per open, and one `{chapter, stars}` row per chapter completed. Neither carries any identifier.
- Marketing is manual only (founder reviewed).
- Product copy carries no em dash.

## Deploy

Netlify site linked to this repo, publish dir `docs`, no build. A push to `main` is a deploy.
The source of truth for the game itself is the founder's claude.ai artifact (Advik edits there); copy `index.html` here, add `<!doctype html><html><head>` and `</head><body>`, strip em dashes, keep the beacon block at the end.
