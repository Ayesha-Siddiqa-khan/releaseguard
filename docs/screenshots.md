# Screenshots

> Add screenshots of the application here after running locally.

## Dashboard Overview

![Dashboard](../.github/screenshots/dashboard.png)

## Deployment History

![Deployments](../.github/screenshots/deployments.png)

## Environment Status

![Environments](../.github/screenshots/environments.png)

## Rollback Log

![Rollback](../.github/screenshots/rollback.png)

---

To capture screenshots:

1. Run `docker compose up --build`
2. Seed the database: `curl -X POST http://localhost:8000/api/seed`
3. Open `http://localhost:3000`
4. Take screenshots of each page
5. Save to `.github/screenshots/`
