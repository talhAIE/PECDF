from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    app_name: str = "PECDF Backend"
    app_version: str = "1.0.0"
    debug: bool = True
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]

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
