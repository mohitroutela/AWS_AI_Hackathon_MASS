from typing import Any, Dict, List
from datetime import datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from app.config import get_settings

settings = get_settings()


def _get_dynamodb_resource():
    """Create and return a DynamoDB resource with credentials from settings."""
    return boto3.resource(
        "dynamodb",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )


def _get_table():
    """Get the DynamoDB table instance."""
    dynamodb = _get_dynamodb_resource()
    return dynamodb.Table(settings.dynamodb_table_name)


def _convert_decimals(obj: Any) -> Any:
    """Convert Decimal objects to float for JSON serialization."""
    if isinstance(obj, list):
        return [_convert_decimals(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: _convert_decimals(value) for key, value in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    return obj


async def save_message(session_id: str, role: str, content: str) -> None:
    """
    Save a message to DynamoDB.
    
    Table schema expected:
    - partition key: session_id (String)
    - sort key: timestamp (Number)
    - attributes: role (String), content (String)
    """
    try:
        table = _get_table()
        timestamp = int(datetime.utcnow().timestamp() * 1000)  # milliseconds
        
        table.put_item(
            Item={
                "session_id": session_id,
                "timestamp": timestamp,
                "role": role,
                "content": content,
            }
        )
        print(f"[dynamodb] saved message for session {session_id[:8]}")
    except ClientError as exc:
        print(f"[dynamodb] save failed: {exc}")
        raise


async def get_history(session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Retrieve conversation history from DynamoDB.
    
    Returns list of messages sorted by timestamp (oldest first).
    """
    try:
        table = _get_table()
        
        response = table.query(
            KeyConditionExpression=Key("session_id").eq(session_id),
            ScanIndexForward=True,  # ascending order (oldest first)
            Limit=limit,
        )
        
        items = response.get("Items", [])
        
        # Convert to the expected format and handle Decimal types
        messages = []
        for item in items:
            messages.append({
                "role": item.get("role"),
                "content": item.get("content"),
                "timestamp": _convert_decimals(item.get("timestamp")),
            })
        
        print(f"[dynamodb] retrieved {len(messages)} messages for session {session_id[:8]}")
        return messages
        
    except ClientError as exc:
        print(f"[dynamodb] get_history failed: {exc}")
        raise


async def delete_session_history(session_id: str) -> None:
    """Delete all messages for a given session."""
    try:
        table = _get_table()
        
        # First, query to get all items for this session
        response = table.query(
            KeyConditionExpression=Key("session_id").eq(session_id),
            ProjectionExpression="session_id, #ts",
            ExpressionAttributeNames={"#ts": "timestamp"},
        )
        
        # Delete each item
        with table.batch_writer() as batch:
            for item in response.get("Items", []):
                batch.delete_item(
                    Key={
                        "session_id": item["session_id"],
                        "timestamp": item["timestamp"],
                    }
                )
        
        print(f"[dynamodb] deleted history for session {session_id[:8]}")
        
    except ClientError as exc:
        print(f"[dynamodb] delete_session_history failed: {exc}")
        raise


async def list_sessions(limit: int = 50) -> List[str]:
    """
    List all unique session IDs.
    Note: This requires a scan which can be expensive for large tables.
    Consider using a GSI on session_id if you need this frequently.
    """
    try:
        table = _get_table()
        
        response = table.scan(
            ProjectionExpression="session_id",
            Limit=limit,
        )
        
        # Extract unique session IDs
        session_ids = list(set(item["session_id"] for item in response.get("Items", [])))
        
        print(f"[dynamodb] found {len(session_ids)} unique sessions")
        return session_ids
        
    except ClientError as exc:
        print(f"[dynamodb] list_sessions failed: {exc}")
        raise
