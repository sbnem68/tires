# Tires4Today — Tire Match Intake System

## Project purpose

Tires4Today matches drivers who need tires with local partner shops and sends them one clear
**all-in installed price** (tires, mounting, balancing, disposal, and taxes). This repository contains
the public city landing pages, the Tire Match intake (in progress), and the operator tooling for
routing leads, quoting, booking and referral reconciliation.

The system is built in approval-gated checkpoints. See [CHECKPOINTS.md](./CHECKPOINTS.md).

## Checkpoint status

| # | Scope | Status |
|---|---|---|
| 0 | Project setup and architecture | Approved (with conditions) |
| 1 | City-aware landing page | Approved |
| 2 | Tire Match wizard: city and need steps | Built — awaiting approval |
| 3–14 | Tire-size entry, offers, leads, routing, quotes, installs, admin, multi-city, deployment | Not started |

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 (Create React App + CRACO), Tailwind CSS, shadcn/ui, React Router |
| Backend API | Python 3.11, FastAPI |
| Database | PostgreSQL, SQLAlchemy 2 models, Alembic migrations, psycopg 3 driver |
| Hosting plan | Backend + PostgreSQL on Railway, frontend on Vercel (not deployed yet) |
| Notifications (Checkpoint 7) | Email first; structured so SMS can be added later |
| Sign-in | Drivers never sign in. The admin area (Checkpoint 5+) will require sign-in |

## Project structure

```
backend/
  server.py              FastAPI app: /api/health, staging-only /api/system/architecture
  public_api.py          Public read-only API: /api/public/config, /api/public/locations[/{slug}]
  settings.py            Environment-driven settings (APP_ENV, SITE_INDEXING_ENABLED)
  db.py                  Engine + session (reads DATABASE_URL)
  models.py              All tables
  seed_data.py           Location directory data (14 groups, 28 cities, 3 subareas)
  seed.py                Idempotent seed
  alembic/versions/      Versioned migrations (never edited after approval; add a new one instead)
  tests/                 pytest acceptance tests, one file per checkpoint
  railway.json           Railway start command + health check
  .env.example
frontend/
  src/App.js             Routes
  src/pages/             HomePage, CityPage, TireMatchPage, NotFoundPage, ArchitectureReviewPage
  src/components/site/   PageShell (header/footer), CityHero, CitySelector, Sections, Seo, ReviewBar
  src/components/ui/     shadcn/ui primitives
  src/context/           SiteContext (locations, city state, staging preview)
  src/lib/attribution.js URL parameter capture and preservation
  vercel.json            Vercel build + SPA rewrites
  .env.example
CHECKPOINTS.md           Checkpoint log
design_guidelines.md     Visual design system
```

## Local setup

Requirements: Python 3.11+, Node 18+, Yarn, a PostgreSQL database.

```bash
git clone https://github.com/sbnem68/tires.git && cd tires

# backend
cd backend
cp .env.example .env              # then set DATABASE_URL
pip install -r requirements.txt
alembic upgrade head              # create / update the schema
python seed.py                    # seed the location directory (safe to rerun)
uvicorn server:app --port 8001 --reload

# frontend (second terminal)
cd frontend
cp .env.example .env              # REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start                        # http://localhost:3000
```

## Environment variables

Templates only are committed (`backend/.env.example`, `frontend/.env.example`). Real `.env` files are
git-ignored. No secret is ever returned by an API.

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | PostgreSQL connection string. Use a separate database per environment |
| `APP_ENV` | backend | `staging` or `production`. Anything else behaves as production |
| `SITE_INDEXING_ENABLED` | backend | Site-wide search indexing switch. Keep `false` until launch is approved |
| `CORS_ORIGINS` | backend | Comma-separated allowed frontend origins |
| `REACT_APP_BACKEND_URL` | frontend | Public backend URL (no trailing slash) |

## Database setup

Create an empty PostgreSQL database and put its connection string in `DATABASE_URL`
(`postgres://`, `postgresql://` and `postgresql+psycopg://` are all accepted).

### Migration commands

```bash
cd backend
alembic upgrade head                 # apply all migrations
alembic current                      # show the applied revision
alembic downgrade -1                 # roll back one migration
alembic revision --autogenerate -m "describe change"   # create a new migration after editing models.py
alembic check                        # verify models and database match
```

Migration history: `0001` initial schema → `0002` Checkpoint 1 flags and review-city listing.
Approved migrations are never edited or deleted; changes are made in a new migration.

### Seed commands

```bash
cd backend
python seed.py
```

The seed is idempotent. It refreshes planning metadata (names, tiers, group planning counts) and never
touches operational state (launch status, listing, approvals). It creates no shops, offers, prospects,
leads or installs.

