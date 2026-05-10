# PECDF — Pakistan Export Demand Forecasting System

End-to-end system that forecasts **monthly export value (USD)** for **10 key Pakistan commodities** using a trained **XGBoost** panel model, exposes **REST APIs** (forecasts, scenarios, analytics), and ships a **React** dashboard with an **AI export analyst** (chat + reports).

---

## What’s in this repo

| Area | Description |
|------|-------------|
| **`Data/`** | Master panel dataset `Master_FYP_Dataset.csv` and source CSVs (required for training context; backend loads the master file at startup). |
| **`Models/`** | `xgboost_champion.pkl` — serialized model + metadata (required for API predictions). |
| **`Notebooks/`** | Jupyter pipeline: data engineering, training, inference sandbox. |
| **`backend/`** | FastAPI app: auth (JWT), forecasts, scenarios, analytics, agent chat, reports, live macro helpers. |
| **`frontend/`** | Vite + React UI: dashboard, forecast center, scenarios, commodity explorer, AI analyst, reports. |

---

## Prerequisites

- **Python** 3.12+ recommended (3.14 works per project notes; use 3.12 if you hit wheel issues for some packages).
- **Node.js** 20+ (for the frontend).
- **Git** (optional).

You must have these files present before the backend can start:

- `Data/Master_FYP_Dataset.csv`
- `Models/xgboost_champion.pkl`

Paths are resolved **relative to the `backend/` directory** (see `backend/config.py`).

---

## Quick start (local development)

Run **backend** and **frontend** in two terminals.

### 1. Backend (FastAPI)

From the **repository root** (`PECDF/`):

```bash
cd backend
python -m venv .venv
```

**Windows (PowerShell):**

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux:**

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

Create **`backend/.env`** (copy the example below and fill in values). At minimum, set a strong `JWT_SECRET` and at least one LLM key if you use **AI Analyst** or **Report Generator**.

Start the API (run from **`backend/`** so model paths resolve correctly):

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive API docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health check:** [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend (Vite + React)

From the repository root:

```bash
cd frontend
npm install
```

Create **`frontend/.env`** (or `.env.local`):

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (default Vite port; see `frontend/vite.config.js`).

**First-time use:** register a user on `/register`, then sign in. Protected pages (dashboard, forecast, analyst, etc.) require a valid JWT.

### Optional: dev proxy instead of direct API URL

`vite.config.js` defines a proxy: requests to `/api` are forwarded to `http://localhost:8000` with the `/api` prefix stripped. If you prefer that, set:

```env
VITE_API_BASE_URL=/api
```

---

## Environment variables

### Backend — `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Yes** (production) | Secret for signing JWTs. Change the default for any shared or deployed environment. |
| `DATABASE_URL` | No | Default: `sqlite:///./pecdf.db` (file created under `backend/`). |
| `ALLOWED_ORIGINS` | No | JSON array of CORS origins, e.g. `["http://localhost:5173"]`. Default includes common local dev ports. |
| `MODEL_PATH` | No | Default: `../Models/xgboost_champion.pkl` |
| `MASTER_DATA_PATH` | No | Default: `../Data/Master_FYP_Dataset.csv` |
| `GROQ_API_KEY` | For AI features | Groq API key. |
| `OPENAI_API_KEY` | For AI features | OpenAI API key. |
| `AGENT_LLM_PROVIDER` | No | `auto` (default), `groq`, or `openai`. With `auto`, if both keys are set, OpenAI is preferred unless you force `groq`. |
| `AGENT_MODEL` | No | Groq model id (default: `llama-3.3-70b-versatile`). |
| `OPENAI_MODEL` | No | OpenAI model id (default: `gpt-4o-mini`). |
| `FRED_API_KEY` | No | Enables live US confidence / FRED-backed macro when set. |

Minimal example:

```env
JWT_SECRET=your-long-random-secret-here
GROQ_API_KEY=your-groq-key
```

### Frontend — `frontend/.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL of the FastAPI server, e.g. `http://localhost:8000` or `/api` with Vite proxy. |

---

## Production build (frontend)

```bash
cd frontend
npm run build
npm run preview
```

Serve the `frontend/dist` folder with any static host and point `VITE_API_BASE_URL` at your deployed API (rebuild after changing env vars).

---

## Machine learning pipeline (notebooks)

For the full offline ML workflow (data merge → training → inference experiments), use a dedicated environment and the **root** `requirements.txt` (includes Jupyter and optional CatBoost/LightGBM):

```bash
python -m venv .venv-ml
source .venv-ml/bin/activate   # or Windows equivalent
pip install -r requirements.txt
```

Then open the notebooks under `Notebooks/`. TensorFlow / LSTM is optional and may require Python ≤3.12 — see comments in root `requirements.txt`.

---

## Troubleshooting

- **`model_loaded: false` or startup errors loading pickle** — Run `uvicorn` from **`backend/`** and confirm `Models/xgboost_champion.pkl` exists relative to repo root (`../Models/...` from `backend/`).
- **401 on forecast/agent routes** — Log in again; JWT is stored as `pecdf_token` and sent via Axios (`frontend/src/api/client.js`).
- **CORS errors** — Add your frontend origin to `ALLOWED_ORIGINS` in `backend/.env` as a JSON array.
- **Agent or report endpoints fail** — Ensure `GROQ_API_KEY` and/or `OPENAI_API_KEY` is set and `AGENT_LLM_PROVIDER` matches the key you intend to use.

---

## License & academic use

This project is suitable for academic / FYP demonstration. Adjust licensing and deployment secrets before any public production use.

---

## Further reading

- `projectdoc.md` — problem statement, data features, modeling strategy.
- `projectdocumentationandcurrentstate.md` — detailed dataset, API design, and UI specification.
- `backend/whatwedidtillnow.md` — backend implementation notes and endpoint summary.
