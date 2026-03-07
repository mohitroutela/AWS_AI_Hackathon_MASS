"""
Chat History Repository - Database operations for chat history management
Handles all DynamoDB operations related to chat messages
"""
from typing import Optional, List, Dict, Any
from boto3.dynamodb.conditions import Key
import logging

from app.database.dynamodb import DynamoDBClient

logger = logging.getLogger(__name__)


class ChatHistoryRepository:
    """Repository for chat history database operations"""
    
    def __init__(self, db_client: DynamoDBClient):
        self.db_client = db_client
    
    def create_chat_history(self, chat_history_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new chat history entry"""
        try:
            logger.info(f"Repository: Creating chat history for sessionId: {chat_history_data.get('sessionId')}")
            result = self.db_client.put_item(chat_history_data)
            logger.info(f"Repository: Chat history created successfully")
            return result
        except Exception as e:
            logger.error(f"Repository error creating chat history: {type(e).__name__} - {str(e)}", exc_info=True)
            raise
    
    def get_chat_history(self, history_id: str) -> Optional[Dict[str, Any]]:
        """Get chat history by history ID"""
        return self.db_client.get_item({'historyId': history_id})
    
    def get_chat_history_by_session(self, session_id: str, limit: int = -1) -> List[Dict[str, Any]]:
        """
        Get all chat history for a session in reverse chronological order.
        
        Args:
            session_id: Session identifier
            limit: Number of records to fetch. -1 means fetch all.
        
        Returns:
            List of chat history dictionaries (latest first)
        """
        try:
            # Query using GSI on sessionId
            if limit == -1:
                results = self.db_client.query(
                    key_condition_expression=Key('sessionId').eq(session_id),
                    index_name='sessionId-index',
                    scan_index_forward=False  # Reverse order (latest first)
                )
            else:
                results = self.db_client.query(
                    key_condition_expression=Key('sessionId').eq(session_id),
                    index_name='sessionId-index',
                    scan_index_forward=False,
                    limit=limit
                )
            
            return results
        except Exception as e:
            logger.error(f"Error getting chat history for session {session_id}: {str(e)}")
            raise
    
    def delete_chat_history(self, history_id: str) -> bool:
        """Delete chat history entry"""
        return self.db_client.delete_item({'historyId': history_id})
    
    def delete_chat_history_by_session(self, session_id: str) -> int:
        """
        Delete all chat history for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Number of items deleted
        """
        try:
            # Get all history items for the session
            history_items = self.get_chat_history_by_session(session_id)
            
            deleted_count = 0
            for item in history_items:
                history_id = item.get('historyId')
                if history_id:
                    self.delete_chat_history(history_id)
                    deleted_count += 1
            
            logger.info(f"Deleted {deleted_count} chat history items for session {session_id}")
            return deleted_count
        except Exception as e:
            logger.error(f"Error deleting chat history for session {session_id}: {str(e)}")
            raise


# Singleton instance
chat_history_repository = None


def get_chat_history_repository() -> ChatHistoryRepository:
    """Get or create chat history repository instance"""
    global chat_history_repository
    if chat_history_repository is None:
        from app.database.dynamodb import get_dynamodb_client
        # Use a separate client for chat_history table
        db_client = get_dynamodb_client(table_name='chat_history')
        chat_history_repository = ChatHistoryRepository(db_client)
    return chat_history_repository
