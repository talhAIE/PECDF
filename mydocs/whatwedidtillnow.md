# PECDF Backend — What We Built

**Project:** Pakistan Export Demand Forecasting System (FYP)
**Stack:** Python 3.14 · FastAPI · SQLite/SQLAlchemy · XGBoost · LangGraph · Groq API
**Status as of 2026-05-07:** Backend complete and tested end-to-end

---

## ML Foundation (Pre-existing — Jupyter Notebooks)

Four notebooks produced the trained model before backend work began:

| Notebook | Purpose | Output |
|----------|---------|--------|
| 01_data_ingestion | Load 13 CSV files, merge into panel dataset | `master_df.csv` (1860 rows) |
| 02_eda | Exploratory analysis, seasonality plots | — |
| 03_modeling | XGBoost panel regression, hyperparameter tuning | `xgb_model.pkl`, MAPE 20.41%, R² 0.9482 |
| 04_evaluation | Per-commodity MAPE, confidence bands | Model metadata |

**10 Commodities tracked (HS codes):**
- 1006 Rice · 1207 Oil Seeds · 2523 Cement · 5205 Cotton Yarn
- 6110 Winter Wear · 6203 Mens Suits · 6302 Bed Linens
- 7403 Copper · 9018 Medical Instruments · 9506 Sports Goods

**3 Macro drivers:** USD/PKR exchange rate · Brent crude oil price · US Consumer Confidence Index

---

## Module 1 — Environment Setup

- Python venv created, `requirements.txt` installed
- FastAPI, SQLAlchemy, XGBoost, LangGraph, LangChain, Groq client, python-jose, argon2-cffi
- `.env` file configured with JWT secret, Groq API key, DB path, model paths
- Key fix: pydantic-settings v2 requires `ALLOWED_ORIGINS=["url1","url2"]` (JSON array format)

---

## Module 2 — Database Layer

**File:** `database/connection.py` — SQLAlchemy engine, `SessionLocal`, `Base`, `get_db()` dependency

**File:** `database/models.py` — 8 ORM tables (SQLAlchemy 2.0 `Mapped[]` syntax):

| Table | Purpose |
|-------|---------|
| `users` | Auth — id (UUID), email (unique), hashed_password, full_name, is_active, created_at, last_login |
| `agent_sessions` | Chat session — id (UUID), user_id, macro context, created/updated at |
| `agent_messages` | Per-message — session_id (FK cascade), role, content, tools_used (JSON) |
| `forecasts` | Forecast cache header — hs_code, macro snapshot |
| `forecast_results` | Month-by-month predictions linked to forecast |
| `scenarios` | Scenario run header |
| `scenario_results` | Variable sweep data points |
| `reports` | Generated report text, word count, scope/horizon/tone |

**File:** `database/crud.py` — All DB operations: users, sessions, messages, forecasts, scenarios, reports

---

## Module 3 — Authentication

**File:** `middleware/auth.py`

- `hash_password()` — Argon2 hashing (argon2-cffi)
- `verify_password()` — Argon2 verification
- `create_access_token()` — HS256 JWT, configurable expiry
- `get_current_user()` — FastAPI dependency, decodes JWT, returns `{user_id, email}`

**File:** `routers/auth.py` — 4 endpoints:

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | No | Create account, return JWT |
| POST | `/auth/login` | No | Verify credentials, return JWT |
| GET | `/auth/me` | Yes | Return user profile |
| GET | `/auth/verify` | Yes | Token validity check |

---

## Module 4 — Schemas (Pydantic)

**`schemas/common.py`** — `MacroInputs` (usd_pkr 200–500, brent_oil 20–200, us_confidence 50–150)

**`schemas/auth.py`** — `RegisterRequest`, `LoginRequest`, `TokenResponse`, `UserResponse`

**`schemas/forecast.py`** — `SingleForecastRequest/Response`, `MultiHorizonRequest/Response`, `AllCommoditiesRequest/Response`

**`schemas/scenario.py`** — `SingleVariableRequest/Response`, `MultiVariableRequest/Response`

**`schemas/analytics.py`** — `SeasonalityResponse`, `MomentumResponse`, `HistoricalResponse`, `CurrencySensitivityResponse`

**`schemas/agent.py`** — `ChatRequest/Response`, `ReportRequest/Response`, `SessionHistoryResponse`, `MessageItem`

---

## Module 5 — Services (Business Logic)

### `services/forecast_service.py`
- `make_prediction()` — builds feature row, applies HS categorical encoding, calls `model.predict()`, clamps ≥ 0
- `forecast_n_months()` — recursive multi-step: each month's prediction feeds as lag into the next
- `forecast_all_commodities()` — all 10 commodities for a target month, sorted by predicted value with ranks
- Confidence bands: ±5% month 1, growing by 20% per step (uncertainty growth list)

### `services/scenario_service.py`
- `run_single_variable_scenario()` — sweeps one macro variable (pkr/oil/conf) across a range using `np.linspace`, computes slope via `polyfit`, labels sensitivity (High/Medium/Low)
- `run_multi_variable_scenario()` — PKR × Oil matrix (5×5 grid), returns best/worst cell

### `services/analytics_service.py`
- `get_seasonality()` — monthly averages from historical data, peak/trough month, seasonality strength %
- `get_momentum()` — 3-month and 6-month % change for all commodities, direction label
- `get_historical()` — last N months of actual export data
- `get_currency_sensitivity()` — ranks all commodities by sensitivity to PKR change

