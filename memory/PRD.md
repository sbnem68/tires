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

## Backlog (P0 next)
- Checkpoint 1: city-aware landing page (after approval of Checkpoint 0).
- Then Checkpoints 2–14 in order, each gated by approval.
