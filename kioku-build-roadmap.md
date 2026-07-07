# Kioku — Build Roadmap

Milestone-based: finish them in order, at your own pace. Each milestone ends with a **working, deployed app** — never a broken half-state. Target: family phones ready before the trip (Sep 12, 2026).

**Stack:** MongoDB Atlas · Express · React (PWA) · Node · Vercel · AWS S3

---

## M0 — Walking skeleton (do this first, it kills the scary part)

Empty app, deployed end to end.

- Create the repo: React app (Vite) + Express API + MongoDB Atlas connection
- One API route (`/api/health`) returning `{ ok: true }`; React page that displays it
- Deploy to Vercel; open it on your iPhone and one family Android
- **Done when:** you open a live URL on your phone and see data from your own API

## M1 — Accounts and trips

- Sign up / sign in: email + password (JWT), then add Google sign-in
- Profile: name + profile photo (photo can be a placeholder until M3)
- Create trip: name, dates, daily budget, home currency — editable later
- Invite link: creates a join URL; opening it while signed in joins the trip
- Roles: creator = admin; admin can grant admin to others
- **Done when:** two real accounts (you + a family member) are in the same trip via the link

## M2 — The journal core

- Day model: trip dates → day cards, Japan-timezone "today"
- Today view: header, avatars, day navigation (swipe/scroll to previous days)
- "+" bottom sheet with the three options (placeholders OK)
- Expenses end to end: form (amount-first, category chips, who-paid defaults to you) → appears on day card → daily/trip totals with budget bar → yen + home currency conversion
- Day notes
- Attribution ("added by") on everything
- **Done when:** you can log a full fake day of spending and it looks like the wireframe

## M3 — Photos

- AWS S3 bucket + presigned upload flow (API grants permission, phone uploads direct)
- Resize/compress on upload (target: journal loads fast on street 4G)
- Multi-select from gallery, camera capture, batch note, per-photo notes after upload
- Photo grid on day cards; "+N" opens the full day gallery
- Profile photos (finish the M1 placeholder)
- **Done when:** a photo taken on your iPhone appears on a family Android within one refresh

## M4 — Places

- Place search with autocomplete (Google Places API — free tier is enough for one family)
- "Add as my own place" manual fallback
- "Suggestions near you" chips (browser location permission, suggestions only)
- Places list on day cards with attribution + time; mini route map on day detail
- **Done when:** searching "teamlab" finds the real place, and a made-up place saves too

## M5 — Polish and PWA install

- PWA manifest + service worker: installs to home screen with the Kioku icon on Android and iPhone
- Basic offline behavior: journal readable offline; adds queue politely or fail clearly (decide here)
- Day detail view finished (journal-style note, expense list, map)
- Empty states, loading states, error messages — the "feels like a real app" pass
- **Done when:** family members install Kioku from a link, no explanations needed

## M6 — Recap + trip readiness

- Recap screen: stats, spending by category, route map, highlights, flip-through days, share
- Full dry run: a 2-day fake trip with the whole family adding real data from their phones
- Fix everything the dry run exposes (there will be things)
- **Done when:** the dry run recap makes the family smile

---

## Rules of the build

1. **Deploy from day one.** Every milestone lives on the real URL, not localhost.
2. **Ship ugly, then polish.** A working expense form beats a beautiful unfinished one.
3. **The dry run is not optional.** Schedule it at least 2 weeks before the flight.
4. **When time is short, cut features, not milestones.** Suggestions chips or the mini map can slip; photos and expenses cannot.
5. **V2 stays V2.** Chat, settle-up, videos, export — nothing enters scope before the trip.

## Buffer plan (if the trip arrives early)

Minimum viable Kioku = M0–M3. A journal with photos and expenses, places typed manually as text. Everything after M3 is enhancement.
