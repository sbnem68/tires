# Tires4Today — Tire Match Intake System

> For the canonical build plan, checkpoint order, approval gates, and approved scope changes, read [ROADMAP.md](./ROADMAP.md) before starting any work.

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
| 2 | Tire Match wizard: city and need steps | Built and verified — awaiting approval |
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

### Emergent workspace preview

The Emergent workspace cannot reach the Replit database. It uses a local PostgreSQL (loopback only)
for the preview, with `DATABASE_URL`, `APP_ENV=staging` and `SITE_INDEXING_ENABLED=false` set in the
git-ignored `backend/.env`. The same two commands apply: `python -m alembic upgrade head`, then
`python seed.py --review-cities-only`. Install only the pinned API/database packages if the full
`requirements.txt` fails to resolve.

### Replit preview

The Replit preview uses the Replit **development** PostgreSQL database and a same-origin `/api`
proxy. No public backend URL is needed. After confirming the target is the development database:

```bash
cd backend
python -m alembic upgrade head
python seed.py --review-cities-only
cd ..
bash scripts/start-preview.sh
```

On the current branch, `alembic upgrade head` applies `0001_initial_schema.py` followed by
`0002_checkpoint1_listing_and_flags.py`. The restricted seed adds only Ottawa, Toronto, and Hamilton
as city records, plus required non-public province and market-group parent rows. The required
parent planning-count fields are zero placeholders. It does not add other cities, subareas, shops,
offers, prospects, leads, installs, customer data, or actual planning counts. Do not use the full
`python seed.py` command for this preview.

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
| `REACT_APP_BACKEND_URL` | frontend | Optional backend override for a separately hosted frontend; omitted in the Replit preview |

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
python seed.py --review-cities-only   # Replit preview: only Ottawa, Toronto, Hamilton
python seed.py                        # Full directory seed; not approved for this preview
```

The full seed is idempotent and refreshes planning metadata; use it only when the full location
directory is explicitly approved. The restricted Replit preview seed preserves existing records and
adds only the three review cities and required zero-count parent rows.

### Test commands

```bash
cd backend
python -m pytest tests               # all checkpoints
python -m pytest tests/test_checkpoint1.py
```

Tests run against `DATABASE_URL`. Tests that write do so inside a transaction that is rolled back.
Run serially with `-n 0`. `test_checkpoint0.py` and `test_checkpoint1.py` assert the full 28-city
directory, so 13 of them fail against the three-city preview seed; the Checkpoint 2 files pass on either.

Checkpoint 2 frontend unit tests:

```bash
cd frontend
CI=true yarn test --watchAll=false --runInBand
```

Checkpoint 2 real-browser suite (mobile and desktop, read-only, needs Python `playwright` and Chromium):

```bash
T4T_BASE_URL=https://<preview-host> python3 tests/e2e/checkpoint2_browser.py --screenshots screenshots
```

It runs the 18 acceptance tests plus precedence and attribution tests, records every network request,
and writes `test_reports/checkpoint2_browser.json`.

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

City precedence: a valid listed city in the URL (`?city=ottawa`) wins and becomes the selected city;
otherwise saved progress is used; otherwise the city the driver last chose on the site; otherwise
nothing is selected and the driver must choose. A URL city is applied once per browser session, so a
manual change afterwards survives a refresh.

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
