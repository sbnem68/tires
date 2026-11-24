#!/usr/bin/env bash
set -euo pipefail

PGDATA="$(mktemp -d /tmp/tires-preview-pg.XXXXXX)"
DB_PORT="${T4T_PREVIEW_DB_PORT:-55432}"
DB_NAME="tires_preview"
DB_USER="$(id -un)"
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
  if [[ -d "$PGDATA" ]]; then
    pg_ctl -D "$PGDATA" -m fast -w stop >/dev/null 2>&1 || true
    rm -rf "$PGDATA"
  fi
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if pg_isready -h 127.0.0.1 -p "$DB_PORT" >/dev/null 2>&1; then
  echo "Preview database port $DB_PORT is already in use. Set T4T_PREVIEW_DB_PORT to another free port."
  exit 1
fi

initdb --auth-local=trust --auth-host=trust -U "$DB_USER" -D "$PGDATA" >/dev/null
pg_ctl -D "$PGDATA" \
  -o "-h 127.0.0.1 -p $DB_PORT -c unix_socket_directories=/tmp" \
  -l "$PGDATA/postgres.log" -w start
createdb -h 127.0.0.1 -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"

export DATABASE_URL="postgresql+psycopg://${DB_USER}@127.0.0.1:${DB_PORT}/${DB_NAME}"
export APP_ENV=staging
export SITE_INDEXING_ENABLED=false
export CORS_ORIGINS="*"

cd backend
python3 -m alembic upgrade head
python3 seed.py
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 &
API_PID=$!
cd ..

(
  cd frontend
  HOST=0.0.0.0 PORT=5000 REACT_APP_BACKEND_URL= yarn start
) &
WEB_PID=$!

wait -n "$API_PID" "$WEB_PID"
