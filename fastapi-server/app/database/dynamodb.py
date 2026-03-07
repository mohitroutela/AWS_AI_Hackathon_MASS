import boto3
from boto3.dynamodb.conditions import Key
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)

settings = get_settings()


def _convert_decimals(obj: Any) -> Any:
    """Convert Decimal objects to float for JSON serialization."""
    if isinstance(obj, list):
        return [_convert_decimals(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: _convert_decimals(value) for key, value in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    return obj


class DynamoDBClient:
    """Generic DynamoDB client for all table operations"""
    
    def __init__(self, table_name: Optional[str] = None):
        self.dynamodb = None
        self.table = None
        self.table_name = table_name or settings.dynamodb_table_name
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize DynamoDB client and table"""
        try:
            # Create DynamoDB resource
            if settings.dynamodb_endpoint_url:
                # Local DynamoDB
                self.dynamodb = boto3.resource(
                    'dynamodb',
                    endpoint_url=settings.dynamodb_endpoint_url,
                    region_name=settings.aws_region,
                    aws_access_key_id=settings.aws_access_key_id or 'dummy',
                    aws_secret_access_key=settings.aws_secret_access_key or 'dummy'
                )
            else:
                # AWS DynamoDB
                self.dynamodb = boto3.resource(
                    'dynamodb',
                    region_name=settings.aws_region
                    # aws_access_key_id=settings.aws_access_key_id,  # Use IAM role or env vars for AWS credentials
                    # aws_secret_access_key=settings.aws_secret_access_key #use IAM role or env vars for AWS credentials
                )
            
            self.table = self.dynamodb.Table(self.table_name)
            logger.info(f"Connected to DynamoDB table: {self.table_name}")
        except Exception as e:
            logger.error(f"Failed to initialize DynamoDB client: {str(e)}")
            raise
    
    # ========== Generic CRUD Operations ==========
    
    def get_item(self, key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Generic get item by key"""
        try:
            response = self.table.get_item(Key=key)
            item = response.get('Item')
            return _convert_decimals(item) if item else None
        except Exception as e:
            logger.error(f"Error getting item {key}: {str(e)}")
            raise
    
    def put_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Generic put item"""
        try:
            self.table.put_item(Item=item)
            return item
        except Exception as e:
            logger.error(f"Error putting item: {str(e)}")
            raise
    
    def delete_item(self, key: Dict[str, Any]) -> bool:
        """Generic delete item by key"""
        try:
            self.table.delete_item(Key=key)
            return True
        except Exception as e:
            logger.error(f"Error deleting item {key}: {str(e)}")
            raise
    
    def query(
        self,
        key_condition_expression,
        index_name: Optional[str] = None,
        scan_index_forward: bool = True,
        limit: Optional[int] = None,
        projection_expression: Optional[str] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        """Generic query operation"""
        try:
            query_params = {
                'KeyConditionExpression': key_condition_expression,
                'ScanIndexForward': scan_index_forward
            }
            
            if index_name:
                query_params['IndexName'] = index_name
            if limit:
                query_params['Limit'] = limit
            if projection_expression:
                query_params['ProjectionExpression'] = projection_expression
            if expression_attribute_names:
                query_params['ExpressionAttributeNames'] = expression_attribute_names
            
            response = self.table.query(**query_params)
            items = response.get('Items', [])
            return [_convert_decimals(item) for item in items]
        except Exception as e:
            logger.error(f"Error querying table: {str(e)}")
            raise
    
    def scan(
        self,
        limit: Optional[int] = None,
        projection_expression: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generic scan operation"""
        try:
            scan_params = {}
            if limit:
                scan_params['Limit'] = limit
            if projection_expression:
                scan_params['ProjectionExpression'] = projection_expression
            
            response = self.table.scan(**scan_params)
            items = response.get('Items', [])
            return [_convert_decimals(item) for item in items]
        except Exception as e:
            logger.error(f"Error scanning table: {str(e)}")
            raise
    
    def update_item(
        self,
        key: Dict[str, Any],
        update_data: Dict[str, Any],
        return_values: str = "ALL_NEW"
    ) -> Dict[str, Any]:
        """Generic update item with dynamic update expression"""
        try:
            # Build update expression
            update_expression = "SET "
            expression_attribute_values = {}
            expression_attribute_names = {}
            
            # Get primary key attribute names to exclude from updates
            key_attrs = set(key.keys())
            
            for attr_key, value in update_data.items():
                if attr_key not in key_attrs:  # Don't update primary keys
                    placeholder = f"#{attr_key}"
                    value_placeholder = f":{attr_key}"
                    update_expression += f"{placeholder} = {value_placeholder}, "
                    expression_attribute_names[placeholder] = attr_key
                    expression_attribute_values[value_placeholder] = value
            
            # Remove trailing comma and space
            update_expression = update_expression.rstrip(", ")
            
            response = self.table.update_item(
                Key=key,
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues=return_values
            )
            return _convert_decimals(response.get('Attributes'))
        except Exception as e:
            logger.error(f"Error updating item {key}: {str(e)}")
            raise
    
    def batch_delete(self, keys: List[Dict[str, Any]]) -> None:
        """Generic batch delete operation"""
        try:
            with self.table.batch_writer() as batch:
                for key in keys:
                    batch.delete_item(Key=key)
        except Exception as e:
            logger.error(f"Error batch deleting items: {str(e)}")
            raise
    
    
    
    
    
    
    
    
    
    
    
    


# Singleton instance
db_client = DynamoDBClient()


# Helper function for creating clients with different tables
def get_dynamodb_client(table_name: Optional[str] = None) -> DynamoDBClient:
    """
    Get a DynamoDB client for a specific table.
    
    Args:
        table_name: Name of the table. If None, uses default from settings.
    
    Returns:
        DynamoDBClient instance
    """
    return DynamoDBClient(table_name=table_name)