### `services/report_service.py`
- `generate_report()` — calls Groq API (`llama-3.3-70b-versatile`) with structured analyst prompt, returns markdown report text
- Scope options: `single` (one commodity), `top5`, `full` (all 10)

---

## Module 6 — Routers (27 endpoints total)

### `routers/auth.py` (4 endpoints — covered above)

### `routers/forecast.py` (4 endpoints — JWT required)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/forecast/single` | One commodity, one month |
| POST | `/forecast/multi-horizon` | One commodity, N months recursive |
| POST | `/forecast/all-commodities` | All 10 commodities, one month |
| GET | `/forecast/commodities` | List all commodity HS codes and names |

### `routers/scenario.py` (2 endpoints — JWT required)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/scenario/single-variable` | Vary one macro across a range |
| POST | `/scenario/multi-variable` | PKR × Oil matrix |

### `routers/analytics.py` (7 endpoints — PUBLIC, no auth)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/seasonality/{hs_code}` | Seasonal pattern for one commodity |
| GET | `/seasonality` | All 10 commodities |
| GET | `/momentum` | 3M/6M momentum for all |
| GET | `/momentum/{hs_code}` | Single commodity momentum |
| GET | `/historical/{hs_code}` | Last N months actual data |
| GET | `/sensitivity/currency` | PKR sensitivity ranking |
| GET | `/sensitivity/currency/{hs_code}` | Single commodity PKR sensitivity |

### `routers/agent.py` (4 endpoints — JWT required)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/agent/chat` | Send message to AI agent |
| GET | `/agent/sessions/{id}` | Get conversation history |
| DELETE | `/agent/sessions/{id}` | Clear session |
| POST | `/agent/report` | Generate AI-written report |

---

## Module 7 — App Entry Point

**File:** `app.py`

- Lifespan: `Base.metadata.create_all(engine)` (auto-creates DB tables) + `load_artifacts()` (loads XGBoost model)
- `CORSMiddleware` — configurable origins from `.env`
- Request timing middleware — adds `X-Process-Time` header to every response
- Global exception handler — catches unhandled errors, returns clean JSON
- All 5 routers mounted
- `GET /` — welcome message
- `GET /health` — model status, MAPE, R², dataset rows
- `GET /commodities` — all 10 HS codes with names

---

## Module 8 — AI Agent

**File:** `agent/prompts.py`
- `build_system_prompt()` — injects live model metrics (MAPE, R²), macro conditions, per-commodity confidence levels, and strict behavior rules (always call tools, quote values in $M, caveat Oil Seeds)

**File:** `agent/tools.py`
- Factory `get_tools(bearer_token, macro_pkr, macro_oil, macro_conf)` — bakes token and macro into closures
- 8 tools: `forecast_commodity`, `forecast_all_commodities`, `run_scenario`, `get_seasonality`, `get_momentum`, `get_historical`, `get_currency_sensitivity`, `compare_commodities`
- Each tool hits the local FastAPI endpoints — agent uses the same routes as any frontend client

**File:** `agent/memory.py`
- Single shared `MemorySaver` (LangGraph) — per-session isolation via `thread_id`
- `get_checkpointer()`, `register_session()`, `clear_memory()`

**File:** `agent/setup.py`
- `get_or_create_agent()` — builds `ChatGroq` LLM + tools + system prompt, calls `create_react_agent` (LangGraph prebuilt), caches compiled graph per session
- `invoke_agent()` — sends message, extracts `AIMessage` content and `ToolMessage` names from result
- `clear_session()` — removes from cache and clears MemorySaver

**Key fixes applied:**
- LangChain 1.2.17 dropped old `AgentExecutor` API — rewrote to `langgraph.prebuilt.create_react_agent`
- Tool closure pattern solves bearer token injection without exposing it as an LLM parameter

---

## Confirmed Working (End-to-End Test Results)

| Test | Result |
|------|--------|
| Register new user | ✅ |
| Login + receive JWT | ✅ |
| Forecast: single commodity, multi-month | ✅ |
| Forecast: all commodities ranked | ✅ |
| Scenario: single variable sweep | ✅ |
| Analytics: seasonality, momentum, historical, currency sensitivity | ✅ |
| Agent Turn 1 — momentum question → `get_momentum` tool | ✅ |
| Agent Turn 2 — forecast follow-up with session_id → `forecast_commodity` tool | ✅ |
| Agent Turn 3 — scenario question → `run_scenario` tool | ✅ |
| Session history — 6 messages persisted correctly | ✅ |
| Health check — model loaded, MAPE 20.41%, R² 0.9482 | ✅ |

---

## What's Next — Frontend

The backend is complete. Next phase is the React frontend:

1. **Project setup** — Vite + React + TypeScript, TailwindCSS, React Router, Axios
2. **Auth pages** — Login, Register (call `/auth/login`, `/auth/register`)
3. **Dashboard** — `/health` data, commodity overview cards
4. **Forecast page** — commodity selector, macro inputs, chart (Recharts)
5. **Scenario page** — single-variable sweep chart, multi-variable heatmap
6. **Analytics page** — seasonality bar chart, momentum table, historical line chart
7. **Agent chat page** — chat UI, session management, tool call display
8. **Report page** — scope/horizon/tone selector, rendered markdown report
9. **Deployment** — serve frontend via Vite build, keep FastAPI on port 8000
