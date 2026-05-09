from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "PECDF Backend"
    app_version: str = "1.0.0"
    debug: bool = True
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]

    database_url: str = "sqlite:///./pecdf.db"

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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
