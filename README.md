<div align="center">

```
██╗  ██╗██╗██████╗  █████╗ ███╗   ██╗ █████╗     ██╗ ██████╗
██║ ██╔╝██║██╔══██╗██╔══██╗████╗  ██║██╔══██╗    ██║██╔═══██╗
█████╔╝ ██║██████╔╝███████║██╔██╗ ██║███████║    ██║██║   ██║
██╔═██╗ ██║██╔══██╗██╔══██║██║╚██╗██║██╔══██║    ██║██║▄▄ ██║
██║  ██╗██║██║  ██║██║  ██║██║ ╚████║██║  ██║    ██║╚██████╔╝
╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝    ╚═╝ ╚══▀▀═╝
```

**Remote Cash Flow Underwriting Engine for India's 13 Million Kirana Stores**

*Multimodal AI · Geo Intelligence · NBFC-Grade Fraud Resilience*

---

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Celery](https://img.shields.io/badge/Celery-5.3-37814A?style=flat-square&logo=celery&logoColor=white)](https://docs.celeryq.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## The Problem

India has **13 million kirana stores** — the backbone of its ₹50 lakh crore retail economy. They are an enormous, largely untapped credit market for NBFCs. Yet underwriting them is nearly impossible through conventional means:

- ❌ No ITR filings
- ❌ No GST history
- ❌ No balance sheets
- ❌ No formal accounting

The only truth a kirana store has is the **physical world around it** — the shelves it stocks, the street it sits on, and the customers it serves.

**KiranaIQ solves exactly this.**

---

## What It Does

KiranaIQ is a full-stack AI underwriting platform. An NBFC field officer uploads 3–5 photos of a kirana store from their phone. In under 90 seconds, the system returns:

| Output | Description |
|--------|-------------|
| 📊 **Daily / Monthly Revenue Range** | Estimated with ±25% confidence bounds |
| 🏦 **Loan Recommendation** | FOIR-based sizing with EMI range |
| 🚩 **Risk Flags** | 5 automated fraud tripwires |
| 📍 **Geo Intelligence** | Footfall, competition density, catchment analysis |
| 🔬 **Feature Attribution** | Transparent, explainable signal breakdown |
| 👥 **Peer Benchmarking** | Percentile rank vs. nearby comparable stores |

---

## Five-Stage AI Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   VISION    │───▶│     GEO     │───▶│    FRAUD    │───▶│   FUSION    │───▶│    LOAN     │
│             │    │             │    │             │    │             │    │             │
│ Groq Vision │    │ OSM/Overpass│    │  5 Tripwire │    │  3-Path     │    │ FOIR-Based  │
│ Shelf SDI   │    │ Footfall    │    │  Validators │    │  Estimator  │    │  Sizer +    │
│ SKU Density │    │ Competition │    │ Cross-Signal│    │  Uncertainty│    │  Peer Bench │
│ Refill Sig. │    │ Catchment   │    │  Validation │    │  Engine     │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
   Parallel ──────────────────────────────────────────────────────────────────▶  Sequential
```

### Stage 1 — Vision Analysis
Each uploaded image is independently analysed by **Groq's multimodal LLM** (Llama 3.2 Vision). Outputs are then merged by `MultiImageMerger`, which computes a **consistency score** across images — high variance is a fraud signal.

Extracted signals per image:
- `shelf_density_index` (SDI) — fraction of shelf space stocked
- `sku_diversity` — estimated distinct product category count
- `dominant_categories` — mapped to Indian kirana price bands
- `refill_signal` — partially-empty shelves = recent high demand
- `store_area`, `image_type`, `image_quality`

### Stage 2 — Geo Intelligence
Three parallel OSM/Overpass queries (no paid API required):
- **Footfall Score (0–100)** — weighted sum of nearby POIs (bus stops, schools, markets) with distance decay
- **Competition Index (0–1)** — density of nearby grocery/kirana stores
- **Catchment Analysis** — residential density and income proxy from building/landuse data

All geo results are **Redis-cached for 6 hours** to avoid hammering the Overpass API.

### Stage 3 — Fraud Detection
Five automated tripwires, each with defined severity and recommended actions:

| Tripwire | Condition | Severity |
|----------|-----------|----------|
| `inventory_footfall_mismatch` | High SDI + very low footfall | 🔴 High |
| `low_image_consistency` | Consistency score < 0.55 | 🔴 High |
| `insufficient_image_coverage` | Missing interior / counter / exterior | 🟡 Medium |
| `sku_geo_income_mismatch` | Premium SKUs in low-income catchment | 🟡 Medium |
| `high_competition_low_sdi` | Dense competition + low shelf density | 🟢 Low |

**Recommendation logic:** 2+ high-severity flags → `reject`; 1 high-severity flag → `needs_verification`; otherwise → `approve`.

### Stage 4 — Fusion & Uncertainty
Revenue is estimated via **three independent paths**, fused by data-quality weights:

```
Path A (55%) — Working Capital Cycle:  Inventory Value × Daily Turnover
Path B (30%) — Geo-Demand Model:       Footfall Score → benchmark range
Path C (15%) — Size-Based Model:       Revenue per sq ft (if size given)
```

The `UncertaintyEngine` computes confidence-adjusted ranges. Base spread is ±25%, **reduced** by strong signals (high SDI, known store size, multi-image consistency) and **widened** by fraud flags.

### Stage 5 — Loan Sizing + Peer Benchmarking
```
Max_Loan = Monthly_Net_Income × FOIR × Annuity_Factor(18% p.a., 18 months)
```
- FOIR = 0.45 (kirana industry standard)
- All loan amounts rounded to nearest ₹5,000
- Peer benchmarking via MongoDB `2dsphere` geo-query (2km radius)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│          React 18 + Vite · TypeScript · Tailwind CSS            │
│     Mapbox GL · Recharts · React Query · Zustand · jsPDF        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY                                 │
│              FastAPI 0.111 · JWT Auth · CORS                    │
│         /api/v1/auth  /api/v1/assess  /api/v1/assessments       │
└──────────┬─────────────────────────────────────┬───────────────┘
           │ Enqueue Task                         │ Read Results
┌──────────▼──────────┐               ┌──────────▼──────────────┐
│    CELERY WORKER    │               │       MONGODB           │
│   assess_task.py    │               │  assessments collection │
│                     │               │  2dsphere geo index     │
│  KiranaIQPipeline   │               │  officer_id index       │
│  Vision→Geo→Fraud   │               └─────────────────────────┘
│  →Fusion→Loan       │
└──────────┬──────────┘               ┌─────────────────────────┐
           │                          │         REDIS           │
┌──────────▼──────────┐               │  Task broker + backend  │
│   GROQ VISION API   │               │  Geo cache (6h TTL)     │
│   OSM / OVERPASS    │               └─────────────────────────┘
│   AWS S3 / Local    │
└─────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, Vite, TypeScript, Tailwind | NBFC officer UI |
| API | FastAPI 0.111, Python 3.11 | REST gateway + auth |
| Task Queue | Celery 5.3, Redis 7 | Async pipeline execution |
| Vision AI | Groq (Llama 3.2 Vision) | Shelf analysis |
| Geo | OSM Overpass API | Footfall, competition, catchment |
| Database | MongoDB 7 (Motor async) | Document store + geo queries |
| Cache | Redis 7 | Geo query caching |
| Storage | AWS S3 / Local | Image and video storage |
| Auth | JWT (python-jose) + bcrypt | Officer authentication |
| PDF Export | ReportLab | Credit memo generation |

---

## Project Structure

```
kiranaiq/
├── frontend/                   # React + Vite (TypeScript)
│   └── src/
│       ├── api/                # Axios client + typed API calls
│       ├── components/         # ImageUploadZone, PipelineTracker, etc.
│       ├── pages/              # Login, Dashboard, NewAssessment, Results
│       ├── store/              # Zustand (auth + assessment state)
│       └── utils/              # Currency formatting, PDF export
│
├── backend/                    # Python FastAPI
│   ├── app/
│   │   ├── api/v1/             # assess.py · auth.py · history.py
│   │   ├── db/                 # mongo.py · redis.py · repositories/
│   │   ├── models/             # Pydantic schemas
│   │   ├── services/           # auth_service · storage_service
│   │   └── tasks/              # Celery app + assess_task
│   ├── scripts/
│   │   └── seed_demo.py        # One-command demo data seeder
│   └── tests/
│       └── test_all.py         # 39-test suite (unit + integration)
│
├── ai_pipeline/                # Pure Python AI modules
│   ├── vision/                 # groq_client · shelf_analyzer · multi_image_merger
│   ├── geo/                    # footfall_scorer · competition_mapper · catchment_analyzer
│   ├── fraud/                  # cross_signal_validator (5 tripwires)
│   ├── fusion/                 # sales_estimator · uncertainty_engine · feature_attributor
│   ├── loan/                   # loan_sizer
│   ├── benchmarking/           # peer_comparator
│   └── pipeline.py             # Master orchestrator
│
└── docker-compose.yml          # Full stack: backend + worker + mongo + redis
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- A [Groq API key](https://console.groq.com) (free tier sufficient)

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/kiranaiq.git
cd kiranaiq
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
GROQ_API_KEY=gsk_your_key_here
JWT_SECRET=your-secure-random-string-minimum-32-chars
MONGO_URI=mongodb://mongo:27017/kiranaiq
REDIS_URL=redis://redis:6379/0
```

### 2. Start the Stack

```bash
docker-compose up --build
```

This starts: FastAPI backend (port 8000), Celery worker (2 concurrent), MongoDB 7, Redis 7.

### 3. Seed Demo Data

```bash
docker-compose exec backend python scripts/seed_demo.py
```

Creates a demo NBFC officer account and a completed assessment with realistic mock results.

### 4. Explore the API

Open [http://localhost:8000/docs](http://localhost:8000/docs) — Swagger UI with all endpoints.

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@kiranaiq.in", "password": "demo1234"}'

# Submit assessment (3–5 images required)
curl -X POST http://localhost:8000/api/v1/assess/ \
  -H "Authorization: Bearer <token>" \
  -F "images=@shop_front.jpg" \
  -F "images=@shelf_1.jpg" \
  -F "images=@counter.jpg" \
  -F "lat=28.6562" \
  -F "lng=77.2310"
```

---

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/test_all.py -v -s
```

The test suite covers **39 tests** across 9 test classes:

| Class | Tests | Type |
|-------|-------|------|
| `TestProductDetector` | 4 | Unit |
| `TestSalesEstimator` | 5 | Unit |
| `TestUncertaintyEngine` | 5 | Unit |
| `TestFraudValidator` | 6 | Unit |
| `TestLoanSizer` | 4 | Unit |
| `TestFeatureAttributor` | 3 | Unit |
| `TestMultiImageMerger` | 4 | Unit |
| `TestAuthService` | 3 | Unit |
| `TestGroqVision` | 1 | Integration (needs `GROQ_API_KEY`) |
| `TestOverpassGeo` | 2 | Integration (needs internet) |
| `TestPipelineSmoke` | 1 | Full pipeline (mocked I/O) |

Integration tests are skipped automatically if the required API keys are not set.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Login → JWT token |

### Assessment

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/assess/` | Submit images + metadata → queued |
| `GET` | `/api/v1/assess/{id}/status` | Live pipeline stage progress |
| `GET` | `/api/v1/assess/{id}` | Full result document |

### History

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/assessments/?page=1&limit=20` | Paginated officer history |

**Assessment Request** (multipart/form-data):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | File[] | ✅ (3–5) | Store images: interior, counter, exterior |
| `lat` | float | ✅ | Store latitude |
| `lng` | float | ✅ | Store longitude |
| `store_address` | string | — | Human-readable address |
| `shop_size_sqft` | float | — | Floor area (improves estimate) |
| `years_in_operation` | int | — | Store age (stability boost) |
| `monthly_rent` | float | — | Used in income calculation |
| `video` | File | — | Optional walkthrough video |

**Assessment Response** (completed):
```json
{
  "assessment_id": "uuid",
  "status": "completed",
  "recommendation": "approve | needs_verification | reject",
  "daily_sales_range": [7200, 10800],
  "monthly_revenue_range": [187200, 280800],
  "monthly_income_range": [26208, 39312],
  "confidence_score": 0.74,
  "shelf_density_index": 0.78,
  "geo_footfall_score": 72.0,
  "competition_index": 0.4,
  "risk_flags": [],
  "feature_attribution": [...],
  "peer_benchmark": { "percentile": 68.0, "n_peers": 12 },
  "loan_suggestion": {
    "min_loan": 210000,
    "max_loan": 315000,
    "suggested_tenure_months": 18,
    "monthly_emi_range": [13200, 19800],
    "foir_used": 0.45,
    "interest_rate_pa": 0.18
  }
}
```

---

## Key Design Decisions

**Why Groq instead of OpenAI Vision?**
Groq's LPU inference delivers ~10× lower latency at comparable quality for structured extraction tasks. For a field officer waiting on-site, response time matters enormously.

**Why OSM/Overpass instead of Google Maps?**
Zero cost at any scale. Overpass returns richer POI data for Indian cities than the Places API free tier. Results are cached in Redis so production load doesn't exceed rate limits.

**Why three estimation paths?**
Each path corrects the other's blind spots. The working capital path is accurate for well-stocked stores but fails on new inventory. The geo path is accurate for established markets but wrong for niche neighbourhoods. The size path anchors both. Weighted fusion is more robust than any single path.

**Why MongoDB over PostgreSQL?**
Assessment results are deeply nested, schema-free JSON documents. The `2dsphere` geo index for peer benchmarking is native. Schema flexibility lets the AI pipeline add new fields as the model evolves — no migrations.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017/kiranaiq` | MongoDB connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string |
| `GROQ_API_KEY` | — | **Required** for vision analysis |
| `JWT_SECRET` | `dev-secret-...` | **Change in production** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | 8-hour officer sessions |
| `STORAGE_BACKEND` | `local` | `local` or `s3` |
| `AWS_BUCKET` | `kiranaiq-images` | S3 bucket (production) |
| `AWS_REGION` | `ap-south-1` | AWS region |

---

## Production Deployment Notes

1. **JWT Secret** — Generate a cryptographically random secret: `openssl rand -hex 32`
2. **MongoDB Indexes** — Created automatically on startup. Ensure Atlas M10+ for `2dsphere` performance.
3. **Celery Concurrency** — Set `--concurrency` to match your Groq API rate limit (default: 2).
4. **Redis Persistence** — Use `appendonly yes` in Redis config to survive worker restarts.
5. **Image Storage** — Set `STORAGE_BACKEND=s3` and configure AWS credentials for production.
6. **CORS** — Update `allow_origins` in `main.py` to your production frontend domain.

---

## Benchmarks

Calibrated against **BCG India Kirana Report 2022**:

| Metric | Typical Kirana | KiranaIQ Estimate |
|--------|---------------|-------------------|
| Daily revenue | ₹5,000–₹15,000 | Within ±25% (±15% with strong signals) |
| Net margin | 8–15% | Category-mix adjusted (8–15%) |
| Inventory turnover | 8–12 days | 10–17 days (category weighted) |
| FOIR for micro-lending | 0.40–0.50 | 0.45 (fixed, NBFC standard) |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Write tests for new AI pipeline components in `backend/tests/test_all.py`
4. Ensure the full test suite passes: `pytest tests/test_all.py -v`
5. Open a pull request with a clear description of the change

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for Problem Statement C — AI-Powered Estimation Portal**

*KiranaIQ · Hackathon Submission · Confidential*

</div>
