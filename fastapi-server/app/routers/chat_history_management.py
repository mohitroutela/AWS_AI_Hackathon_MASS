"""
Chat History Management Router
Handles CRUD operations for chat message history
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.chat_management import (
    ChatHistoryCreate, ChatHistoryResponse, ChatHistoryListResponse
)
from app.services.chat_history_service import chat_history_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat-history", tags=["chat-history-management"])


@router.post("/", response_model=ChatHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_history(chat_history: ChatHistoryCreate):
    """
    Create new chat history entry.
    
    Creates a new chat message with prompt, response, SQL query, and widget details.
    Auto-generates historyId and dateTime.
    """
    try:
        created_chat_history = chat_history_service.create_chat_history(chat_history)
        return ChatHistoryResponse(
            success=True,
            message="Chat history created successfully",
            data=created_chat_history
        )
    except Exception as e:
        logger.error(f"Error creating chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat history: {str(e)}"
        )


@router.get("/{history_id}", response_model=ChatHistoryResponse)
async def get_chat_history(history_id: str):
    """Get chat history by history ID"""
    try:
        chat_history = chat_history_service.get_chat_history(history_id)
        if not chat_history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chat history {history_id} not found"
            )
        return ChatHistoryResponse(
            success=True,
            message="Chat history retrieved successfully",
            data=chat_history
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat history {history_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat history: {str(e)}"
        )


@router.get("/session/{session_id}", response_model=ChatHistoryListResponse)
async def get_chat_history_by_session(session_id: str, limit: int = -1):
    """
    Get all chat history for a session in reverse chronological order (latest first).
    
    Parameters:
    - session_id: Session identifier
    - limit: Number of records to fetch
      - -1: Fetch all records (default)
      - positive number: Fetch that many records
      - 0 or other negative numbers: Invalid (returns 400 error)
    """
    try:
        # Validate limit parameter
        if limit == 0 or (limit < 0 and limit != -1):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid limit value: {limit}. Must be -1 (all) or a positive number."
            )
        
        chat_history_list = chat_history_service.get_chat_history_by_session(session_id, limit)
        return ChatHistoryListResponse(
            success=True,
            message="Chat history retrieved successfully",
            data=chat_history_list,
            total=len(chat_history_list)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat history for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat history: {str(e)}"
        )


@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_history(history_id: str):
    """Delete a specific chat history entry"""
    try:
        chat_history_service.delete_chat_history(history_id)
        return None
    except Exception as e:
        logger.error(f"Error deleting chat history {history_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chat history: {str(e)}"
        )


@router.delete("/session/{session_id}", status_code=status.HTTP_200_OK)
async def delete_chat_history_by_session(session_id: str):
    """Delete all chat history for a session"""
    try:
        deleted_count = chat_history_service.delete_chat_history_by_session(session_id)
        return {
            "success": True,
            "message": f"Deleted {deleted_count} chat history entries for session {session_id}",
            "deleted_count": deleted_count
        }
    except Exception as e:
        logger.error(f"Error deleting chat history for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chat history: {str(e)}"
        )
