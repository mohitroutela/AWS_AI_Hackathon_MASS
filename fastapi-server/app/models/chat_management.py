"""
Chat Management Models
Models for chat details and chat history management
"""
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ── Widget Models (shared with dashboard) ──────────────────────────────────────


class WidgetDetails(BaseModel):
    """Widget details stored in chat history"""
    widgetId: str
    widgetType: str  # summary_card, chart, grid
    widgetData: Any  # Visualization-specific data


# ── Chat Details Models ─────────────────────────────────────────────────────────


class ChatDetailsBase(BaseModel):
    """Base model for chat details"""
    sessionTitle: str = Field(..., min_length=1, max_length=200)
    sessionDescription: Optional[str] = Field(None, max_length=1000)
    userId: str


class ChatDetailsCreate(ChatDetailsBase):
    """Model for creating chat details"""
    pass


class ChatDetails(ChatDetailsBase):
    """Complete chat details model"""
    sessionId: str
    createdAt: str
    updatedAt: str


# ── Chat History Models ─────────────────────────────────────────────────────────


class ChatHistoryBase(BaseModel):
    """Base model for chat history"""
    prompt: str = Field(..., min_length=1)
    response: str
    sqlQuery: Optional[str] = None
    widgetDetails: Optional[WidgetDetails] = None


class ChatHistoryCreate(ChatHistoryBase):
    """Model for creating chat history"""
    sessionId: str


class ChatHistory(ChatHistoryBase):
    """Complete chat history model"""
    historyId: str
    sessionId: str
    dateTime: str


# ── Response Models ─────────────────────────────────────────────────────────────


class ChatDetailsResponse(BaseModel):
    """Response model for chat details operations"""
    success: bool
    message: str
    data: Optional[ChatDetails] = None


class ChatDetailsListResponse(BaseModel):
    """Response model for list of chat details"""
    success: bool
    message: str
    data: List[ChatDetails]
    total: int


class ChatHistoryResponse(BaseModel):
    """Response model for chat history operations"""
    success: bool
    message: str
    data: Optional[ChatHistory] = None


class ChatHistoryListResponse(BaseModel):
    """Response model for list of chat history"""
    success: bool
    message: str
    data: List[ChatHistory]
    total: int
