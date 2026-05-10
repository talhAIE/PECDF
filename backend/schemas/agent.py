from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from schemas.common import MacroInputs


# ─── Chat ───────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    session_id: Optional[str] = None    # None = create new session
    macro: MacroInputs = MacroInputs()


class ChatResponse(BaseModel):
    response: str
    session_id: str
    tools_used: list[str]
    embedded_data: Optional[dict] = None


# ─── Session history ────────────────────

class MessageItem(BaseModel):
    id: int
    role: str
    content: str
    tools_used: Optional[list[str]]
    created_at: datetime

    class Config:
        from_attributes = True


class SessionHistoryResponse(BaseModel):
    session_id: str
    message_count: int
    messages: list[MessageItem]


# ─── Report ─────────────────────────────

class ReportRequest(BaseModel):
    scope: Literal["single", "top5", "all"]
    hs_code: Optional[str] = None       # required when scope == "single"
    horizon: int = Field(3, ge=1, le=12)
    tone: Literal["executive", "technical"] = "executive"
    macro: MacroInputs = MacroInputs()
    session_id: Optional[str] = None


class ReportResponse(BaseModel):
    report_id: int
    report_text: str
    scope: str
    horizon: int
    tone: str
    macro: MacroInputs
    word_count: int
    generated_at: datetime
