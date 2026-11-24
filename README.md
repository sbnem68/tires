# Tires4Today — Tire Match Intake System

City-aware tire-match intake, offer matching, lead routing, quoting and referral reconciliation.
Built in approval-gated checkpoints. **Current state: Checkpoint 0 (foundation only).**

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 (Create React App + CRACO), Tailwind CSS, React Router |
| Backend API | Python FastAPI |
| Database | PostgreSQL, SQLAlchemy 2 models, Alembic migrations, psycopg 3 driver |
| Hosting plan | Backend + PostgreSQL on **Railway**, frontend on **Vercel** (or both on Railway) |
| Notifications (Checkpoint 7) | Real email; code is structured so SMS can be added later |
| Sign-in | Drivers never sign in. Admin area (Checkpoint 5+) requires sign-in, allowlist `ADMIN_EMAILS` |

## Repository layout

```
backend/
  server.py            FastAPI app (/api/health, staging-only /api/system/architecture)
  db.py                engine + session (reads DATABASE_URL)
  models.py            all tables
  seed_data.py         location directory data (14 groups, 28 cities, 3 subareas)
  seed.py              idempotent seed  ->  python seed.py
  alembic/             migrations       ->  alembic upgrade head
  tests/               pytest acceptance tests
  railway.json         Railway start command + health check
  .env.example
frontend/
  src/App.js           Checkpoint 0 architecture review page (internal)
  vercel.json          Vercel build + SPA rewrites
  .env.example
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
                                └──< leads ──< lead_events  (audit / booking trail)
                                       ├──< lead_additional_cities (driver opt-in nearby cities)
                                       └──< quotes ── installs
```

Key rules enforced by the schema:

- **Planning counts live on `market_groups` only.** Cities have no count column, so a group total cannot be duplicated per city. No prospect rows are created from counts.
- **Prospect ≠ partner ≠ live offer.** `prospects`, `shops` and `shop_offers` are separate tables.
- **Offers have no city column**; the installation city is always `shops.city_id`.
- **Four separate locations on a lead:** `driver_postal_code`/`driver_location_text`, `requested_city_id`, `landing_city_id` + `attr_*`/`utm_*` (original attribution, written once), and `assigned_shop_id` (shop location).
- **A city cannot be `live` without `launch_approved_by`, `launch_approved_at` and `launched_at`.** Nothing launches automatically.
- **An offer cannot be `active` unless tires, mounting, balancing, disposal and taxes are all included.**
- **`is_demo`** on shops, offers, prospects, leads, quotes and installs keeps test data out of production results and metrics.
- **`leads.lead_origin`** (`tires4today` / `shop_organic`) keeps shop organic leads out of referral reconciliation.
- **`leads.idempotency_key`** (unique) prevents duplicate leads on refresh.
- Market groups are for prospecting/reporting only; serving another city requires an explicit `shop_service_cities` row.
- Money is stored as integer cents (CAD). Referral fee defaults: 4500 (set of 4), 2250 (pair).

## Run locally

```bash
# backend
cd backend
cp .env.example .env            # set DATABASE_URL
pip install -r requirements.txt
alembic upgrade head            # create schema
python seed.py                  # seed locations (safe to rerun)
uvicorn server:app --port 8001 --reload
pytest tests/test_checkpoint0.py

# frontend
cd frontend
cp .env.example .env            # set REACT_APP_BACKEND_URL
yarn install && yarn start
```

## Environment variables

See `backend/.env.example` and `frontend/.env.example`. Real values are never committed and are never returned by any API.

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | PostgreSQL connection string (separate DB per environment) |
| `APP_ENV` | backend | `staging` or `production` (defaults to production behaviour) |
| `CORS_ORIGINS` | backend | Allowed frontend origins |
| `REACT_APP_BACKEND_URL` | frontend | Public backend URL |

## Deployment plan (Railway + Vercel)

1. **Railway**: new project → add a PostgreSQL service → add a service from this repo with root directory `backend`.
   Set `DATABASE_URL` (reference the Postgres service), `APP_ENV`, `CORS_ORIGINS`.
   `railway.json` runs `alembic upgrade head && python seed.py` before starting the API and uses `/api/health` as the health check.
2. **Vercel**: import the repo with root directory `frontend`, set `REACT_APP_BACKEND_URL` to the Railway backend URL.
3. Create two Railway environments (**staging**, **production**), each with its own database. Demo data is only ever loaded into staging.
4. Custom domain `tires4today.ca` is connected at Checkpoint 13.

## Adding a city or market

Add it to `backend/seed_data.py` and run `python seed.py` (an admin screen follows in a later checkpoint). New cities start as `planned` and unlisted. No application code changes are required.
