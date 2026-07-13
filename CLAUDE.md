# Kioku

A trip journal PWA (MERN stack: MongoDB Atlas, Express, React/Vite, Node) deployed on Vercel, with AWS S3 for photos. `client/` is the React app, `server/` is the Express API.

## Where the product is

- **v1 (shipped):** shared family trip journal — accounts, trips, invite links, day-by-day expenses/photos/places, recap, PWA, plus chat with mentions, Splitwise-style balances, and gesture polish. Milestones M0–M6 complete.
- **v2 (current focus):** pivot to a social network for trips — publish trips, feed + search, likes/comments/friends/DMs, and the differentiator: **copying a published trip** as an editable template.

## Required reading before working on v2

1. `kioku-v2-product-brief.md` — the v2 concept, MVP scope, privacy principles, and open questions
2. `kioku-v2-build-roadmap.md` — milestones M7–M12, in order; finish one before starting the next

v1 context (still accurate for existing features): `kioku-product-brief.md`, `kioku-build-roadmap.md`.

## Rules of the build

- Milestone-based, in order; each milestone ends deployed and working — never a broken half-state
- Trips are **private by default**; privacy bugs are release blockers
- When a milestone drags, cut features inside it, not the milestone
- Ship ugly, then polish (M11 is the polish pass)
