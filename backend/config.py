import json
from pathlib import Path
from typing import Literal, Optional

from pydantic import Field, computed_field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent


def _parse_allowed_origins_str(raw: Optional[str]) -> list[str]:
    """
    Normalize CORS origins. Must read env as plain str — pydantic-settings runs json.loads()
    on list[T] env values before validators, which breaks blank or malformed strings on Render.
    """
    localhost = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
    if raw is None:
        return localhost
    s = str(raw).strip()
    if not s:
        return localhost
    if s.startswith("["):
        try:
            parsed = json.loads(s)
        except json.JSONDecodeError as e:
            raise ValueError("ALLOWED_ORIGINS is not valid JSON.") from e
        if not isinstance(parsed, list):
            raise ValueError('ALLOWED_ORIGINS JSON must look like ["https://a.com"].')
        out = [str(x).strip() for x in parsed if str(x).strip()]
        if not out:
            raise ValueError("ALLOWED_ORIGINS JSON array is empty.")
        return out
    return [x.strip() for x in s.split(",") if x.strip()]


class Settings(BaseSettings):
    app_name: str = "PECDF Backend"
    app_version: str = "1.0.0"
    debug: bool = True
    allowed_origins_env: Optional[str] = Field(
        default=None,
        validation_alias="ALLOWED_ORIGINS",
        description='Comma-separated or JSON array, e.g. https://x.vercel.app,https://y.vercel.app',
    )

    @computed_field
    @property
    def allowed_origins(self) -> list[str]:
        return _parse_allowed_origins_str(self.allowed_origins_env)

    # Neon: set DATABASE_URL in .env (pooled URI). SQLite only used if DATABASE_URL is unset / empty string.
    database_url: str = Field(
        default="sqlite:///./pecdf.db",
        description="Neon Postgres connection URI; leave unset for local SQLite only.",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: object) -> object:
        """Render/Heroku sometimes use postgres://; SQLAlchemy expects postgresql://."""
        if isinstance(v, str) and v.startswith("postgres://"):
            return "postgresql://" + v[len("postgres://"):]
        return v

    @model_validator(mode="after")
    def empty_database_url_falls_back_to_sqlite(self) -> "Settings":
        if isinstance(self.database_url, str) and not self.database_url.strip():
            self.database_url = "sqlite:///./pecdf.db"
        return self

    model_path: str = "../Models/xgboost_champion.pkl"
    master_data_path: str = "../Data/Master_FYP_Dataset.csv"

    # JWT Auth
    jwt_secret: str = "change-this-to-a-long-random-string-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    # LLM — set at least one of GROQ_API_KEY or OPENAI_API_KEY for agent + reports
    groq_api_key: str = Field(default="", description="Groq API key (console.groq.com)")
    openai_api_key: str = Field(default="", description="OpenAI API key")
    # auto: sole key chooses provider; if both keys are set -> OpenAI (set groq to force Groq)
    agent_llm_provider: Literal["auto", "groq", "openai"] = "auto"
    agent_model: str = "llama-3.3-70b-versatile"   # Groq model id
    openai_model: str = "gpt-4o-mini"              # OpenAI model id
    agent_max_tokens: int = 4096
    agent_memory_window: int = 10
    session_ttl_hours: int = 24

    # FRED API — free key at https://fred.stlouisfed.org/docs/api/api_key.html
    # Used for real-time US Consumer Confidence (UMCSENT series)
    fred_api_key: str = ""

    # Always load `backend/.env` (not cwd-relative `.env`). Uvicorn --reload subprocess CWD can
    # differ on Windows → keys like GROQ_API_KEY were missed and agent reported "No LLM API key".
    model_config = SettingsConfigDict(
        env_file=_BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
