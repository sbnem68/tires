# Tires4Today — PRD (working copy)

## Problem statement
Tire Match intake system for Tires4Today: city-aware landing pages, intake wizard, offer matching,
lead routing to partner shops, quotes/booking, install + referral reconciliation, admin dashboard,
multi-city location directory with launch controls. Built in 15 approval-gated checkpoints (0–14)
plus Addendum A–J. Full brief: see conversation; checkpoint tracker: /app/plan.md.

## User choices
PostgreSQL; Railway/Vercel hosting; real email notifications (SMS later); no driver login;
admin sign-in later, admin email sbnem68@gmail.com.

## Architecture
React + Tailwind / FastAPI / PostgreSQL (SQLAlchemy 2, Alembic, psycopg 3). See /app/README.md.

## Implemented
- Checkpoint 0 (foundation): schema + migration 0001, idempotent location seed, health endpoint,
  staging-only architecture review page, tests, README, env templates, deploy configs.

- Checkpoint 1 (city-aware landing): pages /, /ottawa, /toronto, /hamilton; city states; attribution capture;
  per-page SEO; migration 0002; public read-only API. Approved 2026-11-24.

- Checkpoint 2 (Tire Match wizard, steps 1-2): city/location and need selection, progress indicator,
  back navigation, browser-saved progress, URL city precedence, attribution lock preserved. No contact
  fields, no lead, no server write, no analytics. Strict city precedence (URL, saved progress, none).
  Conditionally approved 2026-11-24; both required fixes done; awaiting approval of the updated report.

## Backlog (P0 next)
- Checkpoint 3 (Wheel-Size widget and manual tire-size entry) only after Sam approves Checkpoint 2.
- Then Checkpoints 4–14 in order, each gated by approval. Canonical plan: /app/ROADMAP.md.
