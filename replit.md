# Replit run instructions

- Use the **Project** run button to start the frontend preview on port 5000.
- The frontend needs `REACT_APP_BACKEND_URL` set to the base URL of the existing FastAPI service
  (without a trailing slash or `/api`) to load the database-backed city list.
- The backend requires the existing PostgreSQL `DATABASE_URL`. Keep connection strings out of Git and
  configure them only through the environment supported by the database provider.
- No sample city data is substituted when the backend is unavailable. The wizard shows a retry message.
- This project is not deployed to Railway or Vercel from Replit.

For local backend setup, migrations, seeding, and frontend commands, see the README.
