<!-- .github/copilot-instructions.md -->
# Quick instructions for AI coding agents

This file contains the minimal, project-specific knowledge an AI contributor needs to be immediately productive in this repository.

1) Big picture
- Monorepo-like layout: two independent services live under `frontend/` (React + Vite) and `backend/` (Node + Express). The frontend is a single-page app (see `frontend/src/App.jsx`) and the backend is an Express server (`backend/server.js`) exposing a small REST API.
- Runtime assumptions: backend listens on port 3000 and connects to MongoDB at `mongodb://127.0.0.1:27017` (DB name `dashboardDB`). Frontend dev server is Vite (defaults to port 5173) and a proxy is configured in `frontend/vite.config.js` to forward `/api` to the backend.

2) Important files and what they show
- `backend/server.js` — All API endpoints and DB logic. Key endpoints:
  - `GET  /api/applications` — returns applications with `status` (server computes by calling `prodUrl`).
  - `POST /api/applications` — add single application (server computes `status`).
  - `POST /api/applications/bulk` — accepts an array of apps; server adds `status` and inserts many.
  - `PUT  /api/applications/:id`, `DELETE /api/applications/:id` — update/delete by MongoDB `_id`.
  Note: `checkApplicationHealth` uses `axios.get(url, { timeout: 5000 })` and sets `status` to `'up'|'down'`.

- `frontend/src/App.jsx` — Top-level UI and client-side routing. Important patterns:
  - Hash-based navigation: `window.location.hash` drives pages (`dashboard`, `applications`, `details`).
  - Network calls use `fetch(...)` currently pointing at `http://localhost:3000/api/...` (see the note about proxy below).
  - Components: `components/` contains UI primitives (`Sidebar`, `TopBar`, `Modal`, `AdminForm`, `BulkUploadForm`); `pages/` contains `ApplicationsPage` and `ApplicationDetailsPage`.

- `frontend/vite.config.js` — dev proxy forwards `/api` to `http://localhost:3000` and rewrites the path. Prefer using relative `/api/...` fetches to leverage the proxy in dev.
- `frontend/package.json`, `backend/package.json` — scripts and dependencies. Useful scripts documented below.

3) How to run (dev & build)
- Prerequisite: MongoDB must be running locally on `127.0.0.1:27017` (database `dashboardDB`). The backend connects without credentials by default.

- Backend (dev):
  - cd `backend`
  - npm install
  - npm run dev    # uses nodemon (restarts on change)
  - npm start      # runs `node server.js` (production style)

- Frontend (dev):
  - cd `frontend`
  - npm install
  - npm run dev    # starts Vite dev server (HMR)
  - npm run build  # build production assets
  - npm run preview# preview a production build

4) API surface and data shapes (quick reference)
- Application object (fields discovered in code): typical properties include `_id` (MongoDB ObjectId), `prodUrl` (string), and `status` (server-computed string `'up'|'down'`). The UI expects `_id` for edits/deletes.
- Bulk upload: `POST /api/applications/bulk` expects a JSON array of application objects; the server runs health checks and inserts them.

5) Project-specific conventions & gotchas
- Proxy vs. hard-coded host: `vite.config.js` proxies `/api` to the backend so frontend code should generally use relative paths like `/api/applications`. Currently many calls in `frontend/src/App.jsx` use the absolute `http://localhost:3000/api/...` URL — note this when changing hosts or when switching to the proxy.
- Hash routing: navigation uses `window.location.hash` rather than a router library. Updates to pages are done by setting `window.location.hash` (see `App.jsx`).
- DB connection string is hard-coded in `backend/server.js` (`mongoUri`). For deployments or secret handling, replace with env vars — currently not present.
- Error handling: server prints to console and exits if DB connection fails (see `startServer()`), so ensure Mongo is available before starting.

6) Integration points & external dependencies
- MongoDB (`mongodb` package) — local default at `127.0.0.1:27017`.
- Axios on the backend for health checks; frontend uses `fetch` and `xlsx` for Excel parsing in `BulkUploadForm`.

7) Suggested safe edits an AI may perform (examples)
- Make frontend API calls relative to `/api` to use Vite proxy (edit `frontend/src/App.jsx`):
  - change `fetch('http://localhost:3000/api/applications')` -> `fetch('/api/applications')` (and similar for other calls).
- Add environment variable support in `backend/server.js` for `mongoUri` and `PORT` if preparing for deployment.

8) Linting & tests
- Frontend lint: `cd frontend && npm run lint` (ESLint configured in repo). There are no automated tests in the project now.

9) Where to look for more context
- UI flow and component examples: `frontend/src/components/*` and `frontend/src/pages/*` (search `AdminForm`, `BulkUploadForm`, `ApplicationsPage`).
- Primary server logic and API behavior: `backend/server.js` (health-check logic, bulk upload behavior, ObjectId validation).

If anything here is unclear or you want more detail (examples of code edits, environment variable scaffolding, or a PR that switches the frontend to relative API paths), tell me which part to expand and I will update this file accordingly.
