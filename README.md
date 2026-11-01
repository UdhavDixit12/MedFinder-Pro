# MedFinder Pro

A full-stack (MERN) healthcare web app for finding **real** hospitals, clinics, doctors, dentists, pharmacies and laboratories near any location in India — defaulting to **Bhiwani, Haryana**. Facility data is fetched live from **OpenStreetMap** via the Overpass API; there is no hardcoded or sample hospital data anywhere in the application.

Features:

- Live facility search by place name (Nominatim geocoding) or the browser's current location (only when the user asks)
- Synchronized result list and Leaflet map, category filters, radius, sorting, details panel, Google Maps / OSM directions
- Accounts (bcrypt-hashed passwords, JWT in an HTTP-only cookie), profile management, saved facilities stored in MongoDB
- Rule-based symptom guidance with emergency red-flag detection (optional real AI provider via the backend)
- Emergency panel with 112 / 108 / 102 dial links and nearest hospitals
- Clear loading, empty, error and stale-result states; responsive and keyboard-accessible UI

---

## Project structure

```
.
├── client/                 React 19 + Vite 6 + Tailwind CSS 4 + React Router 7 + React Leaflet 5
│   └── src/
│       ├── components/     UI kit (components/ui) + facility, map, navbar, emergency components
│       ├── context/        Auth, favourites and toast providers
│       ├── hooks/          useHospitalSearch, useGeolocation, useMediaQuery, useDocumentTitle
│       ├── layouts/        MainLayout
│       ├── pages/          Home, Search, Facility, Login, Register, Dashboard, Symptoms, Emergency, About, 404
│       ├── services/       Axios API client
│       └── utils/          Formatting, directions URLs, validation
├── server/                 Node.js + Express 4 + Mongoose 8
│   ├── config/             Environment + MongoDB connection
│   ├── controllers/        Request handlers
│   ├── middleware/         Auth, validation, rate limits, origin check, error handler
│   ├── models/             User, Favourite
│   ├── routes/             /api/auth, /api/users, /api/hospitals, /api/favourites, /api/symptoms
│   ├── services/           Nominatim geocoding, Overpass search, symptom guidance
│   ├── tests/              node:test + supertest suites (external services mocked here only)
│   ├── app.js              Express app factory
│   └── server.js           Startup / graceful shutdown
├── .env.example            Server environment template (copy to server/.env)
└── package.json            npm workspaces + root scripts
```

## Requirements

- **Node.js 20.11+** (developed and tested on Node 24.18, npm 11)
- **MongoDB 6+** — local (`mongodb://127.0.0.1:27017`) or MongoDB Atlas
- Internet access to `nominatim.openstreetmap.org`, the Overpass endpoints and `api.maptiler.com`

## Setup

```bash
# 1. Install all dependencies (client + server via npm workspaces)
npm install

# 2. Create the server environment file and edit the values
cp .env.example server/.env          # Windows PowerShell: Copy-Item .env.example server/.env

# 3. Start the API (http://localhost:5000) and the web app (http://localhost:5173) together
npm run dev
```

Open http://localhost:5173. In development, Vite proxies `/api` to the backend, so no client configuration is needed.

Other scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev:server` / `npm run dev:client` | Run one side only |
| `npm test` | Backend automated tests (requires MongoDB; uses the `medfinder_pro_test` database) |
| `npm run lint` | ESLint for the client |
| `npm run build` | Production build of the client into `client/dist` |
| `npm start` | Start the API in the mode given by `NODE_ENV` |

### MongoDB

- **Local:** install MongoDB Community Server and keep `MONGODB_URI=mongodb://127.0.0.1:27017/medfinder_pro`.
- **Atlas:** create a cluster and a database user, allow your server's IP in *Network Access*, and set
  `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/medfinder_pro?retryWrites=true&w=majority`.

If MongoDB is unreachable the API still starts: hospital search keeps working, while account and favourite endpoints return `503 DB_UNAVAILABLE`.

## Environment variables (`server/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | – | `development` / `production` / `test` |
| `PORT` | – | API port (default `5000`) |
| `CLIENT_ORIGIN` | ✔ prod | Comma-separated allowed browser origins (CORS + CSRF origin check) |
| `MONGODB_URI` | ✔ | MongoDB connection string |
| `JWT_SECRET` | ✔ prod | Secret for signing session tokens (≥ 32 chars in production; the server refuses to start without it) |
| `JWT_EXPIRES_IN` | – | Session lifetime (default `7d`) |
| `COOKIE_SAMESITE` | – | `lax` (default) — use `none` only when frontend and API are on different sites, together with HTTPS |
| `COOKIE_SECURE` | – | `true` behind HTTPS (defaults to `true` in production) |
| `OSM_USER_AGENT` | ✔ | Identifies your app to Nominatim/Overpass, e.g. `MedFinderPro/1.0 (contact: you@example.com)` |
| `OSM_CONTACT_EMAIL` | – | Sent to Nominatim as `email=` per its usage policy |
| `NOMINATIM_URL` | – | Geocoder base URL (default public Nominatim) |
| `OVERPASS_URLS` | – | Comma-separated Overpass endpoints tried in order with failover |
| `OVERPASS_TIMEOUT_MS` | – | Timeout for the last endpoint tried (default `30000`) |
| `OVERPASS_FAILOVER_TIMEOUT_MS` | – | Timeout for earlier endpoints before failing over (default `12000`) |
| `AI_API_KEY`, `AI_API_URL`, `AI_MODEL` | – | Optional OpenAI-compatible chat-completions provider for the symptom checker |
| `SERVE_CLIENT` | – | `true` to serve `client/dist` from Express (single-server deployment) |
| `CSP_TILE_ORIGINS` | – | Comma-separated map-image hosts for the content security policy (default `https://api.maptiler.com`) |

