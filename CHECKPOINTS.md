# Checkpoints

One checkpoint is built at a time. Work on the next checkpoint starts only after Sam approves the current one.

| # | Scope | Status | Approved |
|---|---|---|---|
| 0 | Project setup and architecture | Approved with conditions | 2026-11-24 |
| 1 | City-aware landing page | Approved | 2026-11-24 |
| 2 | Tire Match wizard: city and need steps | Ready for review; not approved | — |
| 3 | Wheel-Size widget and manual tire-size entry | Not started | — |
| 4 | Preferences and lead intent | Not started | — |
| 5 | Shop and offer database, admin | Not started | — |
| 6 | Offer matching and display | Not started | — |
| 7 | Lead capture and operator alert | Not started | — |
| 8 | Lead routing and shop workflow | Not started | — |
| 9 | Quote card and booking | Not started | — |
| 10 | Install and referral reconciliation | Not started | — |
| 11 | Admin dashboard polish | Not started | — |
| 12 | Toronto multi-city test | Not started | — |
| 13 | WordPress embed and deployment | Not started | — |
| 14 | Final end-to-end test | Not started | — |

---

## Checkpoint 0 — Project setup and architecture

- **Status:** Approved with conditions
- **Approved date:** 2026-11-24
- **Git tag:** `checkpoint-0-approved`

**Scope.** Stack, repository, database schema, migrations, location seed, environment templates, README.

**Deliverables**
- React + Tailwind frontend, FastAPI backend, PostgreSQL with Alembic migrations.
- Migration `0001`: 15 tables — shops, shop_offers, leads, quotes, installs, market_groups, cities,
  location_subareas, prospects, expansion_overrides, interest_registrations, province_configs,
  shop_service_cities, lead_additional_cities, lead_events.
- Idempotent seed: 14 market groups, 28 cities, 3 Toronto subareas, planning counts totalling 348
  (group-level metadata only; no prospect rows).
- `/api/health`, staging-only `/api/system/architecture`, internal review page.
- 21 automated tests.

**Conditions from approval (all applied in Checkpoint 1)**
- Tax components are unverified placeholders: `tax_components_verified = false`; no public tax breakdown.
- Gatineau defaults to French with English available; no public Gatineau pages until launch approval.
- Gatineau and Kingston stay flagged as below the five-partner threshold. Threshold not lowered, no
  combined-market rule, no expansion override.
- `lead_events` records timestamp, actor, event type and optional notes.
- Ottawa is `onboarding`, not live. ABC Auto remains a demo shop (not created yet).

**Known limitations**
- Not deployed to Railway or Vercel (on hold by instruction).
- Staging and preview share one database. A separate production database is mandatory before Checkpoint 13.

---

## Checkpoint 1 — City-aware landing page

- **Status:** Approved
- **Approved date:** 2026-11-24
- **Branch:** `checkpoint-1-city-landing` (merged to `main`)
- **Git tag:** `checkpoint-1-approved`

**Scope.** Homepage, `/ottawa`, `/toronto`, `/hamilton`, city selector, hero, How It Works, FAQ, footer,
URL parameter capture and preservation, mobile-first layout, per-page SEO controls. No wizard, widget,
offers, lead capture, admin, notifications, quotes, bookings or reconciliation.

**Deliverables**
- Migration `0002`: `province_configs.tax_components_verified`, `cities.seo_indexable`, `lead_events.notes`;
  Ottawa set to `onboarding`; Ottawa, Toronto and Hamilton publicly listed (the other 25 cities stay unlisted).
- Public read-only API: `/api/public/config`, `/api/public/locations`, `/api/public/locations/{slug}`.
- Pages: `/`, `/ottawa`, `/toronto`, `/hamilton`, `/tire-match` (notice only), not-found page for unlisted cities.
- Four city states: live (approved hero copy + CTA), planned and onboarding ("Coming soon — register interest"),
  paused. Staging-only review bar previews each state without changing the database.
- Searchable city selector grouped into "Available locations" and "Coming soon — register interest".
  Toronto subareas are searchable and resolve to Toronto.
- Attribution capture for all 11 parameters, preserved across navigation and city changes.
- Per-page robots and canonical tags. Everything is `noindex` today.
- 15 new automated tests (36 total).

**Known limitations**
- No city is live, so the approved hero copy is visible only through the staging preview
  (`?preview_state=live`). Customers would currently see "Coming soon" on all three cities.
- "Register interest" explains its purpose but does not collect anything yet, because this checkpoint
  must collect no customer data. The form needs a decision on which checkpoint it belongs to.
- Attribution is stored in the browser only; it is submitted with the lead at Checkpoint 7.
- Robots tags are set in the browser. Server-rendered tags or prerendering should be decided before launch.
- No privacy or terms pages yet (no reviewed wording exists).

**Decisions recorded at approval**
- The 30-day lock on original attribution is approved. Later touches never overwrite the original.
- "Same-Week Booking" stays visible only in the live state.
- The real Register Interest form is built in Checkpoint 7 (minimum data, explicit consent, never a lead,
  never notifies a shop, never counts toward bookings, installs or expansion thresholds).
- Draft copy (homepage hero, coming-soon heading, paused message, How It Works, FAQ, "What we'll ask you",
  `/tire-match` notice) approved as drafted.
- No Privacy or Terms links until Sam supplies or approves reviewed wording.

**Next checkpoint.** Checkpoint 2 — Tire Match wizard, steps 1 and 2 (city/location and need selection),
only after Checkpoint 1 is approved.

---

## Checkpoint 2 — Tire Match wizard: city and need steps

- **Status:** Ready for review; not approved
- **Approval date:** —
- **Branch:** `checkpoint-2-tire-match-wizard`
- **Git tag:** None; create only after approval

**Scope.** Step 1 city/location and Step 2 need selection only. No vehicle/tire-size form, offers,
lead capture, admin tools, notifications, quotes, bookings or reconciliation.

**Deliverables**
- Database-driven city selector limited to the three listed cities; URL city preselection and manual changes.
- Optional postal code and travel radius choices.
- Five need choices, winter-tire follow-up, repair description, and next-step preview only.
- Progress indicator, back navigation, mobile-first layout, and browser-local progress storage.
- The original attribution remains separate from the selected city and locked for 30 days.
- No customer contact details, lead creation or server writes.
- 33 frontend tests and 36 backend acceptance tests pass.
- Supporting migration `0003` repairs approved Checkpoint 1 city defaults when seed data already exists.

**Known limitations**
- Steps 3–6 are not built. The wizard shows the appropriate next-step label and stops there.
- No production deployment, external database, customer data or live booking flow.
- No Checkpoint 2 approval date or tag yet.

**Next checkpoint.** Checkpoint 3 remains blocked until Sam approves Checkpoint 2.
