# Gram Vyapaar 

> **AI-Driven Hyper-Local Business Advisory & Concessional Financial Structuring Platform**  
> *Developed for Smart India Hackathon (SIH) | Ministry of Social Justice & Empowerment (MoSJE)*  
> *Problem Statements: PS 26091 (Hyper-Local Advisory) & PS 26092 (Scheme Matching & Channel Routing)*

---

## Overview

**Gram Vyapaar** is an institutional-grade digital platform designed to bridge the gap between marginalized rural micro-entrepreneurs (Scheduled Caste beneficiaries) and government-backed concessional credit schemes (NSFDC / NSKFDC).

While the government provides concessional loans covering up to **90% of project costs** (with a **10% beneficiary margin contribution**), rural entrepreneurs frequently struggle due to lack of localized market intelligence, financial structuring confusion, and difficulty navigating the offline Channel Finance System.

Gram Vyapaar delivers a unified solution:
1. **Deterministic Financial Structuring**: Computes exact project costs, loan eligibility, concessional interest rates, and quarterly reducing-balance amortization schedules with statutory moratoriums.
2. **AI Hyper-Local Business Feasibility Advisory**: Generates actionable, location-specific business feasibility reports (Market Reach, SWOT, Threats, Pricing, Underserved Niches) grounded in official scheme circulars.
3. **Real-Time Competitor Density Mapping**: Integrates OpenStreetMap (Overpass API) to analyze local commercial saturation within a 5–10 km radius.
4. **Intelligent Channel Partner Routing**: Directs applications to the nearest authorized State Channelizing Agencies (SCAs), Public Sector Banks (PSBs), and RRBs while automatically filtering out institutions with high Non-Performing Assets (NPAs).
5. **Privacy-Preserving Deduplication**: Protects public funds using salted Aadhaar cryptographic hashing and PostgreSQL trigram similarity to detect duplicate applications without storing sensitive identity data.

---

## System Architecture

```
                                      GRAM VYAPAAR ARCHITECTURE
                                  
            [ Rural Entrepreneur / CSC Operator / Channel Partner / Admin ]
                                          │
                                          ▼
     ┌────────────────────────────────────────────────────────────────────────┐
     │                     FRONTEND LAYER (React 18 + Vite + TS)              │
     │  • Tailwind CSS Design System (High-contrast, accessible UI)           │
     │  • Multilingual Localization Engine (i18next: English & Hindi)         │
     │  • Dynamic Amortization & Cashflow Visualization (Recharts)            │
     │  • Geospatial Competitor & Partner Map (Leaflet / React-Leaflet)       │
     │  • 1-Click Bank-Ready PDF Business Plan Generator                      │
     └───────────────────────────────────┬────────────────────────────────────┘
                                         │ HTTP REST APIs
                                         ▼
     ┌────────────────────────────────────────────────────────────────────────┐
     │                     BACKEND API (Node.js + Express + TS)               │
     │  • Dual-Token Auth (15-min Access JWT + 7-day httpOnly Refresh Cookie) │
     │  • Role-Based Access Control (ENTREPRENEUR, PARTNER, ADMIN)            │
     │  • Pure Deterministic Financial Math & Amortization Engine             │
     │  • Overpass OpenStreetMap Geo-Density Aggregator                       │
     │  • Salted Aadhaar Hash + Trigram Duplicate Detection Engine            │
     │  • Structured Logging (Pino) & Distributed Rate Limiting (Redis)       │
     └───────────────────┬─────────────────────────────────┬──────────────────┘
                         │                                 │
                         ▼                                 ▼
     ┌──────────────────────────────────────┐   ┌─────────────────────────────┐
     │           DATABASE LAYER             │   │       AI & RAG ENGINE       │
     │  • PostgreSQL (Neon Serverless)      │   │  • Google Gemini 2.0 Flash  │
     │  • Prisma ORM                        │   │    (Structured JSON Schema) │
     │  • pgvector (Embedding Search)       │   │  • Grounded Fallback Engine │
     │  • pg_trgm (Fuzzy Trigram Index)     │   │    (Zero-latency demo mode) │
     └──────────────────────────────────────┘   └─────────────────────────────┘
```

---

## Core Technical Features

### 1. Deterministic Financial Math Engine
The core calculation strictly enforces MoSJE/NSFDC lending rules with 100% mathematical precision:
- **Project Cost** = $\text{Margin Capital} / 0.10$
- **Loan Amount** = $\text{Project Cost} \times 0.90$
- **Micro Finance Scheme** ($\text{Project Cost} \le \text{₹1,40,000}$):
  - Interest Rate: **6.50% p.a.**
  - Tenure: **36 Months** (12 Quarters)
  - Moratorium: **3 Months** (1 Quarter principal moratorium)