Client build-time variables (`client/.env`, see `client/.env.example`) are **public** and must never contain secrets:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API origin when the API is on a different host, e.g. `https://api.example.com` (leave empty for same-origin) |
| `VITE_TILE_URL` | MapTiler tile template, including your key, e.g. `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=YOUR_MAPTILER_KEY`. Required for map images. Public in the bundle; set it before `npm run build`. |
| `VITE_DEV_API_PROXY` | Dev-only proxy target (default `http://localhost:5000`) |

## API

All responses share the format `{ "success": true, "data": … }` or `{ "success": false, "error": { "message", "code", "details?" } }`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Service + database status |
| GET | `/api/hospitals/search?location=Bhiwani&radius=5000&type=hospital` | – | Live search. Use `lat`+`lon` instead of `location` for coordinates. `radius` 500–25000 m; `type` = `all, hospital, clinic, doctors, dentist, pharmacy, laboratory` |
| GET | `/api/hospitals/:osmType/:osmId` | – | A single OSM element (`node`/`way`/`relation`), optional `lat`/`lon` for distance |
| GET | `/api/hospitals/categories` | – | Supported types and default location |
| POST | `/api/auth/register` | – | `{ name, email, password }` |
| POST | `/api/auth/login` | – | `{ email, password }` — sets the `mf_token` HTTP-only cookie |
| POST | `/api/auth/logout` | – | Clears the cookie |
| GET | `/api/auth/me` | ✔ | Current user |
| GET / PATCH | `/api/users/profile` | ✔ | Read / update `{ name, homeLocation }` |
| PATCH | `/api/users/password` | ✔ | `{ currentPassword, newPassword }` |
| GET | `/api/favourites` | ✔ | Saved facilities |
| POST | `/api/favourites` | ✔ | `{ osmType, osmId, lat, lon, name?, category?, address?, phones? }` (idempotent) |
| DELETE | `/api/favourites/:osmType/:osmId` | ✔ | Remove |
| GET | `/api/symptoms/catalog` | – | Symptom list, red flags, whether AI is enabled |
| POST | `/api/symptoms/check` | – | `{ symptoms[], redFlags[], description?, ageGroup?, duration? }` |

Example search response (shortened, real data):

```json
{
  "success": true,
  "data": {
    "location": { "label": "Bhiwani, Haryana, 125021, India", "lat": 28.7931703, "lon": 76.1391283, "source": "geocoded" },
    "query": { "radius": 10000, "type": "hospital" },
    "facilities": [
      { "id": "node/7611484731", "osmType": "node", "osmId": 7611484731, "name": "Toshamiya Hospital",
        "category": "hospital", "lat": 28.79, "lon": 76.14, "address": "Sarai, Chopta, Bhiwani, Haryana, 127021",
        "phones": [], "distanceMeters": 551, "osmUrl": "https://www.openstreetmap.org/node/7611484731", "source": "openstreetmap" }
    ],
    "total": 66,
    "source": { "provider": "OpenStreetMap Overpass API", "endpoint": "overpass.openstreetmap.fr", "dataTimestamp": "…", "cached": false }
  }
}
```

## How the real hospital search works

1. The client sends the location text (or coordinates) to `GET /api/hospitals/search`. Typing does **not** trigger requests — searches run on submit or when a filter changes (debounced 350 ms), in line with Nominatim's no-autocomplete policy.
2. The server validates parameters, then geocodes the text with Nominatim (throttled to 1 request/second application-wide, with a 24 h cache).
3. It builds an Overpass QL query covering OSM `node`, `way` and `relation` elements tagged `amenity=hospital|clinic|doctors|dentist|pharmacy` or `healthcare=*`, within the radius, and requests `out center tags`.
4. Endpoints in `OVERPASS_URLS` are tried in order. HTTP 429/5xx, timeouts, malformed JSON and Overpass runtime-error remarks cause failover, and failing endpoints are deprioritised for 5 minutes. If all of them fail, the API returns a clear `503`/`504` error — never substitute data.
5. Elements are normalised (name, category, address from `addr:*`, phone, website, opening hours, emergency, operator, coordinates), distance is calculated with the haversine formula, and results are sorted by distance. Missing fields stay `null`; the UI says "not listed in OpenStreetMap".
6. Results are cached for 10 minutes per (rounded location, radius, type), and identical in-flight requests are de-duplicated.

