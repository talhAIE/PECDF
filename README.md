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
| `DATABASE_URL` | No | Default: `sqlite:///./pecdf.db`. For PostgreSQL, set a URL (see [Using PostgreSQL](#using-postgresql)). |
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

## Using PostgreSQL

The ORM is database-agnostic; `psycopg2-binary` is listed in `backend/requirements.txt`. Install dependencies, set **`DATABASE_URL`**, and start the app — tables are created on startup (`create_all`). **SQLite remains the default** when `DATABASE_URL` is unset.

### Local PostgreSQL (example)

1. Run Postgres (Docker example):

   ```bash
   docker run --name pecdf-pg -e POSTGRES_PASSWORD=pecdf -e POSTGRES_DB=pecdf -p 5432:5432 -d postgres:16
   ```

2. In **`backend/.env`**:

   ```env
   DATABASE_URL=postgresql://postgres:pecdf@localhost:5432/pecdf
   ```

3. Start the API from `backend/` as usual. Use a strong password in real environments.

### Hosted (e.g. Render’s own Postgres)

1. Create a **PostgreSQL** instance in the Render dashboard.
2. Copy the **internal** connection URL into the web service as **`DATABASE_URL`** (Render usually includes `sslmode=require` if needed).
3. If the URL starts with **`postgres://`**, you can paste it as-is — the backend normalizes it to **`postgresql://`** in `config.py`.

### Neon (recommended serverless Postgres — works for production)

[Neon](https://neon.tech) is managed PostgreSQL. You can use it as **`DATABASE_URL`** for local dev and for **Render production** exactly like any other Postgres URL.

1. Sign up at [https://neon.tech](https://neon.tech) → **Create project** (pick a region; ideally close to where [Render](https://render.com) runs your API).
2. Open your project → **Dashboard → Connection details**.
3. Copy the connection string for your default database (often labeled **URI**).
4. Prefer the **pooled** connection string if Neon shows two options (helps with connection limits); for a single always-on FastAPI dyno either pooled or direct usually works — if you hit “too many connections”, switch to pooled.
5. Ensure the URL includes TLS, e.g. `?sslmode=require` at the end (Neon normally includes this).
6. Put the full URI in **`backend/.env`** locally as `DATABASE_URL=...`, and the same value in **Render → Environment** for production (never commit secrets).

Your app already ships **`psycopg2-binary`**; no extra Neon-specific driver is required.

### Production checklist: Neon + Render (API) + Vercel (frontend)

Do steps **in this order** so URLs exist when you configure the next layer.

#### A — Neon (database)

| Step | Action |
|------|--------|
| 1 | Create project + database branch (Neon defaults are fine). |
| 2 | Copy **DATABASE_URL** (URI with password). Store it only in Neon / `.env` / Render env UI. |
| 3 | (Optional local test) Paste `DATABASE_URL` into **`backend/.env`**, run the API once from **`backend/`** — startup runs `create_all` and creates tables in Neon. |

#### B — Render (FastAPI backend)

| Step | Action |
|------|--------|
| 1 | Push code to GitHub/GitLab (**include** `Models/` and `Data/` in the deployed repo unless you serve them elsewhere). |
| 2 | **New → Web Service** → connect repo. **Root directory:** `backend`. |
| 3 | **Build:** `pip install -r requirements.txt` |
| 4 | **Start:** `uvicorn app:app --host 0.0.0.0 --port $PORT` |
| 5 | **Environment:** set **`DATABASE_URL`** = Neon URI (exact copy). Set **`JWT_SECRET`**, **`GROQ_API_KEY`** / **`OPENAI_API_KEY`**, **`MODEL_PATH`**, **`MASTER_DATA_PATH`** as needed. |
| 6 | **CORS:** set **`ALLOWED_ORIGINS`** to a JSON array with your production Vercel URL, e.g. `["https://your-project.vercel.app"]` (add `www` variants if you use them). Deploy and copy the public HTTPS API URL (`https://…onrender.com`). |

See **Deploying: Render (API) + Vercel (frontend)** later in this README for extra Render/Vercel details.

#### C — Vercel (frontend)

| Step | Action |
|------|--------|
| 1 | **New Project** → same repo, **root directory:** `frontend`. Framework: **Vite**. |
| 2 | **Environment variable:** `VITE_API_BASE_URL` = your Render API base URL, e.g. `https://pecdf-api.onrender.com` (no trailing slash). |
| 3 | Deploy. If the API URL or CORS changes, update Render `ALLOWED_ORIGINS` and redeploy both if needed. |

#### D — After deploy

- Open Vercel URL → **Register** a user (Neon DB is empty until you do).
- If you see **CORS** errors, `ALLOWED_ORIGINS` on Render must **exactly** match the browser origin (scheme + host, no path).
- Render free tier **cold starts** can delay the first request.

### Notes

- Existing **SQLite** files are not migrated automatically. For a fresh Postgres database, **register users again** or run your own export/import.
- If you want versioned schema changes later, add **Alembic** migrations instead of relying only on `create_all`.

---

## Production build (frontend)

```bash
cd frontend
npm run build
npm run preview
```

Serve the `frontend/dist` folder with any static host and point `VITE_API_BASE_URL` at your deployed API (rebuild after changing env vars).

---

## Deploying: Render (API) + Vercel (frontend)

### SQLite on Render — can you?

**Technically yes, but it is usually a bad default on Render.**

| Approach | What happens |
|----------|----------------|
| **SQLite file on the default disk** | The file **can be wiped** on redeploys, restarts, or when the instance cycles. You can **lose users, sessions, and chat history**. |
| **SQLite on a Render [Persistent Disk](https://render.com/docs/disks)** | Data survives restarts if the DB file lives on that mounted path. Works for **one** service instance; not ideal if you scale to multiple machines. |
| **Render PostgreSQL** (recommended) | Free/paid managed DB, safe for production. The app already supports Postgres via `DATABASE_URL` (see `backend/database/connection.py`). |

**Recommendation:** use **`DATABASE_URL` pointing at managed Postgres** — either **Neon**, **Render PostgreSQL**, or another host — not SQLite on ephemeral disk. Keep `Models/` and `Data/` in the deployed repo (or attach storage) so the API can load `xgboost_champion.pkl` and `Master_FYP_Dataset.csv`.

---

### 1. Render — Web Service (FastAPI)

1. Push the repo to GitHub/GitLab. The **model** (`Models/xgboost_champion.pkl`) and **dataset** (`Data/Master_FYP_Dataset.csv`) do not need to be huge; they just must exist in what Render builds from (normally the same repo), unless you mount storage and point `MODEL_PATH` / `MASTER_DATA_PATH` there.
2. In Render: **New → Web Service**, connect the repo.
3. Configure:
   - **Root directory:** `backend` *(or leave root and use commands below from repo root)*  
   - **Runtime:** Python  
   - **Build command:**  
     `pip install -r requirements.txt`  
     (if Root directory is `backend`)  
     OR from monorepo root: `cd backend` then `pip install -r requirements.txt` (PowerShell 5.x: use two lines or `cd backend; pip install ...` instead of `&&`).  
   - **Start command:**  
     `uvicorn app:app --host 0.0.0.0 --port $PORT`  
4. **Environment variables** (Render dashboard → Environment):

   | Key | Example / notes |
   |---|---|
   | `PYTHON_VERSION` | `3.12.8` (pin a version Render supports) |
   | `DATABASE_URL` | Postgres URL from Render Postgres, e.g. `postgresql://user:pass@hostname/dbname` |
   | `JWT_SECRET` | Long random string |
   | `MODEL_PATH` | `../Models/xgboost_champion.pkl` if app runs with cwd = `backend` |
   | `MASTER_DATA_PATH` | `../Data/Master_FYP_Dataset.csv` |
   | `ALLOWED_ORIGINS` | JSON array, e.g. `["https://your-app.vercel.app"]` |
   | `GROQ_API_KEY` / `OPENAI_API_KEY` | As needed for agent + reports |
   | `FRED_API_KEY` | Optional |

5. **Create a Render PostgreSQL** instance, copy the **internal** database URL into `DATABASE_URL` for the web service. On first deploy, tables are created from SQLAlchemy models (`create_all`).

6. Note your public API URL, e.g. `https://pecdf-api.onrender.com`.

**If you insist on SQLite on Render:** provision a **persistent disk**, mount it (e.g. `/var/data`), and set  
`DATABASE_URL=sqlite:////var/data/pecdf.db`  
(four slashes after `sqlite:` for an absolute path — adjust to match Render’s mount path in their docs).

---

### 2. Vercel — static frontend

1. **New Project →** import the same Git repo.
2. **Root directory:** `frontend`
3. **Framework preset:** Vite (or “Other” with `npm run build` and output `dist`).
4. **Environment variables (Production):**

   ```env
   VITE_API_BASE_URL=https://pecdf-api.onrender.com
   ```

   No trailing slash needed; must match your real Render hostname. **Redeploy** after changing this.

5. Deploy. Your site will be something like `https://pecdf.vercel.app`.

---

### 3. Connect the two (CORS + HTTPS)

- In Render, set `ALLOWED_ORIGINS` to include your **exact** Vercel URL(s), e.g.  
  `["https://your-project.vercel.app"]`  
  Add preview URLs too if you use Vercel preview deployments (or use a pattern / separate env per branch if you automate that).
- Use **HTTPS** everywhere (Render and Vercel do by default).
- If the browser shows CORS errors, the origin in `ALLOWED_ORIGINS` does not match (scheme, host, or path — paths are not part of origin, but **`www` vs non-`www`** must match).

---

### 4. Cold starts (Render free tier)

Free web services **spin down** when idle. First request can take **30–60+ seconds**. For demos, that is normal; for production, use a paid instance or a keep-alive ping (with care for ToS).

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
