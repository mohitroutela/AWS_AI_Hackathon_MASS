"""
Chat History Service - Business logic for chat history management
"""
from typing import List, Optional
from datetime import datetime
import uuid
from app.models.chat_management import (
    ChatHistory, ChatHistoryCreate
)
from app.database.chat_history_repository import get_chat_history_repository
import logging

logger = logging.getLogger(__name__)


class ChatHistoryService:
    def __init__(self):
        self.repository = get_chat_history_repository()
    
    def create_chat_history(self, chat_history_data: ChatHistoryCreate) -> ChatHistory:
        """Create new chat history entry"""
        try:
            now = datetime.utcnow().isoformat()
            history_id = str(uuid.uuid4())
            
            chat_history_dict = {
                "historyId": history_id,
                "sessionId": chat_history_data.sessionId,
                "prompt": chat_history_data.prompt,
                "response": chat_history_data.response,
                "sqlQuery": chat_history_data.sqlQuery,
                "widgetDetails": chat_history_data.widgetDetails.dict() if chat_history_data.widgetDetails else None,
                "dateTime": now
            }
            
            logger.info(f"Creating chat history: {history_id} for session: {chat_history_data.sessionId}")
            created_chat_history = self.repository.create_chat_history(chat_history_dict)
            logger.info(f"Chat history created successfully: {history_id}")
            return ChatHistory(**created_chat_history)
        except Exception as e:
            logger.error(f"Error creating chat history: {type(e).__name__} - {str(e)}", exc_info=True)
            raise
    
    def get_chat_history(self, history_id: str) -> Optional[ChatHistory]:
        """Get chat history by history ID"""
        try:
            chat_history_data = self.repository.get_chat_history(history_id)
            if chat_history_data:
                return ChatHistory(**chat_history_data)
            return None
        except Exception as e:
            logger.error(f"Error getting chat history {history_id}: {str(e)}")
            raise
    
    def get_chat_history_by_session(self, session_id: str, limit: int = -1) -> List[ChatHistory]:
        """
        Get all chat history for a session in reverse chronological order.
        
        Args:
            session_id: Session identifier
            limit: Number of records to fetch. -1 means fetch all.
        
        Returns:
            List of ChatHistory objects (latest first)
        """
        try:
            chat_history_data = self.repository.get_chat_history_by_session(session_id, limit)
            return [ChatHistory(**history) for history in chat_history_data]
        except Exception as e:
            logger.error(f"Error getting chat history for session {session_id}: {str(e)}")
            raise
    
    def delete_chat_history(self, history_id: str) -> bool:
        """Delete chat history entry"""
        try:
            return self.repository.delete_chat_history(history_id)
        except Exception as e:
            logger.error(f"Error deleting chat history {history_id}: {str(e)}")
            raise
    
    def delete_chat_history_by_session(self, session_id: str) -> int:
        """Delete all chat history for a session"""
        try:
            return self.repository.delete_chat_history_by_session(session_id)
        except Exception as e:
            logger.error(f"Error deleting chat history for session {session_id}: {str(e)}")
            raise


chat_history_service = ChatHistoryService()
