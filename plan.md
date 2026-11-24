# Tires4Today Tire Match Intake System — Plan

Source of truth: the user's build brief (Checkpoints 0–14) + Addendum A–J.
Rule: one checkpoint at a time; STOP for approval after each; nothing outside the current checkpoint.

## Decisions (from user)
- Database: PostgreSQL (DATABASE_URL secret provided; SQLAlchemy 2 + Alembic + psycopg 3)
- Hosting: Railway (backend + Postgres) / Vercel (frontend). User connects own accounts.
- Notifications (CP7): real email; keep SMS pluggable for later.
- Drivers never sign in. Admin sign-in required when admin UI arrives (CP5). Admin email: sbnem68@gmail.com
- ABC Auto / Toronto Tire Centre are demo shops (is_demo), staging only.
- Assumption to confirm: Gatineau default locale fr-CA with en-CA supported.

## Status
- [x] CP0 Project setup & architecture — APPROVED with conditions (tag checkpoint-0-approved)
- [x] CP1 BUILT, awaiting approval (branch checkpoint-1-city-landing) — City-aware landing page (/ottawa, /toronto, /hamilton; URL param capture; planned/onboarding/live/paused states; planned = noindex, no availability implied)
- [ ] CP2 Wizard steps 1–2 (city/postal/radius; need selection; progress, back, local storage)
- [ ] CP3 Wheel-Size widget + manual tire size entry
- [ ] CP4 Preferences (priority, budget, urgency)
- [ ] CP5 Shop & offer database + admin CRUD (admin sign-in; ABC Auto demo + 4 offers; prospects vs partners vs demo)
- [ ] CP6 Offer matching & display (city, subareas, opt-in nearby cities; no-match state; shop link first)
- [ ] CP7 Lead capture, attribution, driver confirmation + operator alert (email), admin lead view, idempotency
- [ ] CP8 Lead routing & shop workflow (statuses; no booking before shop confirmation)
- [ ] CP9 Quote card, 72h expiry, acceptance, booking trail
- [ ] CP10 Installs, referral fees ($45 / $22.50), Friday reconciliation, weekly statement
- [ ] CP11 Admin dashboard polish (filters, search, mobile) + location management view + expansion gate
- [ ] CP12 Toronto multi-city test
- [ ] CP13 Production deployment + WordPress iframe/shortcode
- [ ] CP14 Final end-to-end test

## CP0 delivered
- 15 tables via Alembic migration 0001 (upgrade + downgrade verified)
- Idempotent seed: 14 groups / 28 cities / 3 subareas / 348 planning count (metadata only, no prospect rows)
- /api/health, staging-only /api/system/architecture, internal review page
- 21 pytest tests passing (backend/tests/test_checkpoint0.py)
- README, .env.example files, railway.json, vercel.json

## CP0 known limitations
- Not deployed to Railway/Vercel yet (needs user's accounts); staging = preview URL + user's PostgreSQL.
- DATABASE_URL is currently shared by preview and live slots; a separate production DB is needed before CP13.
- index.html has a global noindex meta; must become per-page at CP1 launch approval.

## CP1 delivered
- Migration 0002 (tax_components_verified, cities.seo_indexable, lead_events.notes, Ottawa onboarding, 3 review cities listed)
- Public read-only API, pages /, /ottawa, /toronto, /hamilton, /tire-match notice, not-found
- Staging review bar (state preview + attribution inspector), attribution lib, per-page SEO
- 36 pytest tests; testing agent iteration_2 all passed
- GitHub: sbnem68/tires — main = approved work only; checkpoint branches for review. Push with GITHUB_TOKEN env (never store in remote URL).

## Open decisions for Sam
- Which checkpoint builds the real interest-registration form (CP1 collects no customer data)
- Do NOT deploy to Railway/Vercel until told. Separate production DB before CP13. Tax verification admin task before CP13.
- Expansion gate text when built: "Below expansion threshold — prospect research required." (Gatineau, Kingston)
