# Marketplace — build spec

Reference designs (layout, copy and motion values only; custom template format, do not copy markup):
- /design-ref/marketplace/MarketplaceSoon.dc.html
- /design-ref/marketplace/Marketplace.dc.html

Conventions: inline style objects only, no Tailwind, tokens from atoms.jsx, Geist font. Top bar matches Templates, with a "Marketplace" pill (bag icon) between Explore and Inbox. Product images go in /public/marketplace/.

## Flag and routes
`marketplaceUnlocked` (default false).
- `/marketplace`: shows `<MarketplaceComingSoon />` when locked, `<MarketplaceHome />` when unlocked
- `/marketplace/listing/:id`: listing detail
- `/marketplace/checkout`: checkout
- `/marketplace/list`: list your gear
- `/marketplace/fleet/:id`: fleet booking
- `/marketplace/dashboard`: lister dashboard (anyone with at least one listing)

## 1. MarketplaceComingSoon
- Background #F6F5F3. 12 product photos in white 190px rounded tiles orbit the centre (same orbit maths as ExploreComingSoon; speed default 0.3).
- Frosted card:
  - "COMING SOON · LAUNCH DATE TBD" pill with an amber dot (#D97706)
  - "Marketplace" heading, 46px/800
  - body copy: "Rent, buy and list production gear, vehicles and digital assets, from creators and trusted rental houses, all inside Nia."
  - buttons: "Join the waitlist" (black), "List your gear early" (outline), "Preview marketplace →" (text)

## 2. MarketplaceHome
- "Marketplace" heading + Rent/Buy segmented switch.
- Search with a location suffix.
- Compact filter bar (no row of category pills):
  - `Category: All ▾` opens a 2-column menu of categories (All, Cameras, Lenses, Drones, Lighting & Grip, Audio, Gimbals & Support, Computing & Editing, XR & Wearables, Wardrobe & Set, Vehicles & Fleet, Digital products), with a checkmark on the active one.
  - `Condition: Any ▾`.
  - `Filters` button: delivery available, verified listers, price range.
  - Result line on the right, e.g. "14 items · For rent near Boston".
- Sub-nav under the top bar: Browse | My rentals | Lister dashboard.
- One line of brand names (text only, no logos). **No partner cards on this page.**
- **Latest gear (drifting masonry):** 5 columns that shift with cursor Y. Cards: image tile (#F5F5F4, contain or cover), condition pill, name, price.
  - Rent mode shows "$X/day"; Buy mode shows the buy estimate.
  - Hover: lift 6px.
- **Logistics & fleet (tilt cards):** Olto, Olto fleet (5+), Tesla Model Y, Ford E-Transit Custom. The card tilts up to 10° toward the cursor with a light sheen.
- **Digital products (tilt cards):** mesh-gradient tiles reusing the Templates palettes, with icon, type pill, name, price and "Instant download · licence included".

## 3. Listing detail (focus viewer)
- Thumbnail rail (76px) + main viewer. Hover or click a thumbnail to crossfade (0.8s); the viewer drifts slightly with the cursor.
- Right panel:
  - title and spec line
  - provider card (Rule Boston · Rental partner)
  - Rent/Buy option cards
  - pickup/return dates
  - price preview with deposit hold
  - "Continue to checkout"
  - trust pills

## 4. Checkout
1. **Delivery:** "Collect from {Partner name}", [pickup address], or local delivery. The partner name also shows in the summary.
2. **Protection:** a toggle, 10% of the rental, $100 excess.
3. **Payment:**
   - Pay now: Card, Apple Pay, Google Pay, PayPal, Bank transfer (ACH / Instant EFT)
   - Pay over time: Afterpay (show 4 × amount), Klarna, Affirm, PayPal Pay Later
4. **Rental terms (summary):** 8 rules plus an "I agree" checkbox. The Pay button stays disabled until it's ticked.

Summary panel: rental, protection, Nia service fee, processing, total, refundable deposit hold.

## Fee logic (put in one util)
- Service fee: 5% for creator listings, 3% for partner listings (rental subtotal only).
- Protection: 10% of the rental subtotal (optional).
- Processing: (rental + protection + fee) × 2.9% + $0.30, passed through. Make the rate configurable per method.
- Lister receives 100% of their listed price.
- Fleet rate: $45/unit/day, or $39 from 5 units.
- Round to cents at each line.

## 5. List your gear
- Photo grid with an "Add photos" tile, 8 fields, and Rent/Sell and delivery toggles.
- Dark earnings card: a days-per-month slider × day rate, the "you keep 100%" breakdown and "Publish listing".

## 6. Fleet booking
Hero image, unit stepper (1–20), dates, delivery location, live price breakdown at the 3% partner rate, and "Request fleet booking".

## 7. Lister dashboard (the "Uber Driver" view)
Reference: /design-ref/marketplace/MarketplaceHost.dc.html.

- Header: "Lister dashboard", an **Accepting bookings** on/off switch (off shows an amber "You're paused" banner and stops new requests), a period picker and "+ New listing".
- **Earnings card (dark):**
  - earnings this month with change vs last month
  - next payout amount, date and bank (last 4 digits)
  - 8-week bar chart; hover shows the week's value
- **KPI tiles:** Bookings (rented days), Utilisation, Rating, Pending earnings.
- **Requests:** cards showing the item photo, dates, handover type, renter (initials, rating, rental count, ID verified), "You earn $X", a response countdown, and Decline / Accept.
  - Accepting moves the card to Upcoming under "Accepted · awaiting handover".
  - Requests expire after the response window.
- **Upcoming:** grouped by day (Today, Tomorrow, date). Each row shows time, a type tag (Pickup / Delivery / Return) and item · renter · location.
- **Your listings:** table with item, price, views, booked days, utilisation bar, earned, and an Active/Paused toggle.
- **Analytics:**
  - funnel: views → requests → confirmed bookings
  - acceptance rate, average response time, repeat renters, top category
- Footnote: "You keep 100% of your listed price."

Data: `request { id, listingId, renterId, start, end, handover, payout, expiresAt, status: 'pending'|'accepted'|'declined'|'expired' }`. Earnings and payouts come from completed bookings.

## Data (mock first, Supabase later)
- `listing { id, title, brand, category, images[], condition, rentPerDay?, buyPrice?, kind: 'gear'|'fleet'|'digital', providerId, location }`
- `provider { id, name, type: 'creator'|'partner', city }`
- `booking { listingId, start, end, qty, protection, paymentMethod, fees }`

## Motion and accessibility
- prefers-reduced-motion: no orbit, drift or tilt.
- Throttle cursor handlers with rAF.
- Real buttons and links with focus rings; aria-pressed on toggles.
- At phone width, layouts stack.
- Payments: build the UI only. Wire the Stripe / payment provider later.
