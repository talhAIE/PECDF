# PECDF - Pakistan Export Demand Forecasting System

PECDF is a full-stack machine-learning application that forecasts monthly export values for ten key Pakistani commodities and turns the results into practical dashboards, scenarios, and AI-assisted insights.

## Overview

The project combines a trained XGBoost panel model with a FastAPI backend and a React dashboard. It uses historical export data from July 2010 to December 2025, alongside USD/PKR exchange rates, Brent oil prices, and US consumer confidence, to forecast export demand in USD.

It is designed as an academic Final Year Project and a decision-support prototype for exploring Pakistan's export performance.

## Features

- Forecast monthly export value for 10 commodity groups, including Rice, Bed Linens, Medical Instruments, Sports Goods, and more.
- Generate multi-month recursive forecasts with uncertainty bands.
- Run what-if scenarios for changes in USD/PKR, oil prices, and consumer confidence.
- Explore historical trends, momentum, seasonality, currency sensitivity, and actual-versus-predicted model performance.
- View portfolio-level forecasts, rankings, opportunity signals, and concentration risk.
- Register and sign in securely with JWT authentication.
- Ask an AI Export Analyst for data-backed commodity comparisons, forecasts, and scenario explanations.
- Generate executive or technical export outlook reports.

## Technologies

| Area | Technologies |
| --- | --- |
| Machine learning | Python, XGBoost, pandas, NumPy, scikit-learn |
| Backend | FastAPI, SQLAlchemy, Pydantic, JWT, Argon2 |
| Database | SQLite for local development, PostgreSQL for deployment |
| Frontend | React, Vite, Tailwind CSS, React Query, Zustand, Recharts |
| AI features | LangChain/LangGraph with OpenAI or Groq |
| Deployment | Render for the API and Vercel for the frontend |

## Installation

### Prerequisites

- Python 3.12+
- Node.js 20+
- The included `Data/Master_FYP_Dataset.csv` and `Models/xgboost_champion.pkl` files

### Backend

```bash
cd backend
python -m venv .venv
```

Activate the environment, install dependencies, then create `backend/.env`:

```bash
pip install -r requirements.txt
```

```env
JWT_SECRET=replace-with-a-long-random-secret
# Optional: enables AI Analyst and Report Generator
OPENAI_API_KEY=
# or
GROQ_API_KEY=
```

Start the API:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The API documentation is available at `http://localhost:8000/docs`.

### Frontend

In another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Then start the application:

```bash
npm run dev
```

Open `http://localhost:5173`, register an account, and explore the dashboard.

## Results

The selected XGBoost model was trained on data through December 2023 and evaluated on the January 2024 to December 2025 holdout period.

| Metric | Result |
| --- | ---: |
| Test MAPE | 20.41% |
| Test R2 | 0.9482 |
| Tracked commodities | 10 |
| Historical observations | 1,860 |

Forecast quality varies by commodity. Stable categories such as Men's Suits, Bed Linens, and Medical Instruments are more reliable, while highly irregular categories such as Oil Seeds should be treated as directional guidance rather than precise predictions.

## Future Improvements

- Add automated unit, integration, and end-to-end tests.
- Introduce database migrations and stronger production monitoring.
- Add role-based access control, rate limiting, and stricter session ownership checks.
- Refresh the dataset and retrain the model on a scheduled pipeline.
- Incorporate additional trade drivers, destination-market data, and commodity-specific models.
- Add model explainability, forecast accuracy tracking, and downloadable analytics.

## Project Structure

```text
PECDF/
|-- Data/        # Master dataset and source data
|-- Models/      # Trained XGBoost model
|-- Notebooks/   # Data engineering, EDA, training, and inference notebooks
|-- backend/     # FastAPI API, ML services, database, and AI agent
`-- frontend/    # React dashboard
```

For detailed technical notes and API testing examples, see the documents in `mydocs/`.
