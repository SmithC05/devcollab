# Engineering Decision Twin

> **Hackathon prototype** — simulates the downstream consequences of engineering task ownership changes and recommends the least-disruptive intervention.

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | React · Vite · JavaScript · Tailwind CSS        |
| Backend  | Python · Django 6 · Django REST Framework       |
| Database | SQLite (dev) · PostgreSQL-ready (prod)          |
| ML       | pandas · numpy · scikit-learn · XGBoost         |

---

## Project Structure

```
engineering-decision-twin/
├── frontend/          # React + Vite SPA
├── backend/           # Django API
│   ├── apps/          # Django apps (projects, developers, tasks, simulations, scenarios)
│   ├── engine/        # Future: graph, context, prediction, interventions, optimization
│   ├── ml/            # Future: datasets, models, training, inference
│   └── config/        # Django project settings & URL root
├── data/
│   └── seed/          # Future: seed data files
├── .env.example
└── README.md
```

---

## Prerequisites

- Python ≥ 3.11
- Node.js ≥ 20

---

## Quick Start

### 1 — Clone & configure environment

```bash
git clone <repo-url>
cd engineering-decision-twin
cp .env.example .env
# Edit .env if needed (defaults work out of the box for local dev)
```

### 2 — Backend

```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
cd backend
python manage.py migrate

# Start development server (port 8000)
python manage.py runserver
```

Health check: <http://localhost:8000/api/health/>

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: <http://localhost:5173>

---

## API Endpoints

| Method | Path          | Description              |
|--------|---------------|--------------------------|
| GET    | /api/health/  | Backend liveness check   |

---

## Environment Variables

See [`.env.example`](.env.example) for all available variables.

| Variable               | Default                              | Description                                  |
|------------------------|--------------------------------------|----------------------------------------------|
| `DJANGO_SECRET_KEY`    | _(insecure default)_                 | Django secret key — **change in production** |
| `DJANGO_DEBUG`         | `True`                               | Debug mode                                   |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1`                | Comma-separated allowed hosts                |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,...`          | Frontend origins allowed to call the API     |
| `DATABASE_URL`         | _(empty → SQLite)_                   | PostgreSQL URL for staging/production        |
| `VITE_API_BASE_URL`    | `http://localhost:8000`              | Backend base URL seen by the React app       |

---

## Architecture Notes

- **Thin views**: Django views return data only. Business logic lives in `engine/`.
- **ML in-process**: ML code lives in `backend/ml/` — no separate microservice.
- **No auth yet**: Authentication will be added in a later iteration.
- **PostgreSQL-ready**: Set `DATABASE_URL` to a Postgres URL and restart — no code changes needed.
