from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from config import settings
from database.connection import engine
from database.models import Base
from ml.loader import load_artifacts
from ml import loader
from routers import auth, forecast, scenario, analytics, agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────
    Base.metadata.create_all(bind=engine)   # create DB tables if not exist
    load_artifacts()                         # load model + master_df into memory
    print(f"[APP] PECDF Backend v{settings.app_version} started.")
    print(f"[APP] Docs available at http://localhost:8000/docs")
    yield
    # ── Shutdown ─────────────────────────
    print("[APP] PECDF Backend shutting down.")


app = FastAPI(
    title="PECDF API",
    description="Pakistan Export Demand Forecasting System — ML forecasting, scenario analysis, and AI export analyst.",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request timing middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.time() - start) * 1000:.1f}ms"
    return response


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(forecast.router)
app.include_router(scenario.router)
app.include_router(analytics.router)
app.include_router(agent.router)


# ── System endpoints ──────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health():
    return {
        "status": "ok",
        "version": settings.app_version,
        "model_loaded": loader.is_loaded(),
        "model_type": type(loader.model).__name__ if loader.model else None,
        "dataset_rows": len(loader.master_df) if loader.master_df is not None else 0,
        "test_mape": loader.test_mape,
        "test_r2": loader.test_r2,
        "train_cutoff": loader.train_cutoff,
        "commodities_count": len(loader.hs_categories),
    }


@app.get("/commodities", tags=["System"])
def list_commodities():
    return [
        {
            "hs_code": hs,
            "name": loader.HS_LABELS[hs],
            "test_mape": loader.get_commodity_mape(hs),
        }
        for hs in loader.hs_categories
    ]


@app.get("/", tags=["System"])
def root():
    return {
        "message": "PECDF API is running",
        "docs": "/docs",
        "health": "/health",
        "commodities": "/commodities",
    }