## Symptom checker and AI

Without `AI_API_KEY`, the checker uses a fixed, clearly labelled rule set: it matches selected symptoms and keywords, always checks emergency red flags, and returns general information plus "see a doctor if…" guidance. It never diagnoses or recommends medication.

To enable AI-assisted text, set `AI_API_KEY` (and optionally `AI_API_URL` / `AI_MODEL`) for any **OpenAI-compatible chat-completions API**. Calls are made only from the server, inputs are length-limited, only symptom data (no account details) is sent, and on any failure the app falls back to rule-based guidance with a notice. Emergency red-flag detection always uses the fixed rules and skips the AI call.

## Testing

```bash
npm test        # from the repository root (or `npm test` inside server/)
```

The backend suite (39 tests) covers Overpass query building, normalisation, failover, caching, rate-limit/timeout/malformed-response handling, empty results, geocoding errors, validation, registration, login, protected routes, profile, password change, favourites (CRUD, de-duplication, per-user isolation), CSRF origin check, symptom safety rules and security headers. External services are mocked **only inside the tests**; the running application always calls the real services.

## Deployment

**Option A — single server (simplest):**

```bash
npm install
npm run build
# server/.env: NODE_ENV=production, SERVE_CLIENT=true, CLIENT_ORIGIN=https://your-domain,
#              COOKIE_SECURE=true, a strong JWT_SECRET, MONGODB_URI (Atlas), OSM_USER_AGENT with contact
npm start
```

Run it behind HTTPS (e.g. a reverse proxy or a platform such as Render or Railway). `trust proxy` is enabled in production so secure cookies and rate limiting work behind one proxy.

**Option B — separate frontend and API:** deploy `client/dist` to a static host with `VITE_API_BASE_URL=https://api.your-domain` set at build time, and configure SPA fallback to `index.html`. On the API, set `CLIENT_ORIGIN` to the frontend origin. If the two are on different *sites* (not just subdomains), set `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true`.

Secrets live only in `server/.env` or the host's environment settings. The client bundle contains only `VITE_*` values.

## External services, attribution and usage policies

- **Data:** © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. Attribution is shown in the map, results, footer and details.
- **Nominatim** ([policy](https://operations.osmfoundation.org/policies/nominatim/)): max 1 request/second, a valid identifying User-Agent, no autocomplete, and results must be cached. All of these are implemented. For heavy traffic, self-host Nominatim or use a commercial geocoder.
- **Overpass API** ([public instances](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances)): shared and sometimes overloaded (the main instance returned "at capacity" errors during development). For production traffic, run your own instance or use a commercial provider.
- **Tiles:** map images come from [MapTiler](https://www.maptiler.com/copyright/) (`VITE_TILE_URL`), drawn from OpenStreetMap data. Both credits are shown on the map. `CSP_TILE_ORIGINS` must include the tile host (`https://api.maptiler.com`). The OpenStreetMap volunteer tile server is not used.

## Known limitations

- OSM coverage varies: listings may be missing, duplicated, closed or outdated, and phone numbers are often absent. MedFinder Pro does not verify any listing.
- Some public Overpass mirrors serve older data snapshots (for example, `overpass.openstreetmap.fr` was about 2.5 months behind during testing). The snapshot date is shown under results.
- Caches and rate limits are in-memory, so each server instance has its own. Use Redis or similar for multi-instance deployments.
- Emergency numbers (112, 108, 102) can vary by state. The app only opens the phone's dialer and never contacts services itself.
- The symptom checker covers a limited set of common symptoms and is informational only.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "The Overpass API is busy or unavailable" | Public servers are overloaded; retry later, or add or reorder endpoints in `OVERPASS_URLS` |
| Search is slow (20–40 s) | The first endpoint is timing out before failover; it is deprioritised for 5 minutes automatically. Reorder `OVERPASS_URLS` if it persists |
| "The geocoding service refused the request" | Set a descriptive `OSM_USER_AGENT` with contact information |
| Accounts return `503 DB_UNAVAILABLE` | Check that MongoDB is running and `MONGODB_URI` is correct (and that Atlas allows your IP) |
| Logged out immediately in production | Serve over HTTPS with `COOKIE_SECURE=true`; for cross-site deployments use `COOKIE_SAMESITE=none` |
| `Port 5000 is already in use` | Change `PORT` in `server/.env` (and `VITE_DEV_API_PROXY` for the client) |
| "Too many sign-in attempts" during development | The auth limiter allows 20 failures per 15 minutes per IP; restart the server to reset it |
