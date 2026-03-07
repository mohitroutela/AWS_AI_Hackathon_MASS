"""
Chat Details Management Router
Handles CRUD operations for chat session details
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.chat_management import (
    ChatDetailsCreate, ChatDetailsResponse, ChatDetailsListResponse
)
from app.services.chat_details_service import chat_details_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat-details", tags=["chat-details-management"])


@router.post("/", response_model=ChatDetailsResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_details(chat_details: ChatDetailsCreate):
    """
    Create new chat details.
    
    Creates a new chat session with title, description, and user ID.
    Auto-generates sessionId, createdAt, and updatedAt.
    """
    try:
        created_chat_details = chat_details_service.create_chat_details(chat_details)
        return ChatDetailsResponse(
            success=True,
            message="Chat details created successfully",
            data=created_chat_details
        )
    except Exception as e:
        logger.error(f"Error creating chat details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat details: {str(e)}"
        )


@router.get("/{session_id}", response_model=ChatDetailsResponse)
async def get_chat_details(session_id: str):
    """Get chat details by session ID"""
    try:
        chat_details = chat_details_service.get_chat_details(session_id)
        if not chat_details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chat details for session {session_id} not found"
            )
        return ChatDetailsResponse(
            success=True,
            message="Chat details retrieved successfully",
            data=chat_details
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat details {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat details: {str(e)}"
        )


@router.get("/", response_model=ChatDetailsListResponse)
async def get_all_chat_details(limit: int = -1):
    """
    Get all chat details with optional limit.
    
    Parameters:
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
        
        chat_details_list = chat_details_service.get_all_chat_details(limit)
        return ChatDetailsListResponse(
            success=True,
            message="Chat details retrieved successfully",
            data=chat_details_list,
            total=len(chat_details_list)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting all chat details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat details: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=ChatDetailsListResponse)
async def get_chat_details_by_user(user_id: str):
    """Get all chat details for a specific user"""
    try:
        chat_details_list = chat_details_service.get_chat_details_by_user(user_id)
        return ChatDetailsListResponse(
            success=True,
            message="Chat details retrieved successfully",
            data=chat_details_list,
            total=len(chat_details_list)
        )
    except Exception as e:
        logger.error(f"Error getting chat details for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat details: {str(e)}"
        )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_details(session_id: str):
    """Delete chat details"""
    try:
        chat_details_service.delete_chat_details(session_id)
        return None
    except Exception as e:
        logger.error(f"Error deleting chat details {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chat details: {str(e)}"
        )
