# Running the preview in Replit

Use the **Start application** workflow to run the preview:

```bash
bash scripts/start-preview.sh
```

The script creates a temporary PostgreSQL database under `/tmp`, applies the versioned migrations,
seeds only the location directory, and starts the FastAPI and React development servers. The browser
uses the frontend's same-origin `/api` proxy to reach the backend.

The preview database is disposable and is deleted when the workflow stops. It is configured for
staging, keeps indexing disabled, and contains no customer, lead, shop, or offer data. It is not a
production deployment and must not be used as a persistent database.

Run frontend checks with:

```bash
cd frontend
CI=true yarn test --watchAll=false --runInBand
yarn build
```