- **Term Loan Scheme** ($\text{₹1,40,000} < \text{Project Cost} \le \text{₹50,00,000}$):
  - Interest Rate: **8.00% p.a.**
  - Tenure: **84 Months** (28 Quarters)
  - Moratorium: **6 Months** (2 Quarters principal moratorium)
- Generates a complete quarterly reducing-balance amortization table including opening balance, principal repayment, interest component, quarterly installment, and closing balance.

### 2. Grounded AI Feasibility Advisory & Fallback Resilience
- Utilizes Google Gemini 2.0 Flash with strict JSON Schema constraints.
- Injects vector-retrieved scheme chunks (`pgvector`) into the context window to prevent hallucinations.
- Features an integrated **Grounded Fallback Engine** that generates realistic, data-backed reports even during API quota exhaustion or offline hackathon demo conditions.

### 3. OpenStreetMap Overpass Geospatial Engine
- Queries live Overpass API nodes (`shop=*`, `amenity=*`, `craft=*`) within the applicant's village/block coordinates.
- Returns real competitor density counts and map markers to calculate market saturation.
- Gracefully defaults to regional demographic baselines if external OSM servers experience latency.

### 4. Channel Partner Routing with NPA Safeguards (PS 26092)
- Calculates Haversine distances to nearby State Channelizing Agencies (SCAs), Public Sector Banks (PSBs), and Regional Rural Banks (RRBs).
- Automatically filters out institutions with `hasHighNPA = true` to protect applicants from disbursement stalls.

### 5. Privacy-Preserving Duplicate Citizen Detection
- Computes a salted cryptographic hash: $\text{SHA256}(\text{AadhaarLast4} + \text{DOB} + \text{SALT})$.
- Uses PostgreSQL `pg_trgm` fuzzy similarity across names, villages, and blocks.
- Suspicious matches are routed to an administrative review queue rather than auto-rejected, preventing false positives on common rural names.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion, Recharts, React-Leaflet, i18next, html2canvas, jsPDF |
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, Zod, Argon2, JSON Web Tokens, Pino Logger, Helmet, CORS |
| **Database** | PostgreSQL (Neon Serverless compatible), `pgvector` extension, `pg_trgm` extension |
| **Cache & Queue** | Redis (Docker / Upstash compatible) for rate limiting |
| **AI / ML** | Google Gemini API (`gemini-2.0-flash`, `text-embedding-004`), Grounded Rule-Engine Fallback |
| **Geodata** | OpenStreetMap Overpass API, Leaflet Tiles |
| **Testing** | Vitest (Unit & Integration tests), Playwright (E2E testing) |
| **DevOps** | Docker, Docker Compose, GitHub Actions CI |

---

## Directory Structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema (PostgreSQL + pgvector + pg_trgm)
│   │   └── seed.ts                    # Official NSFDC scheme data & Sunita demo persona
│   ├── src/
│   │   ├── config/                    # Environment validation, Pino logger, rate-limiter
│   │   ├── controllers/               # Auth, Calculator, Report, Admin, Partner, Geodata handlers
│   │   ├── middleware/                # JWT auth, Role-Based Access Control, Error handling
│   │   ├── routes/                    # API route definitions
│   │   ├── services/
│   │   │   ├── ai/                    # Gemini Provider & Grounded Fallback Provider
│   │   │   ├── duplicate.service.ts   # Salted Aadhaar hash & trigram fuzzy matching
│   │   │   ├── financial.service.ts   # Deterministic financial math & amortization schedules
│   │   │   ├── overpass.service.ts    # OpenStreetMap Overpass API competitor client
│   │   │   └── rag.service.ts         # pgvector semantic search over scheme documentation
│   │   ├── utils/                     # Custom ApiError, hashing, and math helpers
│   │   ├── app.ts                     # Express application configuration
│   │   └── index.ts                   # Server entry point
│   ├── tests/
│   │   ├── financial.test.ts          # Vitest boundary condition tests for financial engine
│   │   └── health.test.ts             # Health check tests
│   ├── .env.example                   # Backend environment template
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── locales/                   # English (en.json) & Hindi (hi.json) translations
│   ├── src/
│   │   ├── components/
│   │   │   ├── calculator/            # Interactive financial sliders & amortization tables
│   │   │   ├── common/                # Navbar, Footer, LanguageToggle, DemoPersonaBanner
│   │   │   ├── map/                   # Leaflet OSM Competitor & Partner locator
│   │   │   ├── pdf/                   # 1-Click Bank-Ready Business Plan PDF template
│   │   │   ├── report/                # Dynamic AI feasibility cards (SWOT, Pricing, Threats)
│   │   │   ├── ui/                    # Reusable accessible UI primitives
│   │   │   └── wizard/                # Multi-step intake wizard (Location, Capital, Category)
│   │   ├── context/                   # AuthContext & LanguageContext
│   │   ├── hooks/                     # Custom application hooks
│   │   ├── pages/                     # LandingPage, IntakeWizard, Report, Admin, Partner Dashboards
│   │   ├── services/                  # Axios API clients
│   │   ├── types/                     # Shared TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example                   # Frontend environment template
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── docker-compose.yml                 # Multi-container orchestration (Backend + Frontend + Redis)
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL Database**: Neon Serverless Postgres instance (recommended) or local PostgreSQL with `vector` and `pg_trgm` extensions enabled.

