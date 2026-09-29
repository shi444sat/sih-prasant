# PROJECT DRISHTI: Infrastructure Project Intelligence & Early Warning System

**SIH Problem Code:** SIH26103  
**Organization:** Ministry of Statistics and Programme Implementation (MoSPI)  
**Division:** Data Informatics & Innovation Division (DIID)  
**Category:** Software  
**Theme:** Smart Automation  

> **Data Integrity Notice**: This is a working prototype developed for the Smart India Hackathon (SIH). All demonstrated records belong to the **Synthetic Demonstration Dataset**. Prototype analytical definitions, risk weights, and thresholds represent a configurable prototype policy — not an official government threshold.

---

## 🎯 The Core Philosophy

Traditional infrastructure monitoring only explains **what has happened in the past**.  
**PROJECT DRISHTI** answers:
1. **WHAT is happening right now?**
2. **WHAT is likely to happen next?**
3. **WHY is the project at risk?**
4. **WHICH projects should be reviewed first?**
5. **WHAT evidence supports the warning?**

```
DATA ──▶ INDICATORS ──▶ PREDICTION ──▶ EXPLANATION ──▶ EARLY WARNING ──▶ HUMAN ACTION
```

---

## 🏛️ Application Architecture

```
CSV / Excel Ingestion / Future PAIMANA API
                 ↓
      FastAPI Validation Engine
                 ↓
       PostgreSQL / SQLite Database
                 ↓
     Feature Engineering (Pandas / NumPy)
                 ↓
 Statistical Heuristic Baseline vs Supervised ML
                 ↓
  Configurable Composite Risk Engine (0-100)
                 ↓
   Explainability Layer (Signal Drivers)
                 ↓
   Early Warning Engine (Prioritized Alerts)
                 ↓
Next.js 14 Responsive Government Analytics UI
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Docker & Docker Compose (optional for containerized deployment)

### 1. Backend Setup
```bash
cd backend

# Create virtualenv (optional) & install dependencies
pip install -r requirements.txt
pip install pydantic-settings

# Start FastAPI server (Automatically creates SQLite tables & seeds 63 demo projects on startup)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- Interactive Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Backend Health Check: [http://localhost:8000/](http://localhost:8000/)

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies (already prepared)
npm install

# Start development or production server
npm run dev    # dev server at http://localhost:3000
# or
npm run build && npm start
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Compose Deployment

To build and run all services (PostgreSQL + FastAPI Backend + Next.js Frontend) in unified containers:

```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 🔑 Demo Personas & Credentials

The platform implements Role-Based Access Control (RBAC):

| Role | Email | Password | Scope & Responsibilities |
|---|---|---|---|
| **Admin** | `admin@drishti.local` | `admin123` | Full policy weights configuration, threshold editing, user role governance, audit logs |
| **Officer** | `officer@drishti.local` | `officer123` | Project review, early warning acknowledgement, mitigation resolution |
| **Analyst** | `analyst@drishti.local` | `analyst123` | ML model evaluation, training execution, benchmarking against sector peers |
| **Executive** | `executive@drishti.local` | `executive123` | High-level portfolio KPI cards, status distributions, macro cost trends |

---

## 📊 Application Pages Overview

1. **`/login`** — Government-style login with quick demo persona selection.
2. **`/dashboard`** — Executive command center: dynamic KPIs, risk distributions, 12-month progress velocity trends, Top 10 review queue.
3. **`/projects`** — Project Explorer with multi-column sorting, pagination, and filters.
4. **`/projects/[id]`** — Deep project intelligence page with 6 Recharts, explainable risk drivers, milestones timeline, and one-click PDF export.
5. **`/risk-heatmap`** — 2D risk quadrant: Time Overrun Risk vs Cost Overrun Risk. Bubble radius represents Overall Risk.
6. **`/alerts`** — Early Warning Alert Center with human action tracking (Acknowledge and Resolve).
7. **`/analytics`** — Macro portfolio analytics, cost escalation trends, and bottleneck frequencies.
8. **`/benchmarking`** — Compare projects against sector medians and peer cohorts with variance indicators.
9. **`/model-evaluation`** — Transparent model performance table comparing Baseline vs Logistic Regression, Ridge, Random Forest, XGBoost with a "TRAIN MODELS" action.
10. **`/data-import`** — Ingestion gateway supporting CSV and Excel (.xlsx) validation, preview, and automatic signal recalculation.
11. **`/admin`** — Governance console for configuring risk weights and threshold cutoffs.
12. **`/reports`** — Project report repository for instant PDF report generation using ReportLab.

---

## 🧪 Testing

Run the automated backend test suite:

```bash
python -m pytest
```

Included test suites:
- `backend/tests/test_features.py`: Feature engineering bounds and zero-NaN validation.
- `backend/tests/test_risk_engine.py`: Composite risk score normalization (0-100) and threshold bands.
- `backend/tests/test_pipeline_e2e.py`: End-to-end integration: Database seeding → Feature calculation → ML training → Risk prediction → Driver generation → Alert creation → Human acknowledgement → PDF Report generation.
- `backend/tests/test_api_endpoints.py`: FastAPI endpoints health, auth, dashboard, projects, alerts, and model evaluation.

---

## 📄 License & SIH Attribution
Developed for Smart India Hackathon 2024 / MoSPI DIID under open-source MIT guidelines.
