import joblib
import pandas as pd
from pathlib import Path
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings

# ─────────────────────────────────────────
# Global state — loaded once at startup
# All services import these directly
# ─────────────────────────────────────────

model = None
FEATURE_COLS: list[str] = []
hs_categories: list[str] = []
HS_LABELS: dict[str, str] = {}
train_cutoff: int = 0
test_mape: float = 0.0
test_r2: float = 0.0
master_df: pd.DataFrame = None

# Default per-HS MAPE (confidence bands); overridden if `commodity_mape` is in pickle
_FALLBACK_COMMODITY_MAPE: dict[str, float] = {
    "6203": 11.0,   # Mens Suits
    "9018": 12.0,   # Medical Instruments
    "6302": 12.0,   # Bed Linens
    "9506": 15.0,   # Sports Goods
    "1006": 18.0,   # Rice
    "6110": 20.0,   # Winter Wear
    "7403": 22.0,   # Copper
    "2523": 30.0,   # Cement
    "5205": 32.0,   # Cotton Yarn
    "1207": 109.0,  # Oil Seeds
}

COMMODITY_MAPE: dict[str, float] = dict(_FALLBACK_COMMODITY_MAPE)


def load_artifacts() -> None:
    """
    Load the champion model pickle and master dataset into global memory.
    Called once in app.py lifespan on startup.
    """
    global model, FEATURE_COLS, hs_categories, HS_LABELS
    global train_cutoff, test_mape, test_r2, master_df
    global COMMODITY_MAPE

    # Resolve paths relative to backend/ (where uvicorn is run from)
    backend_dir = Path(__file__).parent.parent
    model_path = (backend_dir / settings.model_path).resolve()
    data_path = (backend_dir / settings.master_data_path).resolve()

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    if not data_path.exists():
        raise FileNotFoundError(f"Master dataset not found: {data_path}")

    artifact = joblib.load(model_path)
    model = artifact["model"]
    FEATURE_COLS = artifact["feature_cols"]
    hs_categories = artifact["hs_categories"]
    HS_LABELS = artifact["hs_labels"]
    train_cutoff = int(artifact["train_cutoff"])
    test_mape = float(artifact["test_mape"])
    test_r2 = float(artifact["test_r2"])

    cm = artifact.get("commodity_mape")
    if isinstance(cm, dict) and len(cm) > 0:
        COMMODITY_MAPE = {str(k): float(v) for k, v in cm.items()}
    else:
        COMMODITY_MAPE = dict(_FALLBACK_COMMODITY_MAPE)

    master_df = pd.read_csv(data_path, dtype={"HS_Code": str})

    try:
        mtime = model_path.stat().st_mtime
        from datetime import datetime, timezone

        print(f"[ML] Pickle mtime      : {datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()}")
    except OSError:
        pass

    print(f"[ML] Model loaded     : XGBoost | MAPE={test_mape}% | R²={test_r2}")
    print(f"[ML] Train cutoff     : {train_cutoff}")
    print(f"[ML] Commodities      : {len(hs_categories)} — {list(HS_LABELS.values())}")
    print(f"[ML] Master dataset   : {master_df.shape[0]} rows × {master_df.shape[1]} cols")
    print(f"[ML] Date range       : {master_df['Date_YYYYMM'].min()} – {master_df['Date_YYYYMM'].max()}")
    print(f"[ML] Features         : {FEATURE_COLS}")


def get_commodity_mape(hs_code: str) -> float:
    """Return per-commodity MAPE, falling back to overall test MAPE."""
    return COMMODITY_MAPE.get(str(hs_code), test_mape)


def is_loaded() -> bool:
    return model is not None and master_df is not None
