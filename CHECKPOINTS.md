# Checkpoints

One checkpoint is built at a time. Work on the next checkpoint starts only after Sam approves the current one.

> For the canonical build plan, checkpoint order, approval gates, and approved scope changes, read [ROADMAP.md](./ROADMAP.md) before starting any work.

| # | Scope | Status | Approved |
|---|---|---|---|
| 0 | Project setup and architecture | Approved with conditions | 2026-11-24 |
| 1 | City-aware landing page | Approved | 2026-11-24 |
| 2 | Tire Match wizard: city and need steps | Approved for development only | 2026-11-24 |
| 3 | Wheel-Size widget and manual tire-size entry | In progress; live widget blocked pending entitlement and permission | — |
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

- **Status:** Approved by Sam on 2026-11-24 for the work completed, subject to follow-up requirements
  (Sam's decision: "Checkpoint 2 is APPROVED, subject to the follow-up requirements below… Do not tag it as
  production-ready. Do not deploy it. Do not launch it publicly."). The final closeout is documented at
  `c05f0c7`; Sam subsequently authorized Checkpoint 3 on a separate branch. Not tagged, not merged to `main`,
  not deployed, not production-ready.
- **Approved date:** 2026-11-24 (no approval tag; a tag needs Sam's instruction)
- **Tested revision:** `b721fe4` (closeout follow-up); earlier closeout at `ce3bfb0e3e6bc2bdbb9b6bfe5b2339466f1d1b88`
- **Branch:** `checkpoint-2-wizard-steps-1-2-continuation`
- **Scope.** Wizard steps 1 and 2 only: city/location and need selection. The progress indicator shows
  steps 1 and 2 of 6. Answers are stored in the browser; the wizard makes no server writes.

**Deliverables**
- Step 1 "Which city are you in?": city dropdown from the public locations API (Ottawa, Toronto, Hamilton),
  optional postal code, optional travel radius (10 km, 25 km, 50 km, Flexible).
- Step 2 "What do you need today?": Buy 2 tires, Buy 4 tires, Winter tire changeover, Tire repair or
  inspection, I'm not sure — help me choose. Winter changeover asks whether new tires are also needed.
  Repair/inspection requires a short issue description. Each choice resolves to its next-step intent;
  no later screen is built.
- Strict city precedence: a valid listed URL city; otherwise saved wizard progress; otherwise nothing
  selected. The city chosen elsewhere on the site is never used. A URL city is applied once per browser
  session; if it replaces a different saved city the wizard returns to Step 1 and keeps other answers.
- No analytics: the PostHog snippet, session recording and `emergent-main.js` were removed from the page template.
- Back navigation, mobile-first layout, progress saved in the browser and restored after refresh.
- The original 30-day attribution record is never changed by the wizard; the selected city is stored separately.
- Driver-facing wording only ("Next: vehicle and tire size (coming soon).").

**Verification (2026-11-24, after both required fixes)**
- Frontend unit tests: 29 of 29. Backend Checkpoint 2 tests: 7 of 7. Production build compiles.
- Real-browser suite on the preview, mobile 390x844 and desktop 1440x900: 54 of 54 (the 18 required tests,
  precedence tests 3a–3e, analytics test 19, attribution tests A1–A3). Results in
  `test_reports/checkpoint2_browser.json`.
- Same suite against the production bundle served on its own: 40 of 40, with no injected scripts
  (`test_reports/checkpoint2_production_bundle.json`).
- No request to PostHog, `ap.emergent.sh` or `assets.emergent.sh`; no third-party write; no wizard input
  in any request.
- Screenshots: `screenshots/checkpoint-2-step-*.jpg`.
- No migration added or changed. Local preview database only: `0001`, `0002`, three-city seed.

**Closeout verification at `ce3bfb0` (2026-11-24)**
- Frontend unit tests: 30 of 30. Backend: 30 passed, 13 failed (the same 13 full-directory tests);
  Checkpoint 2 backend tests 7 of 7.
- Real-browser suite, 390x844 and 1440x900: 54 of 54 on the preview and 54 of 54 on the production build.
- Follow-up 1 done: the development-preview session recorder is switched off in `frontend/craco.config.js`
  (`ce3bfb0`). On the preview: no `recorder.js`, no `window.rrweb`.
- Network check with attribution parameters and typed input: no wizard input and no secret in any request.
- Report: `test_reports/cp2_review_evidence/closeout_ce3bfb0/CHECKPOINT2_CLOSEOUT_REPORT.md`. Earlier report:
  `test_reports/cp2_review_evidence/CHECKPOINT2_VERIFICATION_REPORT.md`.
- Preview: https://wizard-cp2-review--8ktg0g80.preview.emergentagent.com/tire-match (workspace preview; not
  permanent).

**Closeout follow-up at `b721fe4` (2026-11-24)**
- Tested revision: `b721fe4`. Change: dev-server `Referrer-Policy: no-referrer` and one guard test. No
  application code, seed or production setting changed; the production build file is identical.
- Frontend unit tests: 31 of 31. Browser suite on the preview, both viewports: 54 of 54.
- Referer check with synthetic values, before and after: requests carrying attribution in Referer went from
  17–18 to 0 across application, overlay and preview-host traffic; attribution still saves and survives
  navigation; recorder off; no wizard input sent; preview and overlay health checks return 200.
  Independent confirmation by the testing agent: `test_reports/iteration_4.json`.
- Backend baseline: the same 13 tests fail with identical errors at `checkpoint-1-approved` on the same
  three-city database, and passed on the full seed at the Checkpoint 0 and 1 reviews
  (`test_reports/iteration_1.json`, `iteration_2.json`). Backend at `b721fe4`: 30 passed, 13 failed.
- Evidence: `test_reports/cp2_review_evidence/closeout_referrer/`; report sections 6–8 of
  `test_reports/cp2_review_evidence/closeout_ce3bfb0/CHECKPOINT2_CLOSEOUT_REPORT.md`.
- Sam authorized Checkpoint 3 after this closeout. The authorization is for development only.

**Known limitations**
- The approved Checkpoint 2 revision stops before vehicle/tire-size entry; that work is tracked separately below.
- No contact information is collected; no lead or request is created; no wizard data is sent to the server.
- In a development preview only: the development server's error overlay (kept on at Sam's instruction,
  recorder off) posts a same-origin status message containing the page path, and the preview host adds a
  Cloudflare beacon, a challenge exchange with an encoded body, and `cf_clearance` / `__cf_bm` cookies. Since
  `b721fe4` the dev server sends `Referrer-Policy: no-referrer`, and no request from the page, the overlay or
  the preview host carries attribution values in a Referer header. The Cloudflare items themselves are
  outside repository control. None of this is in the production bundle.
