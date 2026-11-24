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
  per-page SEO; migration 0002; public read-only API. Awaiting approval.

## Backlog (P0 next)
- Checkpoint 2: wizard steps 1-2 (after approval of Checkpoint 1).
- Then Checkpoints 3–14 in order, each gated by approval.
