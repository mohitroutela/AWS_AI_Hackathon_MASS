"""
Chat Details Service - Business logic for chat details management
"""
from typing import List, Optional
from datetime import datetime
import uuid
from app.models.chat_management import (
    ChatDetails, ChatDetailsCreate
)
from app.database.chat_details_repository import get_chat_details_repository
import logging

logger = logging.getLogger(__name__)


class ChatDetailsService:
    def __init__(self):
        self.repository = get_chat_details_repository()
    
    def create_chat_details(self, chat_details_data: ChatDetailsCreate) -> ChatDetails:
        """Create new chat details"""
        try:
            now = datetime.utcnow().isoformat()
            session_id = str(uuid.uuid4())
            
            chat_details_dict = {
                "sessionId": session_id,
                "sessionTitle": chat_details_data.sessionTitle,
                "sessionDescription": chat_details_data.sessionDescription,
                "userId": chat_details_data.userId,
                "createdAt": now,
                "updatedAt": now
            }
            
            logger.info(f"Creating chat details: {session_id} for user: {chat_details_data.userId}")
            created_chat_details = self.repository.create_chat_details(chat_details_dict)
            logger.info(f"Chat details created successfully: {session_id}")
            return ChatDetails(**created_chat_details)
        except Exception as e:
            logger.error(f"Error creating chat details: {type(e).__name__} - {str(e)}", exc_info=True)
            raise
    
    def get_chat_details(self, session_id: str) -> Optional[ChatDetails]:
        """Get chat details by session ID"""
        try:
            chat_details_data = self.repository.get_chat_details(session_id)
            if chat_details_data:
                return ChatDetails(**chat_details_data)
            return None
        except Exception as e:
            logger.error(f"Error getting chat details {session_id}: {str(e)}")
            raise
    
    def get_all_chat_details(self, limit: int = -1) -> List[ChatDetails]:
        """
        Get all chat details with optional limit.
        
        Args:
            limit: Number of records to fetch. -1 means fetch all.
        
        Returns:
            List of ChatDetails objects
        """
        try:
            chat_details_data = self.repository.get_all_chat_details(limit)
            return [ChatDetails(**details) for details in chat_details_data]
        except Exception as e:
            logger.error(f"Error getting all chat details: {str(e)}")
            raise
    
    def get_chat_details_by_user(self, user_id: str) -> List[ChatDetails]:
        """Get all chat details for a user"""
        try:
            chat_details_data = self.repository.get_chat_details_by_user(user_id)
            return [ChatDetails(**details) for details in chat_details_data]
        except Exception as e:
            logger.error(f"Error getting chat details for user {user_id}: {str(e)}")
            raise
    
    def delete_chat_details(self, session_id: str) -> bool:
        """Delete chat details"""
        try:
            return self.repository.delete_chat_details(session_id)
        except Exception as e:
            logger.error(f"Error deleting chat details {session_id}: {str(e)}")
            raise


chat_details_service = ChatDetailsService()
