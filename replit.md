# Replit run instructions

- Use the **Project** run button to start the frontend on port 5000 and the FastAPI preview on port 8000.
- In development, frontend `/api` requests are proxied to the local FastAPI process; no public backend URL is needed.
- The backend reads the existing PostgreSQL `DATABASE_URL` from Replit Secrets. Never put connection strings in Git or chat.
- The preview does not run migrations or seed data. It uses the existing schema and location records only.
- Checkpoint 2 collects no contact details, creates no leads, and sends no wizard data to the server.
- This project is not deployed to Railway or Vercel from Replit.

For local setup, versioned migrations, seeding, and production API configuration, see the README.
