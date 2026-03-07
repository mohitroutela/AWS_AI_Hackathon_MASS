from fastapi import APIRouter, HTTPException
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from app.config import get_settings, reload_settings

router = APIRouter(prefix="/test", tags=["testing"])

settings = get_settings()


@router.post("/reload-config")
async def reload_configuration() -> dict:
    """
    Force reload configuration from .env file.
    Use this after updating credentials in .env without restarting the server.
    """
    global settings
    settings = reload_settings()
    
    return {
        "status": "success",
        "message": "Configuration reloaded from .env file",
        "aws_access_key_preview": settings.aws_access_key_id[:10] + "..." if settings.aws_access_key_id else "Not set",
        "aws_region": settings.aws_region,
        "dynamodb_table_name": settings.dynamodb_table_name if settings.dynamodb_table_name else "Not set",
    }


@router.get("/dynamodb-connection")
async def test_dynamodb_connection() -> dict:
    """
    Test DynamoDB connection without requiring any specific table or schema.
    This endpoint verifies:
    1. AWS credentials are valid
    2. Can connect to DynamoDB service
    3. Can list tables (if any exist)
    """
    try:
        # Create DynamoDB client
        dynamodb = boto3.client(
            "dynamodb",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
        
        # Try to list tables - this is a simple operation that tests connectivity
        response = dynamodb.list_tables(Limit=10)
        
        tables = response.get("TableNames", [])
        
        result = {
            "status": "success",
            "message": "Successfully connected to DynamoDB",
            "region": settings.aws_region,
            "tables_found": len(tables),
            "tables": tables,
        }
        
        # Only check table existence if a table name is configured
        if settings.dynamodb_table_name:
            result["configured_table"] = settings.dynamodb_table_name
            result["table_exists"] = settings.dynamodb_table_name in tables
        else:
            result["note"] = "No table name configured. Update DYNAMODB_TABLE_NAME in .env with one of the tables listed above."
        
        return result
        
    except NoCredentialsError:
        raise HTTPException(
            status_code=401,
            detail="AWS credentials not found or invalid. Check your .env file.",
        )
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "Unknown")
        error_message = exc.response.get("Error", {}).get("Message", str(exc))
        
        # If ListTables is not allowed, provide helpful guidance
        if error_code == "AccessDeniedException" and "ListTables" in error_message:
            return {
                "status": "partial_success",
                "message": "Credentials are valid but ListTables permission is not granted",
                "region": settings.aws_region,
                "iam_user": exc.response.get("Error", {}).get("Message", "").split("User: ")[1].split(" is not")[0] if "User: " in error_message else "Unknown",
                "note": "Your IAM user doesn't have ListTables permission. Please provide the table name to continue testing.",
                "next_steps": [
                    "Ask your AWS admin for the DynamoDB table name",
                    "Update DYNAMODB_TABLE_NAME in .env file",
                    "Use /test/dynamodb-table-info/{table_name} to test access to that specific table"
                ],
            }
        
        raise HTTPException(
            status_code=403,
            detail=f"AWS Error ({error_code}): {error_message}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(exc)}",
        )


@router.get("/dynamodb-table-info/{table_name}")
async def get_table_info(table_name: str = None) -> dict:
    """
    Get detailed information about a DynamoDB table.
    This will show the table schema, keys, and attributes.
    
    Args:
        table_name: Name of the table to inspect (optional, uses configured table if not provided)
    """
    # Use provided table name or fall back to configured one
    target_table = table_name or settings.dynamodb_table_name
    
    if not target_table:
        raise HTTPException(
            status_code=400,
            detail="No table name provided. Either pass a table name in the URL or set DYNAMODB_TABLE_NAME in .env",
        )
    
    try:
        dynamodb = boto3.client(
            "dynamodb",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
        
        # Describe the table
        response = dynamodb.describe_table(TableName=target_table)
        
        table_info = response.get("Table", {})
        
        # Extract key information
        key_schema = table_info.get("KeySchema", [])
        attribute_definitions = table_info.get("AttributeDefinitions", [])
        table_status = table_info.get("TableStatus", "UNKNOWN")
        item_count = table_info.get("ItemCount", 0)
        
        return {
            "status": "success",
            "table_name": target_table,
            "table_status": table_status,
            "item_count": item_count,
            "key_schema": key_schema,
            "attribute_definitions": attribute_definitions,
            "creation_date": str(table_info.get("CreationDateTime", "")),
        }
        
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "Unknown")
        
        if error_code == "ResourceNotFoundException":
            raise HTTPException(
                status_code=404,
                detail=f"Table '{target_table}' does not exist in region {settings.aws_region}",
            )
        
        error_message = exc.response.get("Error", {}).get("Message", str(exc))
        raise HTTPException(
            status_code=403,
            detail=f"AWS Error ({error_code}): {error_message}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(exc)}",
        )


@router.get("/config-check")
async def check_configuration() -> dict:
    """
    Check if all required configuration values are set.
    This doesn't make any AWS calls - just validates the config.
    """
    config_status = {
        "aws_access_key_id": "✓ Set" if settings.aws_access_key_id else "✗ Missing",
        "aws_access_key_id_length": len(settings.aws_access_key_id) if settings.aws_access_key_id else 0,
        "aws_access_key_id_preview": settings.aws_access_key_id[:10] + "..." if settings.aws_access_key_id else "Not set",
        "aws_secret_access_key": "✓ Set" if settings.aws_secret_access_key else "✗ Missing",
        "aws_secret_access_key_length": len(settings.aws_secret_access_key) if settings.aws_secret_access_key else 0,
        "aws_secret_access_key_preview": settings.aws_secret_access_key[:5] + "..." if settings.aws_secret_access_key else "Not set",
        "aws_region": settings.aws_region,
        "dynamodb_table_name": settings.dynamodb_table_name if settings.dynamodb_table_name else "Not set (will be discovered)",
    }
    
    # For testing, we only need credentials and region
    all_configured = all([
        settings.aws_access_key_id,
        settings.aws_secret_access_key,
        settings.aws_region,
    ])
    
    # Check for common issues
    issues = []
    if settings.aws_access_key_id and len(settings.aws_access_key_id) != 20:
        issues.append(f"Access Key ID should be 20 characters, found {len(settings.aws_access_key_id)}")
    if settings.aws_secret_access_key and len(settings.aws_secret_access_key) != 40:
        issues.append(f"Secret Access Key should be 40 characters, found {len(settings.aws_secret_access_key)}")
    if settings.aws_access_key_id and (' ' in settings.aws_access_key_id or '\n' in settings.aws_access_key_id):
        issues.append("Access Key ID contains whitespace - check for extra spaces")
    if settings.aws_secret_access_key and (' ' in settings.aws_secret_access_key or '\n' in settings.aws_secret_access_key):
        issues.append("Secret Access Key contains whitespace - check for extra spaces")
    
    return {
        "status": "ready" if all_configured else "incomplete",
        "configuration": config_status,
        "message": "All AWS settings configured" if all_configured else "Some AWS settings are missing",
        "issues": issues if issues else None,
    }
