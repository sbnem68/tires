#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PID=""
WEB_PID=""

cleanup() {
  if [[ -n "$WEB_PID" ]]; then
    kill "$WEB_PID" 2>/dev/null || true
    wait "$WEB_PID" 2>/dev/null || true
  fi
  if [[ -n "$API_PID" ]]; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "The Replit development database is not configured." >&2
  exit 1
fi

# Preview only. Migrations and the restricted location seed are run separately,
# with explicit approval; this start script never changes database data.
export APP_ENV=staging
export SITE_INDEXING_ENABLED=false
export CORS_ORIGINS="${CORS_ORIGINS:-*}"
unset REACT_APP_BACKEND_URL

(
  cd "$ROOT_DIR/backend"
  python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
) &
API_PID=$!

(
  cd "$ROOT_DIR/frontend"
  HOST=0.0.0.0 PORT=5000 BROWSER=none yarn start
) &
WEB_PID=$!

wait -n "$API_PID" "$WEB_PID"
