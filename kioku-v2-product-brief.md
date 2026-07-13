# Kioku v2 — Product Brief

*From family trip journal to a social network for trips*

**Version:** 2.0 · **Date:** July 13, 2026 · **Status:** MVP scoped, ready for planning

---

## 1. The Pivot

Kioku v1 is a shared trip journal — photos, expenses, and places, organized by day, contributed by the whole group. It's built, deployed, and works (M0–M6 complete, plus chat, settle-up, and gesture polish).

**Kioku v2 turns it into a social network for trips.** Travelers publish the trips they documented; others browse them for inspiration and copy them as the starting point for their own trip.

**One-liner:** *Facebook for trips — real trips, real places, real costs, and you can copy any of them.*

## 2. Why This Wins

Instagram shows what a trip *looked like*. Blogs describe it. Neither gives you the thing people actually want when planning: **the real itinerary and the real cost.** A published Kioku trip is not a post — it's a working template built from someone's actual trip.

Two structural advantages:

1. **The creation side is already built.** The hardest part of any content network — getting people to produce rich content — is solved: documenting the trip *is* using the app. Publishing is one tap on top of it.
2. **Copy solves the empty-network problem.** Even with little content and zero friends, one good published trip to your destination is immediately useful. Value doesn't depend on having a social graph.

## 3. Core Loop

Document a trip (v1, built) → publish it with privacy control → others discover it via feed/search → they like, comment, save, or **copy it** into their own editable trip → they travel and document → repeat.

## 4. Target Users

- Travelers on international trips — any destination, not Japan-specific.
- Two modes of the same user: **the documenter** (during a trip) and **the planner/browser** (before one).

## 5. MVP Features (v2)

### Publishing a trip
- A trip is **private by default**; publishing is an explicit action by the owner.
- Publish flow asks: **"Publish everything?"** If not → **Edit publication**:
  - Mark individual photos or expenses to exclude
  - Smart shortcuts: *no photos at all*, *no expenses at all*
- Published trip page: read-only view for non-members — route and places by day, day notes, photos, expenses/budget (as the owner chose to expose them), trip stats.
- Owner can unpublish or re-edit publication at any time.

### Discovery
- **Feed** of popular trips, ranked by likes.
- **Search** by destination, with filters: budget range, trip length, trip type (family / couple / solo / friends).
- Both exist side by side, like Instagram's home + explore/search.

### Copy trip — the differentiator
- "Copy this trip" on any published trip → a short wizard, not a giant form:
  1. New dates
  2. Who's coming (invite your own people — existing invite-link flow)
  3. Daily budget
  4. Route screen: the original's places and day order, ready to reorder, remove, add
- Result: a normal private Kioku trip of mine, fully editable afterward like any trip.
- Design bar: copying a 10-day trip should take a couple of minutes, not an evening.

### Social layer
- **Friends** — mutual (request/accept), like Facebook. No follower model: people don't publish trips every day, following adds little.
- **Direct messages** between friends, independent of any trip (trip chat already exists per-trip).
- **Likes** on trips (feeds the popularity ranking).
- **Comments** on published trips.
- **Share to a friend** — send a trip to a friend inside the app.
- **Favorites** — save trips to a personal list without copying.

### New home screen
- Today's home is "my trips" only. v2 needs a home that balances **my trips + the feed** without clutter. Gets its own design pass — this is a real UX problem, not an afterthought.
- Likely shape: tabbed or sectioned home (My Trips / Discover), search prominent, plus entry points for friends/messages. To be wireframed.

## 6. Out of Scope (v2)

- Follower/following model
- Algorithmic personalized feed (popularity + search is enough to start)
- Monetization of any kind
- Native apps (PWA continues)

Nothing existing is removed: trip chat, settle-up/balances, recap, and all v1 features stay as-is for trip members.

## 7. Privacy Principles

- **Private by default.** Nothing is visible outside the trip's members until the owner explicitly publishes.
- **Owner controls exposure.** Per-item exclusion plus "no photos / no expenses" shortcuts.
- **Members are people, not data.** Published trips should not leak member emails or precise personal info (v1 already hides member emails).
- Open: does publishing need consent/notice to other trip members whose photos are included? (See §9.)

## 8. User Flows

**Publish:** Trip → "Publish" → "Publish everything?" → yes = live; no = edit-publication screen (toggle items, shortcuts) → publish → trip appears in feed/search.

**Discover:** Home → Discover tab → scroll popular trips or search "Portugal, 7–10 days, family" → open a trip → browse days, route, budget.

**Copy:** On a published trip → "Copy this trip" → wizard (dates → people → budget → adjust route) → lands on my new private trip's Today/plan view.

**Befriend & share:** Profile → add friend → accepted → DM them / share a trip → they open it in-app.

## 9. Open Questions (for planning sessions)

- **Home screen design** — the tab structure and what lives where. First wireframe topic.
- **Member consent on publish** — notify/require approval from trip members before their photos go public?
- **Comments moderation** — report/delete tools; who moderates? Minimum viable safety for a public network (report content, block user) — which parts are MVP?
- **Copied-trip attribution** — does a copied trip show "based on a trip by X"? (Nice credit mechanic, encourages publishing.)
- **Likes/ranking details** — recency weighting so the feed isn't frozen? Destination diversity?
- **DM delivery** — polling like v1 or time for websockets?
- **Language** — English only still, or does a social network need more?

---

*Next step: milestone roadmap (see kioku-v2-build-roadmap.md), then wireframe the home screen and publish flow.*
