from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "PECDF Backend"
    app_version: str = "1.0.0"
    debug: bool = True
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    database_url: str = "sqlite:///./pecdf.db"

    model_path: str = "../Models/xgboost_champion.pkl"
    master_data_path: str = "../Data/Master_FYP_Dataset.csv"

    # JWT Auth
    jwt_secret: str = "change-this-to-a-long-random-string-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    # Groq AI
    groq_api_key: str
    agent_model: str = "llama-3.3-70b-versatile"
    agent_max_tokens: int = 4096
    agent_memory_window: int = 10
    session_ttl_hours: int = 24

    class Config:
        env_file = ".env"


settings = Settings()
