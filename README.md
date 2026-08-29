# Gram Vyapaar

AI-driven hyper-local business feasibility and financial structuring assistant for rural
micro-entrepreneurs. Built for **Smart India Hackathon 2026, Problem Statement 26091**
(Ministry of Social Justice & Empowerment).

This repository is meant to be **run with only the two `.env` files edited** — everything
else (schema, seed data, routes, UI) is already wired together.

---

## 1. What you need to edit

```
backend/.env    ← copy from backend/.env.example
frontend/.env   ← copy from frontend/.env.example
```

That's it. Copy the two `.example` files, fill in the values below, and everything else works
as-is.

### `backend/.env` — required values

| Variable | What to put | Required? |
|---|---|---|
| `DATABASE_URL` | Your Neon Postgres connection string | **Yes** |
| `JWT_SECRET` | Any long random string | **Yes** |
| `REFRESH_TOKEN_SECRET` | A *different* long random string | **Yes** |
| `AADHAAR_HASH_SALT` | Any random string | **Yes** |
| `GEMINI_API_KEY` | Your Gemini API key (from [Google AI Studio](https://aistudio.google.com/apikey)) | Only for live AI report generation — the seeded "Sunita" demo persona works without it |
| `REDIS_URL` | Leave as-is if using `docker-compose up`, or your Upstash URL | No — falls back to in-memory rate limiting if unset |
| Everything else | Leave the defaults | — |

### `frontend/.env`

Leave as the example — it's already configured to talk to `localhost:4000` via Vite's dev
proxy. Only change `VITE_API_BASE_URL` if you deploy the backend somewhere else.

---

## 2. One-time database setup (Neon)

1. Create a project at [neon.tech](https://neon.tech), copy the connection string into
   `backend/.env` as `DATABASE_URL`.
2. Open Neon's SQL editor and run once:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```
   (`vector` powers the AI grounding search; `pg_trgm` powers fuzzy duplicate-applicant
   matching. Both are required — the app degrades gracefully but loses those two features
   without them.)

---

## 3. Running locally (without Docker)

```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init   # creates all tables in your Neon DB
npm run seed                          # loads real NSFDC scheme data + the Sunita demo persona
npm run dev                           # http://localhost:4000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                           # http://localhost:5173
```

Open `http://localhost:5173`. Log in with the seeded demo account (`9999900001` /
`Demo@12345`), or click **"See a sample report"** on the landing page — that route
(`/demo/sunita`) needs no login and no live API key.

## 3b. Running with Docker

```bash
cp backend/.env.example backend/.env    # fill in values
cp frontend/.env.example frontend/.env
docker-compose up --build
```

This starts `backend`, `frontend`, and `redis`. Postgres stays external on Neon — there is
no local database container, by design (see `docker-compose.yml` comments). Run the Prisma
migration and seed script once, either against Neon directly from your host machine (as in
§3) or via `docker-compose exec backend npm run prisma:migrate && docker-compose exec backend npm run seed`.

---

## 4. Testing

```bash
# Backend — financial engine unit tests (no DB needed)
cd backend && npx vitest run tests/financial.test.ts

# Backend — full suite including the DB-backed integration smoke test
cd backend && npm test

# Frontend — production build / type-check
cd frontend && npm run build

# E2E happy path (needs both dev servers running + a seeded DB)
cd tests/e2e && npm install && npx playwright install --with-deps && npm test
```

The financial engine tests are the ones to run first and trust most — they cover every
scheme-slab boundary (₹1.40L, ₹50L), the moratorium math, and full loan amortization to
zero. See `backend/tests/financial.test.ts`.

---

## 5. What's real vs. seeded/mocked, and why

Being upfront about this matters more than pretending everything is production-grade —
judges (and future-you) will ask.

| Piece | Status | Notes |
|---|---|---|
| Financial engine (slabs, EMI schedule) | **Fully real**, deterministic, unit-tested | Numbers sourced from the PS's published NSFDC/NSKFDC scheme structure — see `prisma/seed.ts` comments |
| Competitor density map | **Real live data** | Queries the public Overpass API (OpenStreetMap) for real shop/business nodes; falls back to a clearly-labeled conservative estimate only if Overpass is unreachable |
| AI feasibility report | **Real**, via Gemini API, RAG-grounded via pgvector | Requires `GEMINI_API_KEY`. The **one exception** is the seeded "Sunita" persona, which ships with a single statically pre-generated report so the demo never depends on a live API call |
| Aadhaar verification | **Mocked at the exact integration point** | We hash `(Aadhaar last 4 + DOB)` for exact-match dedup and never store or verify a real Aadhaar number — there's no UIDAI sandbox access available for a hackathon build. This is a deliberate, scoped placeholder, not a hidden gap |
| Duplicate detection (fuzzy) | **Real**, via Postgres `pg_trgm` | Flags likely duplicates for admin review rather than auto-rejecting, to avoid false positives on common names |
| Partner routing | **Real geo-distance logic**, seeded sample partners | Haversine distance, excludes any partner flagged `hasHighNPA` |
| Report streaming | **Not live-streamed** | Full report JSON arrives in one request; the frontend staggers the reveal of each section with Framer Motion to *look* like live generation, deliberately avoiding a persistent socket dependency during a live demo over uncertain venue wifi |

---

## 6. Repository structure

```
backend/     Node + Express + TypeScript + Prisma API
  prisma/schema.prisma   All data models
  prisma/seed.ts         Real scheme data + Sunita demo persona
  src/services/           Financial engine, AI provider, RAG, duplicate detection, Overpass
  src/controllers/        Route handlers
  src/routes/              Route wiring
  tests/                   Vitest unit + integration tests

frontend/    React + Vite + TypeScript + Tailwind
  src/pages/               Route-level pages
  src/components/          Wizard, calculator, report, map, PDF, shared UI
  src/services/            Axios API clients
  src/i18n/, public/locales/   English/Hindi translations

tests/e2e/    Playwright end-to-end test

docker-compose.yml   backend + frontend + redis (Postgres external on Neon)
.github/workflows/ci.yml   Lint + test on every PR
```

---

## 7. Security & auth notes (for your pitch Q&A)

- JWT access tokens (15 min) + httpOnly, `sameSite: strict` refresh token cookies (7 days),
  rotated on every refresh, with a `refreshTokenVersion` field on `User` so logout instantly
  invalidates any outstanding refresh token.
- Passwords hashed with Argon2.
- The `aadhaarHash` uniqueness check hashes **only** `(Aadhaar last 4 + DOB)`, salted —
  deliberately excluding phone number, because `User.phone` already has its own unique
  constraint. Folding phone into the hash would let the same person re-register under a new
  phone number slip past the exact-match check entirely (see `backend/src/utils/hash.ts`).
- Rate limiting (Redis-backed when available, in-memory fallback otherwise): 100 req/15min
  general, 10 req/15min on auth routes.
- Helmet + CORS locked to `FRONTEND_ORIGIN`, Zod validation on every mutating route, Pino
  structured logging with a request ID per request.

---

## 8. Demo script suggestion

1. Land on `/` — explain the problem in one sentence.
2. Click **"See a sample report"** → walks through Sunita's full report with zero setup,
   zero network dependency risk.
3. Then register a **new** account live and run the wizard end-to-end with your own numbers
   to prove it isn't just a canned demo — this is where the real Gemini call + Overpass map
   + streaming-style reveal happen.
4. Show the Admin dashboard's duplicate-review queue and scheme editor.
5. Show the Partner dashboard, and explicitly point out the seeded high-NPA partner that gets
   filtered out of routing — a concrete, checkable claim.
