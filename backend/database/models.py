from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.connection import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class AgentSession(Base):
    __tablename__ = "agent_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    last_active: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    macro_pkr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    macro_oil: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    macro_conf: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)

    messages: Mapped[list["AgentMessage"]] = relationship(
        "AgentMessage", back_populates="session", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report", back_populates="session", cascade="all, delete-orphan"
    )


class AgentMessage(Base):
    __tablename__ = "agent_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agent_sessions.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(10), nullable=False)   # 'user' | 'assistant'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tools_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array string
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)

    session: Mapped["AgentSession"] = relationship("AgentSession", back_populates="messages")


class Forecast(Base):
    __tablename__ = "forecasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    hs_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    commodity_name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_month: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # YYYYMM
    n_months: Mapped[int] = mapped_column(Integer, nullable=False)
    usd_pkr: Mapped[float] = mapped_column(Float, nullable=False)
    brent_oil: Mapped[float] = mapped_column(Float, nullable=False)
    us_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    results: Mapped[list["ForecastResult"]] = relationship(
        "ForecastResult", back_populates="forecast", cascade="all, delete-orphan"
    )


class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    forecast_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("forecasts.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    month: Mapped[int] = mapped_column(Integer, nullable=False)       # YYYYMM
    predicted_usd: Mapped[float] = mapped_column(Float, nullable=False)
    lower_bound: Mapped[float] = mapped_column(Float, nullable=False)
    upper_bound: Mapped[float] = mapped_column(Float, nullable=False)
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-based

    forecast: Mapped["Forecast"] = relationship("Forecast", back_populates="results")


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    hs_code: Mapped[str] = mapped_column(String(10), nullable=False)
    commodity_name: Mapped[str] = mapped_column(String(100), nullable=False)
    variable_name: Mapped[str] = mapped_column(String(20), nullable=False)  # 'pkr'|'oil'|'conf'
    target_month: Mapped[int] = mapped_column(Integer, nullable=False)
    n_months: Mapped[int] = mapped_column(Integer, default=1)
    range_min: Mapped[float] = mapped_column(Float, nullable=False)
    range_max: Mapped[float] = mapped_column(Float, nullable=False)
    steps: Mapped[int] = mapped_column(Integer, default=10)
    fixed_pkr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fixed_oil: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fixed_conf: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    results: Mapped[list["ScenarioResult"]] = relationship(
        "ScenarioResult", back_populates="scenario", cascade="all, delete-orphan"
    )


class ScenarioResult(Base):
    __tablename__ = "scenario_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scenario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("scenarios.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    input_value: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_m: Mapped[float] = mapped_column(Float, nullable=False)

    scenario: Mapped["Scenario"] = relationship("Scenario", back_populates="results")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("agent_sessions.id", ondelete="SET NULL"),
        nullable=True, index=True
    )
    scope: Mapped[str] = mapped_column(String(20), nullable=False)   # 'single'|'top5'|'all'
    hs_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    horizon: Mapped[int] = mapped_column(Integer, nullable=False)
    usd_pkr: Mapped[float] = mapped_column(Float, nullable=False)
    brent_oil: Mapped[float] = mapped_column(Float, nullable=False)
    us_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    tone: Mapped[str] = mapped_column(String(20), default="executive")
    report_text: Mapped[str] = mapped_column(Text, nullable=False)
    word_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)

    session: Mapped[Optional["AgentSession"]] = relationship(
        "AgentSession", back_populates="reports"
    )
