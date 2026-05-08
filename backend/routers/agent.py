import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database.connection import get_db
from database import crud
from schemas.agent import (
    ChatRequest, ChatResponse,
    ReportRequest, ReportResponse,
    SessionHistoryResponse, MessageItem,
)
from middleware.auth import get_current_user

router = APIRouter(prefix="/agent", tags=["Agent"])


def _extract_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    return auth.replace("Bearer ", "").strip()


# ─── Chat ───────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def agent_chat(
    req: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    bearer_token = _extract_token(request)

    # Create or retrieve DB session
    if req.session_id:
        session = crud.get_session(db, req.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session = crud.create_session(
            db, user_id,
            macro_pkr=req.macro.usd_pkr,
            macro_oil=req.macro.brent_oil,
            macro_conf=req.macro.us_confidence,
        )

    # Save user message to DB
    crud.add_message(db, session.id, "user", req.message)

    # Build / retrieve agent and run
    try:
        from agent.setup import get_or_create_agent, invoke_agent
        get_or_create_agent(
            session.id, bearer_token,
            req.macro.usd_pkr, req.macro.brent_oil, req.macro.us_confidence
        )
        response_text, tools_used = invoke_agent(session.id, req.message)
    except Exception as e:
        response_text = f"Agent error: {str(e)}"
        tools_used = []

    # Save assistant message to DB
    crud.add_message(db, session.id, "assistant", response_text, tools_used or None)

    return ChatResponse(
        response=response_text,
        session_id=session.id,
        tools_used=tools_used,
        embedded_data=None,
    )


# ─── Session history ────────────────────

@router.get("/sessions/{session_id}", response_model=SessionHistoryResponse)
def get_session_history(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = crud.get_messages(db, session_id)
    return SessionHistoryResponse(
        session_id=session_id,
        message_count=len(messages),
        messages=[
            MessageItem(
                id=m.id,
                role=m.role,
                content=m.content,
                tools_used=json.loads(m.tools_used) if m.tools_used else None,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.delete("/sessions/{session_id}")
def clear_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        from agent.setup import clear_session as clear_agent_session
        clear_agent_session(session_id)
    except Exception:
        pass

    deleted = crud.delete_session(db, session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"cleared": True, "session_id": session_id}


# ─── Report ─────────────────────────────

@router.post("/report", response_model=ReportResponse)
def generate_report(
    req: ReportRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if req.scope == "single" and not req.hs_code:
        raise HTTPException(status_code=400, detail="hs_code required when scope is 'single'")

    from ml import loader
    from services import forecast_service, analytics_service, report_service

    start_month = _next_month()

    if req.scope == "single":
        points = forecast_service.forecast_n_months(
            req.hs_code, start_month, req.horizon,
            req.macro.usd_pkr, req.macro.brent_oil, req.macro.us_confidence
        )
        forecast_data = [{
            "hs_code": req.hs_code,
            "commodity": loader.HS_LABELS[req.hs_code],
            "total_predicted_m": round(sum(p["predicted_m"] for p in points), 3),
        }]
        hs_for_seasonality = [req.hs_code]
    else:
        all_fc = forecast_service.forecast_all_commodities(
            start_month,
            req.macro.usd_pkr, req.macro.brent_oil, req.macro.us_confidence
        )
        forecast_data = all_fc[:5] if req.scope == "top5" else all_fc
        hs_for_seasonality = [r["hs_code"] for r in forecast_data]

    seasonality_data = [analytics_service.get_seasonality(hs) for hs in hs_for_seasonality]
    momentum_data = analytics_service.get_momentum()

    report_text = report_service.generate_report(
        scope=req.scope, horizon=req.horizon,
        usd_pkr=req.macro.usd_pkr, brent_oil=req.macro.brent_oil,
        us_conf=req.macro.us_confidence, tone=req.tone,
        forecast_data=forecast_data,
        seasonality_data=seasonality_data,
        momentum_data=momentum_data,
    )

    saved = crud.save_report(
        db, user_id=current_user["user_id"],
        scope=req.scope, horizon=req.horizon,
        usd_pkr=req.macro.usd_pkr, brent_oil=req.macro.brent_oil,
        us_confidence=req.macro.us_confidence, tone=req.tone,
        report_text=report_text, hs_code=req.hs_code, session_id=req.session_id,
    )

    return ReportResponse(
        report_id=saved.id, report_text=report_text,
        scope=req.scope, horizon=req.horizon, tone=req.tone,
        macro=req.macro, word_count=saved.word_count or 0,
        generated_at=saved.created_at,
    )


def _next_month() -> int:
    from datetime import date
    from dateutil.relativedelta import relativedelta
    d = date.today() + relativedelta(months=1)
    return d.year * 100 + d.month