### Test commands

```bash
cd backend
python -m pytest tests               # all checkpoints
python -m pytest tests/test_checkpoint1.py
```

Tests run against `DATABASE_URL`. Tests that write do so inside a transaction that is rolled back.
Checkpoint 2 frontend tests:

```bash
cd frontend
CI=true yarn test --watchAll=false --runInBand
```

## Data model

```
province_configs 1─┐
                   ├─< cities >─┐ 1
market_groups   1──┘            ├──< location_subareas
                                ├──< prospects            (shops we may call)
                                ├──< shops ──< shop_offers (partners; offer city = shop city)
                                │      └──< shop_service_cities >── cities (explicit extra service area)
                                ├──< interest_registrations ("coming soon", never a lead)
                                ├──< expansion_overrides    (Sam-approved gate exceptions)
                                └──< leads ──< lead_events  (timestamp, actor, event type, notes)
                                       ├──< lead_additional_cities (driver opt-in nearby cities)
                                       └──< quotes ── installs
```

Rules enforced by the schema:

- Planning prospect counts live on `market_groups` only; cities have no count column. No prospect rows are created from counts.
- Prospects, partner shops and offers are separate tables.
- Offers have no city column; the installation city is always the shop's city.
- A lead keeps four separate locations: driver location, requested city, landing-page city and original attribution, and the assigned shop.
- A city cannot be `live` without a recorded approval. Nothing launches automatically.
- An offer cannot be `active` unless tires, mounting, balancing, disposal and taxes are all included.
- `is_demo` flags keep demo shops, offers, leads, quotes and installs out of production results, metrics, reconciliation and expansion thresholds.
- `leads.lead_origin` keeps shop organic leads out of referral reconciliation.
- Sharing a market group grants no service relationship; serving another city requires an explicit `shop_service_cities` row.
- Tax components are unverified placeholders (`tax_components_verified = false`) and are never shown publicly.

## Public pages (Checkpoint 1)

| Path | Purpose |
|---|---|
| `/` | Homepage with city selector |
| `/ottawa`, `/toronto`, `/hamilton` | City pages. One domain, one path per city |
| `/tire-match` | Checkpoint 2 wizard: city/location and need selection only |
| `/internal/architecture` | Staging-only schema and seed review |

**City states.** `live` shows the approved hero and CTA. `planned` and `onboarding` show
"Coming soon — register interest" and never imply availability. `paused` shows a paused notice.
Only cities with `public_listing_enabled` have a page; all others return "not found".

**Staging review tools.** When `APP_ENV=staging`, a dark bar at the top lets a reviewer preview any
state without changing the database (or use `?preview_state=live|planned|onboarding|paused|actual`)
and inspect captured attribution. The API disables these tools in production.

**Attribution.** `city, source, campaign, shop, package, price, utm_source, utm_medium, utm_campaign,
referrer_url, landing_url` are captured on first landing into local storage and never overwritten by
navigation or by changing city. The selected city is stored separately. Internal links also keep the
query string.

## Tire Match wizard (Checkpoint 2)

The `/tire-match` page contains the first two steps only: city/location, followed by tire need. The city
choices come from the public, database-backed locations API. Postal code and travel radius are optional.
Need selection supports two tires, four tires, winter changeover, repair/inspection, and guidance. The
winter and repair follow-up questions appear only when relevant.

The wizard shows progress as steps 1 and 2 of 6 and saves partial answers in the browser. This checkpoint
does not collect contact information, create a lead, submit a request, or write to the server. Original
attribution stays in the existing 30-day store; the driver's selected city and wizard progress are stored
separately. Later wizard steps are not included.

**SEO.** Every page is `noindex` today. A city page becomes indexable only when
`SITE_INDEXING_ENABLED=true` **and** `cities.seo_indexable` **and** the city is `live`.

## Deployment notes

Not deployed to Railway or Vercel yet (on hold by instruction).

1. **Railway**: add a PostgreSQL service and a service from this repo with root directory `backend`.
   Set `DATABASE_URL`, `APP_ENV`, `SITE_INDEXING_ENABLED`, `CORS_ORIGINS`. `railway.json` runs
   `alembic upgrade head && python seed.py` before starting the API and uses `/api/health` as health check.
2. **Vercel**: import the repo with root directory `frontend` and set `REACT_APP_BACKEND_URL`.
3. Staging and production must use **separate databases**. A separate production database is mandatory
   before Checkpoint 13. Demo data is only ever loaded into staging.
4. Before Checkpoint 13: Sam verifies tax settings and marks them verified (admin task to be built).

## Adding a city or market

Add it to `backend/seed_data.py` and run `python seed.py`. New cities start as `planned` and unlisted.
No application code changes are required.
