import json
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from database.models import (
    User,
    AgentSession, AgentMessage,
    Forecast, ForecastResult,
    Scenario, ScenarioResult,
    Report
)


# ─────────────────────────────────────────
# Users
# ─────────────────────────────────────────

def create_user(
    db: Session,
    email: str,
    hashed_password: str,
    full_name: Optional[str] = None
) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=email.lower().strip(),
        hashed_password=hashed_password,
        full_name=full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def update_last_login(db: Session, user_id: str) -> None:
    db.query(User).filter(User.id == user_id).update(
        {"last_login": datetime.utcnow()}
    )
    db.commit()


# ─────────────────────────────────────────
# Agent Sessions
# ─────────────────────────────────────────

def create_session(
    db: Session,
    user_id: str,
    macro_pkr: Optional[float] = None,
    macro_oil: Optional[float] = None,
    macro_conf: Optional[float] = None
) -> AgentSession:
    session = AgentSession(
        id=str(uuid.uuid4()),
        user_id=user_id,
        macro_pkr=macro_pkr,
        macro_oil=macro_oil,
        macro_conf=macro_conf
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session(db: Session, session_id: str) -> Optional[AgentSession]:
    return db.query(AgentSession).filter(AgentSession.id == session_id).first()


def touch_session(db: Session, session_id: str) -> None:
    db.query(AgentSession).filter(AgentSession.id == session_id).update(
        {"last_active": datetime.utcnow()}
    )
    db.commit()


def delete_session(db: Session, session_id: str) -> bool:
    rows = db.query(AgentSession).filter(AgentSession.id == session_id).delete()
    db.commit()
    return rows > 0


# ─────────────────────────────────────────
# Agent Messages
# ─────────────────────────────────────────

def add_message(
    db: Session,
    session_id: str,
    role: str,
    content: str,
    tools_used: Optional[list[str]] = None
) -> AgentMessage:
    message = AgentMessage(
        session_id=session_id,
        role=role,
        content=content,
        tools_used=json.dumps(tools_used) if tools_used else None
    )
    db.add(message)
    db.query(AgentSession).filter(AgentSession.id == session_id).update(
        {"message_count": AgentSession.message_count + 1,
         "last_active": datetime.utcnow()}
    )
    db.commit()
    db.refresh(message)
    return message


def get_messages(
    db: Session,
    session_id: str,
    limit: int = 50
) -> list[AgentMessage]:
    return (
        db.query(AgentMessage)
        .filter(AgentMessage.session_id == session_id)
        .order_by(AgentMessage.created_at.asc())
        .limit(limit)
        .all()
    )


# ─────────────────────────────────────────
# Forecasts
# ─────────────────────────────────────────

def save_forecast(
    db: Session,
    user_id: str,
    hs_code: str,
    commodity_name: str,
    start_month: int,
    n_months: int,
    usd_pkr: float,
    brent_oil: float,
    us_confidence: float,
    points: list[dict],
    session_id: Optional[str] = None
) -> Forecast:
    forecast = Forecast(
        user_id=user_id,
        session_id=session_id,
        hs_code=hs_code,
        commodity_name=commodity_name,
        start_month=start_month,
        n_months=n_months,
        usd_pkr=usd_pkr,
        brent_oil=brent_oil,
        us_confidence=us_confidence
    )
    db.add(forecast)
    db.flush()  # get forecast.id without committing

    for point in points:
        result = ForecastResult(
            forecast_id=forecast.id,
            month=point["month"],
            predicted_usd=point["predicted_m"] * 1e6,
            lower_bound=point["lower_bound"],
            upper_bound=point["upper_bound"],
            step_number=point["step"]
        )
        db.add(result)

    db.commit()
    db.refresh(forecast)
    return forecast


def get_cached_forecast(
    db: Session,
    hs_code: str,
    start_month: int,
    n_months: int,
    usd_pkr: float,
    brent_oil: float,
    us_confidence: float
) -> Optional[Forecast]:
    """Return a recent forecast with identical inputs, or None."""
    return (
        db.query(Forecast)
        .filter(
            Forecast.hs_code == hs_code,
            Forecast.start_month == start_month,
            Forecast.n_months == n_months,
            Forecast.usd_pkr == usd_pkr,
            Forecast.brent_oil == brent_oil,
            Forecast.us_confidence == us_confidence
        )
        .order_by(Forecast.created_at.desc())
        .first()
    )


# ─────────────────────────────────────────
# Scenarios
# ─────────────────────────────────────────

def save_scenario(
    db: Session,
    user_id: str,
    hs_code: str,
    commodity_name: str,
    variable_name: str,
    target_month: int,
    n_months: int,
    range_min: float,
    range_max: float,
    steps: int,
    points: list[dict],
    fixed_pkr: Optional[float] = None,
    fixed_oil: Optional[float] = None,
    fixed_conf: Optional[float] = None,
    session_id: Optional[str] = None
) -> Scenario:
    scenario = Scenario(
        user_id=user_id,
        session_id=session_id,
        hs_code=hs_code,
        commodity_name=commodity_name,
        variable_name=variable_name,
        target_month=target_month,
        n_months=n_months,
        range_min=range_min,
        range_max=range_max,
        steps=steps,
        fixed_pkr=fixed_pkr,
        fixed_oil=fixed_oil,
        fixed_conf=fixed_conf
    )
    db.add(scenario)
    db.flush()

    for point in points:
        result = ScenarioResult(
            scenario_id=scenario.id,
            input_value=point["input_value"],
            predicted_m=point["predicted_m"]
        )
        db.add(result)

    db.commit()
    db.refresh(scenario)
    return scenario


# ─────────────────────────────────────────
# Reports
# ─────────────────────────────────────────

def save_report(
    db: Session,
    user_id: str,
    scope: str,
    horizon: int,
    usd_pkr: float,
    brent_oil: float,
    us_confidence: float,
    tone: str,
    report_text: str,
    hs_code: Optional[str] = None,
    session_id: Optional[str] = None
) -> Report:
    report = Report(
        user_id=user_id,
        session_id=session_id,
        scope=scope,
        hs_code=hs_code,
        horizon=horizon,
        usd_pkr=usd_pkr,
        brent_oil=brent_oil,
        us_confidence=us_confidence,
        tone=tone,
        report_text=report_text,
        word_count=len(report_text.split())
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_reports(db: Session, session_id: str) -> list[Report]:
    return (
        db.query(Report)
        .filter(Report.session_id == session_id)
        .order_by(Report.created_at.desc())
        .all()
    )


def get_user_reports(db: Session, user_id: str, limit: int = 20) -> list[Report]:
    return (
        db.query(Report)
        .filter(Report.user_id == user_id)
        .order_by(Report.created_at.desc())
        .limit(limit)
        .all()
    )
