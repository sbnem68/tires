# Replit preview

- Use **Start application** to run the React preview on port 5000 and FastAPI on port 8001.
- The frontend calls the same-origin `/api` path. The Replit React dev server proxies it to FastAPI;
  no public backend URL or `REACT_APP_BACKEND_URL` is needed for this preview.
- The workflow sets `APP_ENV=staging` and disables indexing. It does not run migrations or seed data.
- The backend uses the Replit development database supplied through `DATABASE_URL`. Keep all
  connection strings in Replit's environment; never print them or commit them.
- The approved preview seed is `cd backend && python seed.py --review-cities-only`. It adds only
  Ottawa, Toronto, and Hamilton as city records, plus the minimum Ontario and market-group parent
  rows required by the schema. Parent planning-count fields are zero placeholders; no other cities,
  subareas, business records, customer data, or actual planning counts are added. The full-directory
  seed (`python seed.py`) is not used for this preview.
- No customer contact details are collected, no lead is created, and wizard answers are not sent to
  the server.
- This project is not deployed to Railway or Vercel from Replit.