---

### Step 1: Clone and Configure Environment

```bash
# Clone the repository
git clone https://github.com/your-username/gram-vyapaar.git
cd gram-vyapaar

# Setup backend environment
cp backend/.env.example backend/.env

# Setup frontend environment
cp frontend/.env.example frontend/.env
```

#### Edit `backend/.env`:
```env
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173

# Neon PostgreSQL connection string
DATABASE_URL="postgresql://user:password@ep-sample-123.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Auth secrets
JWT_SECRET="your-secure-jwt-secret-key-32-chars-min"
JWT_ACCESS_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-secure-refresh-token-secret-key-32-chars-min"
REFRESH_TOKEN_EXPIRES_IN="7d"
REFRESH_TOKEN_COOKIE_NAME="gv_refresh_token"

# Google Gemini API key (optional — built-in fallback operates if left empty)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.0-flash"
GEMINI_EMBEDDING_MODEL="text-embedding-004"

# Identity hashing salt
AADHAAR_HASH_SALT="your-custom-salt-value"
DUPLICATE_SIMILARITY_THRESHOLD="0.45"

# Geodata
OVERPASS_API_URL="https://overpass-api.de/api/interpreter"
```

---

### Step 2: Database Initialization (Neon PostgreSQL)

1. Open your Neon SQL Editor and execute:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```
2. Run database migrations and seed official scheme data:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev --name init
   npm run seed
   ```

---

### Step 3: Run the Application

#### Option A: Local Development Server

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Server running at http://localhost:4000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm install
npm run dev
# Client running at http://localhost:5173
```

#### Option B: Docker Compose

```bash
docker-compose up --build
```

---

## Verification & Testing

```bash
# Run backend financial engine unit tests
cd backend
npx vitest run tests/financial.test.ts

# Run full backend test suite
npm test

# Verify frontend TypeScript types and build bundle
cd ../frontend
npm run build
```

---

## API Reference

### Public & Entrepreneur Routes
- `POST /api/auth/register` — Register new beneficiary (with Aadhaar hash deduplication).
- `POST /api/auth/login` — Authenticate and issue access JWT + httpOnly refresh cookie.
- `POST /api/auth/refresh` — Rotate refresh token and issue new access token.
- `POST /api/auth/logout` — Revoke active token version and clear cookies.
- `POST /api/calculator/compute` — Pure deterministic financial calculation and amortization schedule.
- `POST /api/applications` — Create business application.
- `POST /api/reports/generate/:applicationId` — Generate AI feasibility report.
- `GET /api/reports/:applicationId` — Retrieve existing feasibility report.
- `GET /api/partners/nearby` — Query nearby channel partners filtered by NPA status.

### Admin & Channel Partner Routes
- `GET /api/admin/schemes` — View active lending schemes and interest slabs.
- `PUT /api/admin/schemes/:id` — Update scheme interest rates, slabs, and tenures.
- `GET /api/admin/duplicates` — View flagged duplicate applicant review queue.
- `POST /api/admin/duplicates/:id/resolve` — Approve or reject flagged duplicate applications.
- `GET /api/partner/applications` — Channel partner incoming applications queue.
- `PUT /api/partner/applications/:id/decision` — Channel partner application decision (ACCEPTED / REJECTED).

---

## Demo Credentials

For judging and evaluation, the database seed includes pre-configured personas:

| Role | Phone | Password | Description |
|---|---|---|---|
| **Entrepreneur** | `9999900001` | `Demo@12345` | "Sunita" — Dairy Entrepreneur persona with pre-generated report |
| **Channel Partner** | `9999900002` | `Partner@12345` | Branch Manager at State Channelizing Agency (SCA) |
| **Administrator** | `9999900003` | `Admin@12345` | MoSJE Department Administrator |

*Note: Clicking **"See a sample report"** on the landing page loads the complete Sunita feasibility report instantly without requiring login or live API connectivity.*

---

## License

This project is developed for the **Smart India Hackathon 2026** under the **Ministry of Social Justice & Empowerment (MoSJE)**. Distributed under the MIT License.
