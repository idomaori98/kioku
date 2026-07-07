# Kioku — Product Brief

*記憶 — "memory" in Japanese*

**Version:** 1.1 · **Date:** July 6, 2026 · **Status:** MVP locked, wireframes approved

---

## 1. Concept

Kioku is a **shared family trip journal**. One family member creates a trip and invites the rest of the family from their phone contacts. Everyone adds photos, expenses, and places into a beautiful day-by-day journal — every item attributed to who added it. When the trip ends, Kioku produces a recap the family can revisit and share.

**One-liner:** *A trip journal that builds itself, day by day, from the whole family.*

**First real-world test:** the founder's family trip to Japan, September 2026.

## 2. Target Users

- **V1:** The founder's family only. A personal tool — no compromises, fastest path to shipping before the trip.
- **Later:** Families traveling together, then possibly any travel group.

## 3. Core Value

The trip's three daily essentials — **money spent, pictures taken, places visited** — live in one aesthetic place, organized by day, contributed by everyone.

## 4. MVP Features (V1)

### Trip
- Create a trip: name, dates, daily budget, home currency (all editable later)
- Invite family via phone contacts (invite link); joining by code as fallback
- **Permissions:** trip creator is admin — only they can edit/delete others' content, and they can grant admin rights to other members. Everyone else edits only their own items.

### Daily Journal
- **"Today" card** front and center: today's photo highlights, total spent, places visited
- Previous days as scrollable/swipeable cards — like flipping through a travel journal
- Notes on each day and on each photo
- Every item shows who added it

### Photos
- Add from camera or gallery, multi-select for end-of-day batch upload
- Photo notes/captions
- *Videos deferred to V2*

### Expenses
- Fields: name, amount, category (food, transport, attractions…), who paid
- Amounts in **yen + home currency** (auto-converted)
- Daily total, trip total, vs. daily budget target ("¥5,000 over today")
- Per-person paid totals (settle-up math is V2)

### Places
- Search with autocomplete (real place names + location)
- Manual entry fallback for places not in the list
- Small, clean map on the day card (maps allowed as long as they stay minimal)

### Adding — the key interaction
- One centered **"+"** button → bottom sheet with three big options: **Photo / Expense / Place**
- Design target: standing on a busy Tokyo street, adding lunch takes seconds

### Trip Recap (end of trip)
- Total days and spending; spending by category
- Route of all visited places on one map
- Photo highlights
- Flip-through page per day
- Revisit and share

## 5. V2 Roadmap

1. **In-app chat** — family conversation inside the trip, with the differentiator: **mention/link photos, expenses, and places** directly in chat ("look at this photo!" → taps through to it)
2. **Splitwise-style settle-up** — who owes whom
3. **Videos** in the journal
4. **Export** recap as album/photo book
5. Comments on individual items (possible middle ground before/alongside chat)

## 6. User Flows

**Create trip:** Open app → New Trip → name, dates, daily budget, currency → invite family from contacts → land on empty "Today" card.

**Join trip:** Tap invite link → see trip name and who's in → join → land on "Today."

**Add photo:** "+" → Photo → camera or multi-select from gallery → optional note → appears on today's card, attributed.

**Add expense:** "+" → Expense → name, amount (¥), category, who paid → daily total updates instantly.

**Add place:** "+" → Place → type, pick from autocomplete (or add manually) → appears in today's place list + mini map.

**End of trip:** Recap generates → family flips through, shares.

## 7. Design Principles

- **Apple-clean:** white space, big photos, soft cards, minimal chrome
- **Friendly over powerful:** no cluttered dashboards; maps only where they add beauty
- **Seconds, not minutes:** every add-action optimized for on-the-street speed
- **The journal is the hero:** the app should feel like a keepsake, not a spreadsheet
- **Language:** English (V1)

## 8. Wireframe Decisions (approved July 6, 2026)

All six core screens sketched and approved:

- **Today view:** trip header with family avatars (profile pictures, user-uploadable) · photo highlights grid ("+N" opens all) · spending card with budget progress bar (¥ + home currency) · places list with attribution · peek of previous day · single centered "+" button
- **Add sheet:** bottom sheet with three big rows — Photo / Expense / Place
- **Expense form:** amount first (keyboard opens immediately), live currency conversion, name field with recent-name suggestions, category icon chips (Food, Transit, Fun, Shopping, Other), "who paid" defaults to the person adding
- **Place search:** autocomplete on real places · "add as my own place" fallback always visible · "suggestions near you" chips (passive location use approved — suggestions only, no tracking)
- **Photo picker:** camera tile first · today's photos sorted first · numbered multi-select · one optional batch note, per-photo notes editable after upload
- **Day detail:** day note in serif/journal style · full photo grid · mini route map with timestamps · expense list with category icons and payers
- **Trip setup:** 2 steps — basics (name, dates, budget, currency; all editable later) → invite from contacts or share link (WhatsApp/SMS); skippable
- **Recap:** stats (days, travelers, photos, places, total spend) · route map across cities · spending by category bars · photo highlights · flip-through day pages · share button

## 9. Tech Decisions (July 6, 2026)

- **Platform:** PWA — React web app, installable from the browser on both Android (family) and iPhone (Ido). Chosen over React Native: free on all phones, no app store, one codebase, zero new frameworks.
- **Stack:** MERN — MongoDB, Express, React, Node (Ido's existing skills)
- **Database:** MongoDB Atlas (free tier)
- **Hosting:** Vercel (deployment is new territory — plan a guided first deploy early, not at the end)
- **Joining:** invite link (replaces contacts access, which PWAs can't do reliably on iPhone)
- **Auth:** email + password and Google sign-in, JWT-based (standard Express pattern)
- **Photo storage:** AWS S3 with presigned uploads; images resized on upload
- **Live updates:** polling/refresh for MVP; real-time (websockets) arrives with V2 chat

## 10. Open Questions (for next session)

- Day boundaries: Japan timezone for what counts as "today"?
- Offline behavior when there's no connection on the street?
- Photo storage limits / quality?
- Exchange rate: live rate or fixed rate per trip?

---

*Next step: turn the flows above into screen-by-screen wireframes, then talk tech stack (Node.js + React).*
