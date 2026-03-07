"""
Chat Repository - Database operations for chat history
Handles all DynamoDB operations related to chat sessions and messages
"""
from typing import List, Dict, Any
from datetime import datetime
from boto3.dynamodb.conditions import Key
import logging

from app.database.dynamodb import DynamoDBClient

logger = logging.getLogger(__name__)


class ChatRepository:
    """Repository for chat history database operations"""
    
    def __init__(self, db_client: DynamoDBClient):
        self.db_client = db_client
    
    async def save_message(self, session_id: str, role: str, content: str) -> None:
        """
        Save a message to DynamoDB.
        
        Table schema expected:
        - partition key: session_id (String)
        - sort key: timestamp (Number)
        - attributes: role (String), content (String)
        """
        try:
            timestamp = int(datetime.utcnow().timestamp() * 1000)  # milliseconds
            
            self.db_client.table.put_item(
                Item={
                    "session_id": session_id,
                    "timestamp": timestamp,
                    "role": role,
                    "content": content,
                }
            )
            logger.info(f"[chat_repo] saved message for session {session_id[:8]}")
        except Exception as exc:
            logger.error(f"[chat_repo] save failed: {exc}")
            raise
    
    async def get_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieve conversation history from DynamoDB.
        
        Returns list of messages sorted by timestamp (oldest first).
        """
        try:
            messages = self.db_client.query(
                key_condition_expression=Key("session_id").eq(session_id),
                scan_index_forward=True,  # ascending order (oldest first)
                limit=limit
            )
            
            # Convert to the expected format
            result = []
            for item in messages:
                result.append({
                    "role": item.get("role"),
                    "content": item.get("content"),
                    "timestamp": item.get("timestamp"),
                })
            
            logger.info(f"[chat_repo] retrieved {len(result)} messages for session {session_id[:8]}")
            return result
            
        except Exception as exc:
            logger.error(f"[chat_repo] get_history failed: {exc}")
            raise
    
    async def delete_session_history(self, session_id: str) -> None:
        """Delete all messages for a given session."""
        try:
            # Query to get all items for this session
            items = self.db_client.query(
                key_condition_expression=Key("session_id").eq(session_id),
                projection_expression="session_id, #ts",
                expression_attribute_names={"#ts": "timestamp"}
            )
            
            # Build keys for batch delete
            keys = [
                {
                    "session_id": item["session_id"],
                    "timestamp": item["timestamp"]
                }
                for item in items
            ]
            
            # Delete items
            if keys:
                self.db_client.batch_delete(keys)
            
            logger.info(f"[chat_repo] deleted history for session {session_id[:8]}")
            
        except Exception as exc:
            logger.error(f"[chat_repo] delete_session_history failed: {exc}")
            raise
    
    async def list_sessions(self, limit: int = 50) -> List[str]:
        """
        List all unique session IDs.
        Note: This requires a scan which can be expensive for large tables.
        """
        try:
            items = self.db_client.scan(
                projection_expression="session_id",
                limit=limit
            )
            
            # Extract unique session IDs
            session_ids = list(set(item["session_id"] for item in items))
            
            logger.info(f"[chat_repo] found {len(session_ids)} unique sessions")
            return session_ids
            
        except Exception as exc:
            logger.error(f"[chat_repo] list_sessions failed: {exc}")
            raise


# Singleton instance
chat_repository = None


def get_chat_repository() -> ChatRepository:
    """Get or create chat repository instance"""
    global chat_repository
    if chat_repository is None:
        from app.database.dynamodb import db_client
        chat_repository = ChatRepository(db_client)
    return chat_repository
