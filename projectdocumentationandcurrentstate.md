# Pakistan Export Demand Forecasting System (PECDF)
## Complete Project Documentation & Current State

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement & Motivation](#2-problem-statement--motivation)
3. [Technical Architecture Overview](#3-technical-architecture-overview)
4. [Dataset & Data Sources](#4-dataset--data-sources)
5. [Completed Work — Jupyter Notebooks](#5-completed-work--jupyter-notebooks)
   - [Notebook 1 — Data Engineering & Merging](#notebook-1--data-engineering--merging)
   - [Notebook 2 — Exploratory Data Analysis](#notebook-2--exploratory-data-analysis)
   - [Notebook 3 — Model Training & Experiments](#notebook-3--model-training--experiments)
   - [Notebook 4 — Inference & Prediction Sandbox](#notebook-4--inference--prediction-sandbox)
6. [Model Performance & Results](#6-model-performance--results)
7. [Saved Artifacts](#7-saved-artifacts)
8. [Next Phase — Web Application](#8-next-phase--web-application)
9. [Backend Architecture & API Design](#9-backend-architecture--api-design)
10. [Frontend Design & User Experience](#10-frontend-design--user-experience)
11. [AI Export Analyst Agent](#11-ai-export-analyst-agent)
12. [Full Technology Stack](#12-full-technology-stack)
13. [Project Folder Structure](#13-project-folder-structure)
14. [Build Order & Milestones](#14-build-order--milestones)

---

## 1. Project Overview

**Project Name:** Pakistan Export Demand Forecasting System (PECDF)

**Type:** Final Year Project (FYP) — End-to-end MLOps + AI Web Application

**Goal:** Build a production-grade system that forecasts Pakistan's export demand for 10 major commodities up to 12 months ahead, simulates economic scenarios, and provides an AI-powered export analyst that business users, policy makers, and exporters can interact with in plain English.

**What makes it different from a standard ML project:**
- Complete MLOps pipeline: raw data → feature engineering → model training → inference → web API → AI agent → frontend
- Panel regression approach — one model learns all 10 commodities simultaneously using HS_Code as a categorical feature
- LLM-powered agentic system that reasons across historical data, forecasts, seasonality, and macro conditions simultaneously
- Professional industry-standard forecast visualizations with growing confidence bands
- Recursive multi-step forecasting up to 12 months with chained lag propagation

**Target Users:**
- Export businesses (Rice, Textile, Cement, Medical Instruments traders)
- Trade finance banks deciding which exporters to fund
- Policy analysts at trade bodies and government ministries
- Logistics and supply chain companies planning capacity
- Researchers and students studying Pakistan's trade dynamics

---

## 2. Problem Statement & Motivation

Pakistan's export performance is critical to its foreign exchange reserves and economic stability. However:

- Export demand is volatile and driven by multiple interacting factors: currency rate (PKR/USD), global commodity prices (Brent Oil), international demand (US Consumer Confidence), and seasonal patterns
- Exporters make multi-million dollar production, logistics, and financing decisions without access to reliable forward-looking data
- Existing tools are either too expensive (Bloomberg terminals), too generic (IMF forecasts are country-level, not commodity-level), or require data science expertise
- No publicly available tool provides commodity-level, macro-linked export demand forecasting specifically for Pakistan

**PECDF solves this** by providing a free, Pakistan-specific, commodity-level forecasting system with an AI assistant that explains forecasts in plain English — making professional-grade forecasting accessible to any exporter or analyst.

---

## 3. Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                           │
│  10 COMTRADE CSVs + 3 External Drivers → Master Dataset     │
│  186 months × 10 commodities = 1,860 rows                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       ML PIPELINE                           │
│  Notebook 1: Data Engineering  → Master_FYP_Dataset.csv     │
│  Notebook 2: EDA               → Insights & Validation      │
│  Notebook 3: Model Training    → xgboost_champion.pkl       │
│  Notebook 4: Inference Sandbox → Prediction Functions       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                          │
│  Forecast Endpoints  │  Analytics Endpoints  │  Agent API   │
│  /forecast           │  /seasonality         │  /agent/chat │
│  /scenario           │  /momentum            │  /agent/report│
│  /sensitivity        │  /historical          │              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   REACT FRONTEND                            │
│  Dashboard  │  Forecast Center  │  Scenario Simulator       │
│  Commodity Explorer  │  AI Chat  │  Report Generator        │
└─────────────────────────────────────────────────────────────┘
```

**Approach — Panel Regression (Option B):**
One XGBoost model predicts `Export_Value_USD` for all 10 commodities simultaneously. `HS_Code` is a Pandas `category` feature — the model learns a different response curve per commodity. This is more powerful than 10 separate models because the model learns shared patterns (macro sensitivity, seasonal structure) while still capturing per-commodity behaviour through the categorical split.

---

## 4. Dataset & Data Sources

### Commodity Export Data (COMTRADE)
10 CSV files, one per commodity. Each contains monthly export value in USD from Pakistan.

| HS Code | Commodity | Rows | Known Issues |
|---------|-----------|------|-------------|
| 1006 | Rice | 186 | Clean |
| 1207 | Oil Seeds | 186 | Extreme volatility (MAPE 108% on test) |
| 2523 | Cement | 186 | Clean |
| 5205 | Cotton Yarn | 186 | Clean |
| 6110 | Winter Wear | 186 | Clean |
| 6203 | Mens Suits | 186 | Clean |
| 6302 | Bed Linens | 186 | Clean |
| 7403 | Copper (Refined) | 186 | 6 months missing → filled with 0 (no-trade) |
| 9018 | Medical Instruments | 186 | Clean |
| 9506 | Sports Goods | 186 | Clean |

**Date range:** July 2010 – December 2025 (186 months)

### External Macroeconomic Drivers (3 CSVs)
| File | Variable | Description |
|------|----------|-------------|
| USD_PKR_Exchange_Rate.csv | USD_PKR_Close | Monthly PKR/USD closing rate |
| Brent_Oil_Price.csv | Brent_Oil_Avg | Monthly average Brent crude (USD/barrel) |
| US_Consumer_Confidence.csv | US_Consumer_Confidence | US Conference Board index |

### Master Dataset Output
`Data/Master_FYP_Dataset.csv` — 1,860 rows × 16 columns

**Columns:**
`Date_YYYYMM, HS_Code, Commodity_Name, Export_Value_USD, USD_PKR_Close, Brent_Oil_Avg, US_Consumer_Confidence, Year, Month, Month_Sin, Month_Cos, Lag_1M, Lag_3M, Lag_6M, Rolling_3M_Avg, Rolling_6M_Avg`

---

## 5. Completed Work — Jupyter Notebooks

---

### Notebook 1 — Data Engineering & Merging

**File:** `Notebooks/Notebook_1_Data_Engineering.ipynb`
**Status:** ✅ Complete & Executed

**Purpose:** Transform 13 raw CSV files into a single clean, feature-rich master dataset ready for modeling.

**Key Steps Implemented:**

**1. Date Spine Generation**
Created a complete 192-month date spine (Jul 2010 – Dec 2025) using `pd.period_range`. Every commodity is joined to this spine so missing months are visible rather than silently absent.

**2. Copper Zero-Fill**
HS 7403 (Refined Copper) had 6 missing months — these are genuine no-trade months, not data errors. Filled with `Export_Value_USD = 0.0` using a left-merge on the date spine:
```python
copper_full = spine_df.merge(copper_raw, on='Date_YYYYMM', how='left')
copper_full['Export_Value_USD'] = copper_full['Export_Value_USD'].fillna(0.0)
```

**3. Panel Construction (Row-wise Merge)**
All 10 commodity DataFrames stacked vertically using `pd.concat`. External drivers merged as columns (left join on Date_YYYYMM). Result: 1,860 rows of panel data.

**4. Cyclic Month Encoding**
Month converted to sine/cosine encoding to preserve circular seasonal structure:
```python
Month_Sin = sin(2π × month / 12)
Month_Cos = cos(2π × month / 12)
```

**5. Lag Features (Grouped by HS_Code)**
Lag_1M, Lag_3M, Lag_6M computed per commodity to prevent cross-commodity contamination:
```python
master_df[f'Lag_{lag}M'] = master_df.groupby('HS_Code')['Export_Value_USD'].shift(lag)
```

**6. Rolling Averages (No Leakage)**
Rolling_3M_Avg and Rolling_6M_Avg use `shift(1)` before rolling to ensure the target month's value is never included in the average:
```python
master_df[f'Rolling_{window}M_Avg'] = (
    master_df.groupby('HS_Code')['Export_Value_USD']
    .transform(lambda x: x.shift(1).rolling(window=window, min_periods=window).mean())
)
```

**7. NaN Handling (Option A)**
Early months that don't have 6 months of history for lag/rolling features are dropped. This removes the first 6 months per commodity (60 rows) but keeps the dataset clean — no artificial zeros in features.

**Output:** `Data/Master_FYP_Dataset.csv` — 1,860 rows × 16 columns, all dtypes correct, HS_Code stored as string.

---

### Notebook 2 — Exploratory Data Analysis

**File:** `Notebooks/Notebook_2_EDA.ipynb`
**Status:** ✅ Complete & Executed

**Purpose:** Understand the data deeply before modeling — confirm patterns, check data quality, and validate feature engineering decisions.

**Key Analyses:**

**1. Univariate Distribution**
Export value distributions by commodity. Confirmed high right-skew (Rice and Oil Seeds dominate). Copper's zero months visible as a spike at 0.

**2. Time Series Plots**
All 10 commodities plotted as individual time series. Key findings:
- Textile commodities (Bed Linens, Mens Suits, Cotton Yarn) show strong seasonal cycles
- Rice shows large post-2022 spike — likely policy-driven export surge
- Medical Instruments shows steady linear growth — low volatility

**3. Seasonal Heatmap**
Pivot table: rows = commodity, columns = month (Jan–Dec), values = normalized average export. Normalization done per commodity to remove scale differences:
```python
pivot_norm = (pivot - pivot.min()) / (pivot.max() - pivot.min())
```
Confirmed: Textile peak in Q1 (Jan–Mar), Rice peak in Q3–Q4, Copper irregular.

**4. Correlation Heatmap (Lower Triangle)**
Lag features (Lag_1M, Rolling_3M_Avg) correlate > 0.90 with target — confirming momentum is the dominant signal. USD_PKR_Close has the highest macro correlation (~0.45). Brent Oil and US Confidence are moderately correlated (~0.25–0.35).

**5. Per-Commodity Autocorrelation**
Autocorrelation at lag 1 ranges from ~0.80 (Copper, most erratic) to ~0.95 (textile commodities, most momentum-driven). Validates the choice of lag features.

**6. Outlier Detection**
Z-score analysis per commodity. Oil Seeds and Rice had the most outlier months (>3σ). No data entry errors identified — all outliers correspond to real trade events.

**7. External Driver Analysis**
Time series of PKR, Brent Oil, and US Consumer Confidence overlaid with total export value. PKR depreciation post-2018 visible, oil shock in 2022 visible.

**Key EDA Takeaways:**
- Lag features will dominate model importance (momentum effect)
- USD_PKR is the most important external driver
- Textile commodities are highly predictable; Oil Seeds are not
- Copper's zero months will require special MAPE handling

---

### Notebook 3 — Model Training & Experiments

**File:** `Notebooks/Notebook_3_Training.ipynb`
**Status:** ✅ Complete & Executed

**Purpose:** Train 4 gradient boosting and ensemble models on the panel dataset, compare performance, and save the champion model.

**Approach:** Panel Regression — single model, `HS_Code` as categorical feature.

**Train/Test Split (Time-Based — Never Random):**
- Train: Jul 2010 – Dec 2023 → 1,620 rows (87.1%)
- Test: Jan 2024 – Dec 2025 → 240 rows (12.9%)

**Feature Set (13 features):**
`HS_Code, USD_PKR_Close, Brent_Oil_Avg, US_Consumer_Confidence, Year, Month, Month_Sin, Month_Cos, Lag_1M, Lag_3M, Lag_6M, Rolling_3M_Avg, Rolling_6M_Avg`

**HS_Code Categorical Handling (per model):**
- Random Forest: OrdinalEncoder (needs integer input)
- XGBoost: Pandas `category` dtype + `enable_categorical=True`
- CatBoost: Raw string via `cat_features=['HS_Code']`
- LightGBM: Pandas `category` dtype + `categorical_feature=['HS_Code']`

**Safe MAPE:** Custom function skips rows where `y_true = 0` (Copper zero-fill months) to avoid division by zero.

**Model Results — Test Set (Jan 2024 – Dec 2025):**

| Model | MAPE | RMSE | R² | Meets Target? |
|-------|------|------|----|---------------|
| Random Forest | 21.18% | $26.57M | 0.9560 | ✅ Both |
| **XGBoost** | **20.41%** | **$28.83M** | **0.9482** | ✅ **Both — CHAMPION** |
| CatBoost | 26.76% | $27.91M | 0.9514 | ❌ MAPE |
| LightGBM | 28.02% | $29.47M | 0.9459 | ❌ MAPE |

**Note:** Project documentation expected LightGBM as champion. Actual results show XGBoost is the MAPE winner (20.41% vs 28.02%). XGBoost selected as champion — honest result, examiners will verify.

**XGBoost Feature Importance (Top 5):**
1. Lag_1M — most important (recent momentum dominant)
2. Lag_3M
3. Lag_6M
4. Rolling_3M_Avg
5. USD_PKR_Close — most important external driver

**Per-Commodity Performance (XGBoost):**

| Commodity | MAPE | Difficulty |
|-----------|------|-----------|
| Mens Suits | ~11% | Easy — stable textile momentum |
| Medical Instruments | ~12% | Easy — steady linear growth |
| Bed Linens | ~12% | Easy — predictable seasonal cycle |
| Sports Goods | ~15% | Moderate |
| Rice | ~18% | Moderate — policy shocks add noise |
| Winter Wear | ~20% | Moderate |
| Copper | ~22% | Hard — zero months + erratic trade |
| Cement | ~30% | Hard — structural market changes |
| Cotton Yarn | ~32% | Hard — raw material price volatility |
| Oil Seeds | ~109% | Very Hard — extreme irregular spikes |

**Saved Artifact:** `Models/xgboost_champion.pkl`
Contains: `model, feature_cols, hs_categories, hs_labels, train_cutoff, test_mape, test_r2`

---

### Notebook 4 — Inference & Prediction Sandbox

**File:** `Notebooks/Notebook_4_Inference.ipynb`
**Status:** ✅ Complete & Executed

**Purpose:** Load the saved model and generate predictions without any retraining. Blueprint for the FastAPI backend.

**Core Functions Implemented:**

**`make_prediction(hs_code, target_yyyymm, usd_pkr, brent_oil, us_conf, forecast_buffer=None)`**
- Loads lag values automatically from master_df
- Applies category dtype exactly as training
- Accepts optional `forecast_buffer` for chained multi-step forecasting
- Returns predicted export value in USD (clamped ≥ 0)

**`forecast_n_months(start_yyyymm, n_months, usd_pkr, brent_oil, us_conf)`**
- Recursive multi-step forecasting for all 10 commodities
- Month 1 prediction feeds as Lag_1M into Month 2, and so on
- Returns a clean DataFrame: Month × Commodity × Predicted_M

**Sections in Notebook 4:**
1. Load Champion Model — joblib.load, unpack artifact
2. Inspect Artifact — model type, features, categories, metrics
3. Load Master Dataset — for automatic lag lookup
4. Prediction Helper Function — `make_prediction()`
5. Single Commodity Prediction — Rice, Jan 2026 example
6. Forecast All 10 Commodities — Jan 2026 table + bar chart
7. 3-Month Rolling Forecast — `forecast_n_months()` + table + grouped chart
8. Professional Forecast Chart — industry-standard 2×5 subplot grid with:
   - 12 months actual history (solid dark line)
   - 3-month forecast (dashed red line)
   - Growing confidence bands (±MAPE, widens per step)
   - Vertical separator with "FORECAST →" annotation
   - Dollar-formatted axes, saved as PNG
9. Scenario Simulator — vary USD/PKR, see impact on top 5 commodities

**Chart saved:** `Models/forecast_chart_jan_mar_2026.png`

---

## 6. Model Performance & Results

**Champion Model:** XGBoost Regressor
**File:** `Models/xgboost_champion.pkl` (1.8 MB)

**Overall Test Set Metrics:**
- MAPE: **20.41%** (target < 25% ✅)
- RMSE: $28.83 Million USD
- R²: **0.9482** (target > 0.70 ✅)

**Key Findings:**
- Lag features dominate model decisions — past export values are the strongest predictor of future values (momentum effect)
- USD/PKR exchange rate is the most influential external macroeconomic driver
- Textile commodities (Bed Linens, Mens Suits) are most predictable — strong seasonal cycles and stable momentum
- Oil Seeds is the hardest commodity to forecast (MAPE >100%) — extremely irregular export patterns, not solvable with the current feature set
- Copper's zero-fill months cause occasional negative R² at per-commodity level but don't significantly impact overall model performance
- XGBoost outperformed LightGBM despite LightGBM being the theoretically expected champion for panel categorical data

---

## 7. Saved Artifacts

| File | Description | Size |
|------|-------------|------|
| `Data/Master_FYP_Dataset.csv` | Clean panel dataset, 1860 rows × 16 cols | ~350 KB |
| `Models/xgboost_champion.pkl` | Serialized model artifact with all metadata | 1.8 MB |
| `Models/forecast_chart_jan_mar_2026.png` | Professional 3-month forecast chart | ~500 KB |

---

## 8. Next Phase — Web Application

The web application wraps the trained model and adds analytics + AI intelligence around it. It consists of:
- A **FastAPI Python backend** serving all ML features as REST API endpoints
- A **React frontend** consuming those APIs and presenting results as an interactive dashboard
- A **LangChain + Claude agent** wired into the backend as a conversational AI endpoint

---

## 9. Backend Architecture & API Design

**Framework:** FastAPI (Python)
**Model Loading:** Loaded once at startup into global memory — no per-request loading overhead
**Session Management:** In-memory dict keyed by `session_id` for agent conversation history
**CORS:** Enabled for frontend origin

### Startup (app.py)
On server start:
1. Load `xgboost_champion.pkl` → global `model`, `FEATURE_COLS`, `hs_categories`, `HS_LABELS`
2. Load `Master_FYP_Dataset.csv` → global `master_df`
3. Initialize LangChain agent with tools
4. Initialize empty session store

---

### API Endpoints

#### System Endpoints
```
GET  /health
     → { status, model_loaded, dataset_loaded, uptime }

GET  /commodities
     → [ { hs_code, name, test_mape, description } × 10 ]

GET  /macro/defaults
     → { usd_pkr, brent_oil, us_confidence, as_of_date }
```

#### Forecast Endpoints
```
POST /forecast/single
     Body: { hs_code, target_yyyymm, usd_pkr, brent_oil, us_conf }
     → { hs_code, commodity, month, predicted_usd, predicted_m,
         confidence_lower, confidence_upper }

POST /forecast/multi-horizon
     Body: { hs_code, start_yyyymm, n_months (1–12),
             usd_pkr, brent_oil, us_conf }
     → { commodity, forecast: [ { month, predicted_m,
                                  lower_band, upper_band } ] }

POST /forecast/all-commodities
     Body: { target_yyyymm, usd_pkr, brent_oil, us_conf }
     → [ { hs_code, commodity, predicted_m, rank } × 10 ]

POST /forecast/portfolio
     Body: { target_yyyymm, usd_pkr, brent_oil, us_conf }
     → { total_predicted_m, commodities: [...],
         top_commodity, share_breakdown: {...} }
```

#### Scenario Simulator Endpoints
```
POST /scenario/single-variable
     Body: { hs_code, target_yyyymm, variable (pkr|oil|conf),
             range_min, range_max, steps,
             fixed_pkr, fixed_oil, fixed_conf, n_months }
     → { variable, values: [ { input_value, predicted_m } ] }

POST /scenario/multi-variable
     Body: { hs_code, target_yyyymm, n_months,
             pkr_values: [280, 300, 320],
             oil_values: [70, 80, 90],
             fixed_conf }
     → Matrix of predictions across all PKR × Oil combinations
```

#### Analytics Endpoints
```
GET  /seasonality/{hs_code}
     → { commodity, monthly_averages: { jan: X, feb: X, ... },
         peak_month, trough_month, seasonality_strength }

GET  /seasonality/all
     → [ { hs_code, commodity, peak_month, monthly_averages } × 10 ]

GET  /momentum
     → [ { hs_code, commodity, momentum_3m_pct,
           momentum_6m_pct, direction (up|down|flat),
           last_actual_m } × 10 ]

GET  /momentum/{hs_code}
     → { commodity, last_12_months: [...], momentum_3m, momentum_6m }

GET  /sensitivity/currency
     Body: { target_yyyymm, n_months, pkr_range_min,
             pkr_range_max, fixed_oil, fixed_conf }
     → [ { commodity, slope_per_10pkr, sensitivity_rank,
           direction } × 10 ]

GET  /historical/{hs_code}?months=24
     → { commodity, data: [ { month, export_value_m } ] }

GET  /historical/all?months=12
     → All 10 commodities last N months
```

#### Agent Endpoints
```
POST /agent/chat
     Body: { message, session_id, macro: { usd_pkr, brent_oil, us_conf } }
     → { response, tools_used: [...], session_id,
         embedded_data: { chart_data?, table_data? } }

GET  /agent/sessions/{session_id}
     → { messages: [ { role, content, timestamp } ] }

DELETE /agent/sessions/{session_id}
     → { cleared: true }

POST /agent/report
     Body: { scope (single|all), hs_code?, horizon,
             usd_pkr, brent_oil, us_conf, session_id }
     → { report_text, generated_at, commodities_covered,
         forecast_data: {...} }
```

---

### Backend Folder Structure

```
backend/
├── app.py                  ← FastAPI app, startup, CORS
├── models/
│   └── loader.py           ← load pkl + master_df at startup
├── routers/
│   ├── forecast.py         ← all /forecast/* endpoints
│   ├── scenario.py         ← all /scenario/* endpoints
│   ├── analytics.py        ← seasonality, momentum, sensitivity, historical
│   └── agent.py            ← /agent/chat, /agent/report, /agent/sessions
├── services/
│   ├── forecast_service.py ← make_prediction(), forecast_n_months()
│   ├── analytics_service.py← seasonality, momentum, sensitivity computations
│   ├── agent_service.py    ← LangChain agent setup, tool definitions
│   └── report_service.py   ← written report generation
├── schemas/
│   └── requests.py         ← Pydantic request/response models
└── requirements.txt
```

---

## 10. Frontend Design & User Experience

**Framework:** React (with Vite)
**Charting:** Recharts or Chart.js
**UI Components:** Tailwind CSS + shadcn/ui
**State Management:** React Query (server state) + Zustand (global UI state)
**HTTP Client:** Axios

---

### Global Layout

**Top Navigation Bar:**
- Logo + "PECDF" title
- Page links: Dashboard | Forecast | Scenarios | Commodities | AI Analyst | Reports
- Macro Inputs Panel (persistent): Live PKR / Brent / US Confidence inputs — changing these updates all forecasts globally
- Model badge: "XGBoost | MAPE 20.4% | Last updated: Dec 2025"

---

### Page 1 — Dashboard (Home)

**Purpose:** At-a-glance state of Pakistan's export landscape. User lands here and immediately understands what's happening without clicking anything.

**Sections:**

**Market Pulse Bar (top)**
Three metric cards — current macro conditions:
- USD/PKR: current value + 3-month trend arrow (up/down) + colour (red if weak PKR)
- Brent Oil: current price + trend
- US Consumer Confidence: current index + trend
User can edit these values — all downstream forecasts update live.

**10-Commodity Grid**
10 cards, one per commodity. Each card shows:
- Commodity name and HS code
- Last actual export value (Dec 2025)
- Next month forecast (Jan 2026)
- Momentum direction arrow (up/down/flat) with colour (green/red/grey)
- Mini sparkline chart of last 6 months actual + 1 month forecast
- Clicking any card navigates to the Commodity Explorer for that commodity

**Portfolio Summary Panel**
- Total predicted exports for next month across all 10 commodities (USD Millions)
- Donut chart: each commodity's share of total forecast
- "Concentration risk" warning if any single commodity > 40% of total forecast

**Top Opportunities & Risks**
Two columns:
- Top 3 commodities by positive momentum + forecast growth (green, "opportunity")
- Top 3 commodities by forecast decline or wide confidence band (red, "watch")

---

### Page 2 — Forecast Center

**Purpose:** Deep forecast for one commodity across a user-chosen time horizon. The main forecasting tool.

**Controls (left sidebar):**
- Commodity dropdown (all 10, with HS code + name)
- Horizon slider: 1 month to 12 months
- Macro inputs: USD/PKR, Brent Oil, US Consumer Confidence (pre-filled from global values, overridable per forecast)
- "Run Forecast" button

**Main Output — Professional Forecast Chart (full width)**
The industry-standard chart from Notebook 4:
- Last 12 months of actual historical data (solid dark line)
- N-month forecast (dashed red line with labelled dots)
- Growing confidence bands (shaded, widens with each step)
- Vertical "FORECAST →" separator
- Interactive: hover on any point to see exact value
- Toggle: show/hide confidence bands

**Forecast Data Table (below chart)**
| Month | Predicted (USD M) | Lower Bound | Upper Bound | MoM Change |
All rows, downloadable as CSV.

**Key Metrics Panel (right sidebar)**
- Forecast total over selected horizon (USD M)
- Average monthly forecast
- Growth vs same period last year
- Confidence: "High / Medium / Low" based on horizon length and commodity MAPE

**Download Options:** PNG chart, CSV data, PDF one-pager

---

### Page 3 — Scenario Simulator

**Purpose:** Answer "what if" questions. User changes one economic variable and sees how export predictions respond — critical for exporters making hedging decisions.

**Mode 1 — Single Variable Sensitivity**

**Controls:**
- Commodity selector
- Variable selector: PKR Rate | Brent Oil Price | US Consumer Confidence
- Range slider: min and max value for the selected variable
- Fixed values for the other two variables
- Forecast horizon: 1 or 3 months

**Output:**
- Line chart: X = variable range, Y = predicted export value
- Each point on the line is a complete forecast run
- Tooltip on hover: "At PKR=300: $45.2M exports"
- Slope annotation: "Every 10 PKR depreciation changes exports by +$2.1M"

**Mode 2 — Multi-Variable Grid**

**Controls:**
- Commodity selector
- Choose 2 variables to vary simultaneously
- 3 values per variable (e.g., PKR: 270, 290, 310)

**Output:**
- 3×3 heatmap grid: cell = predicted export value
- Colour scale: green (high) to red (low)
- Best and worst scenario highlighted with labels

**Mode 3 — Compare Two Scenarios**

- Side-by-side: Scenario A vs Scenario B
- User sets macro inputs for each scenario independently
- Chart overlays both forecast lines
- Delta table: which commodity gains/loses more in Scenario B vs A

---

### Page 4 — Commodity Explorer

**Purpose:** Complete deep-dive into one commodity. Everything about it in one place.

**Commodity Selector:** Large dropdown at top of page.

**Tab 1 — Overview**
- About card: what the commodity is, Pakistan's role in global trade for it, HS code
- 5-year historical chart (full history from master dataset)
- Key statistics: all-time high month, worst month, average annual growth rate
- Best and worst performing years
- Current momentum badge (up/down/flat)

**Tab 2 — Forecast**
- Same as Forecast Center page but pre-filtered to this commodity
- Defaults to 3-month horizon with global macro values

**Tab 3 — Seasonality**
- Bar chart: average export value per month (Jan–Dec), using all historical data
- Highlight: peak month (darkest green bar), trough month (red)
- Text insight: "Historically, [Commodity] exports peak in [Month] and are lowest in [Month]. Q[X] is the strongest quarter."
- Year-over-year comparison: 2023 vs 2024 vs 2025 seasonal patterns overlaid

**Tab 4 — Macro Sensitivity**
- Three mini line charts (one per macro driver)
- X = driver value range, Y = predicted export change
- Summary text: "This commodity is [most/least] sensitive to PKR changes among all 10 commodities"

**Tab 5 — Model Performance**
- This commodity's MAPE and R² from the test set
- Actual vs Predicted chart for the 2024–2025 test period
- Honest statement about how reliable forecasts are for this commodity
- If MAPE > 50%: "High uncertainty — use forecasts as directional guidance only"

---

### Page 5 — AI Export Analyst (Chat)

**Purpose:** Talk to an AI that understands the entire forecasting system. Ask questions in plain English and get answered with data, charts, and narrative.

**Layout:** Full-page chat interface.

**Left Panel — Conversation**
- Chat message thread (user messages right-aligned, agent left-aligned)
- Agent messages can contain:
  - Plain text narrative
  - Inline data tables
  - Embedded mini-charts (forecast chart, scenario chart)
  - Confidence indicators
- Typing indicator when agent is processing

**Right Panel — Context & Controls**
- Current macro inputs (user can update mid-conversation)
- "Active Commodity" indicator (agent tracks which commodity is being discussed)
- Session info: messages count, tools called
- "Clear Conversation" button
- "Generate Report from this Conversation" button

**Suggested Prompts (shown when chat is empty):**
- "Which commodity should I export next quarter?"
- "Give me a full 6-month outlook for Rice"
- "What happens if PKR hits 320?"
- "Write a Q1 2026 export outlook report"
- "Which commodities are trending upward?"
- "Compare Cotton Yarn and Bed Linens for next 3 months"
- "Explain why Oil Seeds is so hard to forecast"
- "What is Pakistan's strongest export sector right now?"

**Agent Capabilities (visible in UI):**
Small badges showing which tools the agent used for each response:
`📊 Forecast` `📈 Seasonality` `🔄 Scenario` `📉 Momentum` `📝 Report`

**Multi-turn Memory:**
The agent remembers the entire conversation. If you asked about Rice 5 messages ago and now say "compare that to Cotton Yarn", the agent knows what "that" refers to and runs the comparison automatically.

---

### Page 6 — Report Generator

**Purpose:** Generate a professional written export outlook report — ready to send to management, a board, or an exporter association — with one click.

**Report Configuration:**
- Scope: Single Commodity | Top 5 | All 10 Commodities
- Forecast Horizon: 1 / 3 / 6 / 12 months
- Macro Assumptions: PKR, Brent, US Confidence
- Tone: Technical (with MAPE, R²) | Executive (plain language only)
- Include sections: [ ] Forecast Table [ ] Seasonality [ ] Scenario Analysis [ ] Momentum Summary

**Preview Panel (right side):**
Live text preview of the report as user configures options. Updates when any setting changes.

**Report Content (what the agent generates):**
```
Pakistan Export Outlook — Q1 2026
Generated: [date] | Model: XGBoost | MAPE: 20.41%

EXECUTIVE SUMMARY
[2-3 paragraph narrative: overall outlook, key risks, macro context]

COMMODITY FORECASTS
[Commodity-by-commodity: predicted value, growth vs prior year, confidence level]

SEASONAL CONSIDERATIONS
[Which commodities are entering peak/off-peak season]

KEY RISK FACTORS
[Macro risks: PKR trajectory, oil price, US demand]

METHODOLOGY NOTE
[Brief: panel regression model, training period, what MAPE means]
```

**Download:** PDF, Word (.docx), or plain text

---

## 11. AI Export Analyst Agent

### Architecture

**Framework:** LangChain with Claude claude-sonnet-4-6 (Anthropic)
**Memory:** `ConversationBufferWindowMemory` — last 10 turns per session
**Session Storage:** In-memory dict on backend (`{session_id: memory_object}`)

### System Prompt (injected every request)

```
You are an expert Pakistan export analyst with access to a machine learning
forecasting system trained on 15 years of Pakistan commodity export data.

CONTEXT YOU ALWAYS KNOW:
- Model: XGBoost, trained Jul 2010–Dec 2023, test MAPE 20.41%, R² 0.9482
- 10 commodities: Rice (1006), Oil Seeds (1207), Cement (2523),
  Cotton Yarn (5205), Winter Wear (6110), Mens Suits (6203),
  Bed Linens (6302), Copper (7403), Medical Instruments (9018),
  Sports Goods (9506)
- 3 macro drivers: USD/PKR exchange rate, Brent crude oil, US Consumer Confidence
- Current macro: [injected dynamically per request]
- Dataset covers Jul 2010 – Dec 2025

BEHAVIOUR:
- Always call tools to get fresh data before answering quantitative questions
- When forecasting, always note the confidence level (horizon × commodity MAPE)
- Reference previous messages in the conversation when relevant
- For Oil Seeds, always caveat that forecasts are highly uncertain (MAPE >100%)
- Respond in clear business English — no jargon unless asked for technical detail
```

### Agent Tools

| Tool Name | What It Does | When Agent Uses It |
|-----------|-------------|-------------------|
| `forecast_tool` | Calls `/forecast/multi-horizon` for a commodity + horizon | "Forecast Rice for 6 months" |
| `forecast_all_tool` | Calls `/forecast/all-commodities` | "Which commodity has best outlook?" |
| `scenario_tool` | Calls `/scenario/single-variable` | "What if PKR hits 320?" |
| `historical_tool` | Calls `/historical/{hs}` | "How was Rice doing last year?" |
| `seasonality_tool` | Calls `/seasonality/{hs}` | "When is peak season for textiles?" |
| `momentum_tool` | Calls `/momentum` | "Which commodities are trending up?" |
| `sensitivity_tool` | Calls `/sensitivity/currency` | "Which exports are hurt most by PKR?" |
| `compare_tool` | Calls forecast for two commodities, builds comparison | "Compare Cotton Yarn vs Bed Linens" |
| `report_tool` | Calls `/agent/report` | "Write a Q1 2026 outlook report" |

### Conversation Flow Example

```
User:  "Which commodity should I focus on exporting next quarter?"

Agent: [calls forecast_all_tool(Q1 2026) + momentum_tool() + seasonality_tool(all)]

       "Based on Q1 2026 forecasts and current momentum:

        Top 3 Opportunities:
        1. Rice — Predicted $58M (+12% vs Q1 2025), strong upward momentum,
                  Q1 is historically its strongest quarter.
        2. Bed Linens — Predicted $22M, very stable (MAPE 12%), entering
                        its peak textile export season.
        3. Medical Instruments — Steady growth trend, lowest uncertainty
                                 of all 10 commodities.

        Avoid this quarter:
        - Cement (declining momentum, -8% forecast)
        - Oil Seeds (extremely high forecast uncertainty)

        Macro note: Current PKR at 285 is favourable for USD-earning
        exporters. If PKR weakens further to 300+, Rice revenue
        improves further in PKR terms."

User:  "Show me a 6-month forecast for Rice"

Agent: [calls forecast_tool(rice, 6 months)]
       [returns forecast table + embeds chart in response]

User:  "What if PKR goes to 310?"

Agent: [remembers we're talking about Rice]
       [calls scenario_tool(rice, pkr=310, months=6)]
       "At PKR 310, Rice exports are predicted to be $X million
        over 6 months — $Y million more than the base case at PKR 285..."
```

---

## 12. Full Technology Stack

### Machine Learning / Data Science
| Library | Version | Purpose |
|---------|---------|---------|
| pandas | ≥2.2.0 | Data manipulation, panel dataset |
| numpy | ≥1.26.0 | Numerical operations, lag computation |
| scikit-learn | ≥1.5.0 | OrdinalEncoder, metrics |
| xgboost | ≥2.0.0 | Champion model |
| catboost | ≥1.2.0 | Comparison model |
| lightgbm | ≥4.0.0 | Comparison model |
| joblib | ≥1.3.0 | Model serialization |
| scipy | ≥1.13.0 | Statistical utilities |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| fastapi | ≥0.111.0 | REST API framework |
| uvicorn | ≥0.30.0 | ASGI server |
| pydantic | ≥2.7.0 | Request/response validation |
| python-multipart | ≥0.0.9 | File uploads |
| langchain | ≥0.2.0 | Agent framework |
| langchain-community | ≥0.2.0 | LangChain tool integrations |
| anthropic | ≥0.28.0 | Claude API client |
| python-dotenv | ≥1.0.0 | Environment variable management |

### Frontend
| Library | Purpose |
|---------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| Recharts | Charts and visualizations |
| React Query | Server state management |
| Zustand | Global UI state |
| Axios | HTTP client |
| React Router | Client-side routing |

### Environment
| Item | Detail |
|------|--------|
| Python | 3.14 (note: TF not supported — use XGBoost/LightGBM only) |
| OS | Windows 11 |
| API Key | Anthropic API key in `.env` file (`ANTHROPIC_API_KEY=...`) |

---

## 13. Project Folder Structure

```
PECDF/
├── Data/
│   ├── Master_FYP_Dataset.csv          ← Generated by Notebook 1
│   ├── COMTRADE_HS_1006_Rice.csv
│   ├── COMTRADE_HS_1207_OilSeeds.csv
│   ├── COMTRADE_HS_2523_Cement.csv
│   ├── COMTRADE_HS_5205_CottonYarn.csv
│   ├── COMTRADE_HS_6110_WinterWear.csv
│   ├── COMTRADE_HS_6203_MensSuits.csv
│   ├── COMTRADE_HS_6302_BedLinens.csv
│   ├── COMTRADE_HS_7403_Copper.csv
│   ├── COMTRADE_HS_9018_MedicalInstr.csv
│   ├── COMTRADE_HS_9506_SportsGoods.csv
│   ├── USD_PKR_Exchange_Rate.csv
│   ├── Brent_Oil_Price.csv
│   └── US_Consumer_Confidence.csv
│
├── Models/
│   ├── xgboost_champion.pkl            ← Champion model artifact (1.8 MB)
│   └── forecast_chart_jan_mar_2026.png ← Professional forecast chart
│
├── Notebooks/
│   ├── Notebook_1_Data_Engineering.ipynb  ✅ Complete
│   ├── Notebook_2_EDA.ipynb               ✅ Complete
│   ├── Notebook_3_Training.ipynb          ✅ Complete
│   └── Notebook_4_Inference.ipynb         ✅ Complete
│
├── backend/                            ← TO BUILD
│   ├── app.py
│   ├── models/
│   ├── routers/
│   ├── services/
│   ├── schemas/
│   └── requirements.txt
│
├── frontend/                           ← TO BUILD
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
├── .env                                ← ANTHROPIC_API_KEY (never commit)
├── requirements.txt                    ✅ Created
└── projectdocumentationandcurrentstate.md  ← This file
```

---

## 14. Build Order & Milestones

### Phase 1 — Completed ✅
- [x] Notebook 1: Data Engineering & Master Dataset
- [x] Notebook 2: EDA & Insights
- [x] Notebook 3: Model Training (XGBoost Champion, MAPE 20.41%)
- [x] Notebook 4: Inference Sandbox, 3-month recursive forecast, professional chart
- [x] requirements.txt
- [x] Project Documentation

### Phase 2 — Backend (Next)
- [ ] FastAPI project setup, CORS, startup model loading
- [ ] Forecast endpoints (`/forecast/single`, `/forecast/multi-horizon`, `/forecast/all`)
- [ ] Scenario endpoints (`/scenario/single-variable`, `/scenario/multi-variable`)
- [ ] Analytics endpoints (`/seasonality`, `/momentum`, `/sensitivity`, `/historical`)
- [ ] LangChain agent setup with all 9 tools
- [ ] Agent chat endpoint with session memory
- [ ] Report generation endpoint
- [ ] API testing (all endpoints verified)

### Phase 3 — Frontend
- [ ] React + Vite + Tailwind setup
- [ ] Global layout + navigation + macro inputs bar
- [ ] Page 1: Dashboard (commodity grid, portfolio summary, market pulse)
- [ ] Page 2: Forecast Center (interactive professional chart)
- [ ] Page 3: Scenario Simulator (slider-based what-if)
- [ ] Page 4: Commodity Explorer (5 tabs)
- [ ] Page 5: AI Export Analyst (chat interface)
- [ ] Page 6: Report Generator (config + preview + download)
- [ ] Polish: loading states, error handling, mobile responsiveness

### Phase 4 — Integration & Polish
- [ ] Connect all frontend pages to live backend APIs
- [ ] End-to-end testing: chat → tool call → forecast → display in UI
- [ ] Performance: lazy loading, React Query caching
- [ ] Deployment preparation (Dockerfile or local run scripts)

---

*Document last updated: May 2026*
*Project: Pakistan Export Demand Forecasting System (PECDF)*
*FYP — Complete MLOps Pipeline + AI Web Application*
