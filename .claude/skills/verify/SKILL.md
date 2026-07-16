---
name: verify
description: How to run and verify Kioku locally — launch API + client, drive flows with test accounts, clean up test data.
---

# Verifying Kioku locally

## Launch

Both servers are in `.claude/launch.json` — start them with the preview tools (never Bash):

- `api` — Express on port 5050 (`node server/local.js`, reads root `.env`)
- `client` — Vite on port 5173 (proxies `/api` to 5050)

Drive the app at http://localhost:5173.

## Important: the local API uses the REAL Atlas database

`.env` points `MONGODB_URI` at the production `kioku` database on Atlas. There is no
separate dev DB. Anything you create locally is visible to real users (published trips
appear in the live feed).

- Use throwaway accounts with `@example.com` emails and a name suffix like "UITest".
- Signup form is at `/signup` (name / email / password ≥ 8 chars).
- **Always clean up when done**: delete the test users and their friendships,
  directmessages, comments, favorites, reports, blocks, and likes. A one-off
  `node --input-type=module` script with mongoose against `process.env.MONGODB_URI`
  works well (collections: `users`, `friendships`, `directmessages`, `comments`,
  `favorites`, `blocks`, `reports`, `likes`, `trips`).

## Multi-account flows

The browser pane shares localStorage across tabs (same origin), so you cannot be two
users at once. Log out (nav "Log out" button) and log back in as the other account.

## Gotchas

- `read_page` sometimes returns "(empty page)" with viewport 0x0 right after a
  navigation; ref-based clicks then land at (0,0) or negative coordinates and
  silently miss. Take a `screenshot` first to stabilize, then re-run `read_page`
  and click by fresh ref. Verify effects via network requests or page text, not
  by assuming the click landed.
- `scroll` actions can time out; `javascript_tool` with `scrollTo`/`scrollIntoView`
  is reliable.
- Useful checks: `read_network_requests` with `urlPattern` for API status codes,
  `javascript_tool` reading `document.querySelector('main').innerText` for content.

## Seed content

The "Japan 2026" trip (published) is the real seed trip. Test debris from M10 testing
(M10 Alice/Bob/Carol/Dave, Aiko/Ben Test users, "M10 Test Trip", "Kyoto Autumn") may
still exist — check before creating more.
