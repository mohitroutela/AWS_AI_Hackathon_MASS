"""
Chat Details Repository - Database operations for chat details management
Handles all DynamoDB operations related to chat sessions
"""
from typing import Optional, List, Dict, Any
from boto3.dynamodb.conditions import Key
import logging

from app.database.dynamodb import DynamoDBClient

logger = logging.getLogger(__name__)


class ChatDetailsRepository:
    """Repository for chat details database operations"""
    
    def __init__(self, db_client: DynamoDBClient):
        self.db_client = db_client
    
    def create_chat_details(self, chat_details_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new chat details"""
        try:
            logger.info(f"Repository: Creating chat details with sessionId: {chat_details_data.get('sessionId')}")
            result = self.db_client.put_item(chat_details_data)
            logger.info(f"Repository: Chat details created successfully")
            return result
        except Exception as e:
            logger.error(f"Repository error creating chat details: {type(e).__name__} - {str(e)}", exc_info=True)
            raise
    
    def get_chat_details(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get chat details by session ID"""
        return self.db_client.get_item({'sessionId': session_id})
    
    def get_all_chat_details(self, limit: int = -1) -> List[Dict[str, Any]]:
        """
        Get all chat details with optional limit.
        
        Args:
            limit: Number of records to fetch. -1 means fetch all.
        
        Returns:
            List of chat details dictionaries
        """
        if limit == -1:
            return self.db_client.scan()
        else:
            return self.db_client.scan(limit=limit)
    
    def get_chat_details_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all chat details for a user"""
        return self.db_client.query(
            key_condition_expression=Key('userId').eq(user_id),
            index_name='userId-index'
        )
    
    def update_chat_details(self, session_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing chat details"""
        return self.db_client.update_item({'sessionId': session_id}, update_data)
    
    def delete_chat_details(self, session_id: str) -> bool:
        """Delete chat details"""
        return self.db_client.delete_item({'sessionId': session_id})


# Singleton instance
chat_details_repository = None


def get_chat_details_repository() -> ChatDetailsRepository:
    """Get or create chat details repository instance"""
    global chat_details_repository
    if chat_details_repository is None:
        from app.database.dynamodb import get_dynamodb_client
        # Use a separate client for chat_details table
        db_client = get_dynamodb_client(table_name='chat_details')
        chat_details_repository = ChatDetailsRepository(db_client)
    return chat_details_repository
