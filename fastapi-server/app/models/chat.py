from typing import Any, Optional

import uuid
from pydantic import BaseModel, Field


# ── Inbound (Streamlit → FastAPI) ──────────────────────────────────────────────


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: Optional[str] = Field(default=None)
    user_id: Optional[str] = Field(default="default_user")  # Add user_id field


class DashboardRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))


# ── Outbound (FastAPI → Streamlit) ─────────────────────────────────────────────


class ChatResponse(BaseModel):
    response: str
    session_id: str
    context_injected: bool = False  # True when history was re-injected


class TransformedChatResponse(BaseModel):
    """Transformed response for frontend consumption"""
    insight: str
    widget_type: str
    chart_type: Optional[str] = None
    session_id: str
    context_injected: bool = False
    conversation_id: str
    data: Any  # Visualization-specific config (list of dicts for summary_card, etc.)
    widgetId: str


class DashboardResponse(BaseModel):
    session_id: str
    active_filters: str
    dashboard_data: dict[str, Any]