- On the three-city seed, `test_architecture_endpoint_is_hidden_in_production` stops at its directory-count
  line, so its hidden-in-production assertions are not exercised automatically. They were checked directly
  once at `b721fe4` (staging 200 with no database address; production 404).
- Browser "network" evidence is a rendering of the headless test browser's request log, not a DevTools panel.
- `.emergent/` holds Emergent workspace settings committed automatically by the workspace (for example
  `ca726a1`); they are not application files.
- Fonts are loaded from Google Fonts (font files only).
- Thirteen Checkpoint 0/1 backend tests assert the full 28-city directory and fail against the approved
  three-city preview seed. This is expected; they were not changed and the full seed was not run. The
  three-city preview is not production-ready: before public launch restore the full seed or split the
  suites into full-directory integrity tests and three-city preview tests (see README).
- With the three-city seed there are no Toronto subareas, so subarea search finds nothing in this preview.
- The Replit development database is untouched and unverified.
- Not deployed to Railway or Vercel.

## Checkpoint 3 — Vehicle and tire size

- **Branch:** `checkpoint-3-vehicle-tire-size`, based on `c05f0c7`.
- **Implemented:** Eligible need paths enter Step 3. Drivers can manually enter and save an editable tire size and optional vehicle details locally. Repair and changeover without new tires keep their approved paths. Nothing is submitted.
- **Verification:** 33 frontend tests passed and the frontend production bundle compiled. Manual browser acceptance passed at 390×844 and 1440×900 using the local bundle and read-only three-city API response snapshots. This is frontend evidence, not a rerun of the live backend suite.
- **Blocked:** Live Wheel-Size integration and automatic selection capture are not implemented or counted as verified. Confirm vendor entitlement, permitted preview usage and fitment data storage rights, or obtain approval for a revised lookup flow.
- **Held:** Checkpoint 4, tag, merge, deployment and launch.
