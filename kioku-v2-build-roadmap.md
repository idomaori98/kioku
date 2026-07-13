# Kioku v2 — Build Roadmap

Continues the v1 numbering (M0–M6 shipped). Same rules: milestone-based, finish in order, **no deadline — free pace**. Each milestone ends with a working, deployed app — never a broken half-state.

Ordering logic: content must exist before discovery (publish first), discovery before copying makes sense to test, social layer last because everything before it works without it.

---

## M7 — Publish a trip

The foundation everything else stands on.

- "Publish" action on a trip (owner only); trips stay private by default
- "Publish everything?" prompt → **Edit publication** screen: toggle individual photos/expenses off, shortcuts for "no photos" / "no expenses"
- Public trip page: read-only view for any signed-in non-member — days, places, route maps, notes, visible photos/expenses, trip stats
- Unpublish and re-edit publication anytime
- Make sure nothing private leaks on the public view (member emails, chat, balances, hidden items)
- **Done when:** you publish a real trip (the Japan trip is perfect test data), open it from a second account that isn't a member, and can't see anything you chose to hide

## M8 — Discovery: search + feed + likes

- Likes on published trips
- Search by destination with filters: budget range, trip length, trip type (family / couple / solo / friends) — trip type becomes a field on the trip
- Popular feed ranked by likes (simple ranking first; tweak later)
- Published-trip cards: cover photo, destination, length, budget ballpark, likes
- **Done when:** a second account finds the Japan trip via search *and* sees it in the feed, and likes it

## M9 — Copy trip

The differentiator. Worth the most design attention per screen.

- "Copy this trip" on any published trip
- Wizard: new dates → invite people (existing invite-link flow) → daily budget → route screen with the original's places/days, ready to reorder / remove / add
- Result is a normal private trip owned by the copier, fully editable
- Handle date-range mismatch (copying a 10-day trip into 7 days) gracefully
- Decide on attribution ("based on a trip by X") — open question from the brief
- **Done when:** a second account copies the Japan trip into new dates in a couple of minutes, edits the route, and it behaves like any normal trip

## M10 — Social layer

- Friends: request / accept / remove (mutual, no followers)
- Direct messages between friends (reuse trip-chat machinery; polling is fine to start)
- Comments on published trips
- Share a trip to a friend in-app
- Favorites: save/unsave published trips, favorites list
- Minimum safety: delete-own-comment, trip owner can delete comments on their trip, report + block
- **Done when:** two accounts befriend each other, DM, comment on a trip, share it, and save it to favorites

## M11 — New home screen + navigation

Redesign now that the app has two hats (my trips + the network). Done after the features exist so the design fits reality, not guesses.

- New home balancing **My Trips** and **Discover** without clutter (wireframe first — this is the big open UX question)
- Global navigation: search, friends, messages, notifications entry points
- In-app notifications: friend requests, comments, likes, DMs, "your trip was copied"
- Polish pass: empty states, loading, errors on all new screens
- **Done when:** a brand-new user with zero trips lands somewhere useful, and a v1 user finds their trips as fast as before

## M12 — Hardening + real-user dry run

- Privacy audit: try to reach private data from a non-member account every way you can think of
- Performance with more content: feed pagination, image loading, search speed
- Resolve remaining open questions from the brief (member consent on publish, moderation ownership)
- Dry run: a few real people outside the family sign up, browse, copy a trip, comment
- **Done when:** a stranger can sign up, find a trip, copy it, and start using it — with no explanation from you

---

## Rules of the build

1. **Deploy from day one.** Every milestone lives on the real URL.
2. **Ship ugly, then polish.** M11 is the polish pass; don't gold-plate M7–M10.
3. **Privacy bugs are release blockers.** A broken feature is fine; a leaked private photo is not.
4. **When a milestone drags, cut features inside it, not the milestone.** E.g., filters can slip from M8; search cannot.
5. **The Japan trip is your seed content.** Publish it first, test everything against it.

## Minimum viable network

M7–M9 alone (publish → discover → copy) is already the product's core promise. The social layer (M10) and redesign (M11) make it feel like a network, but if motivation or time dips, a publish-search-copy app is complete and useful on its own.
