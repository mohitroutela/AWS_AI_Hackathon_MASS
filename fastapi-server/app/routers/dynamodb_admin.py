from fastapi import APIRouter, HTTPException
import boto3
from botocore.exceptions import ClientError

from app.config import get_settings, reload_settings
from app.models.dynamodb_table import (
    CreateTableRequest,
    DeleteTableRequest,
    TableInfo
)

router = APIRouter(prefix="/dynamodb-admin", tags=["DynamoDB Admin"])


def _get_dynamodb_client():
    """Get DynamoDB client"""
    settings = get_settings()  # Get fresh settings each time
    return boto3.client(
        "dynamodb",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
        endpoint_url=settings.dynamodb_endpoint_url if settings.dynamodb_endpoint_url else None
    )


@router.post("/create-table")
async def create_table(request: CreateTableRequest) -> dict:
    """
    Create a new DynamoDB table with custom structure.
    
    Example request body:
    ```json
    {
        "table_name": "my-table",
        "attribute_definitions": [
            {"attribute_name": "id", "attribute_type": "S"},
            {"attribute_name": "timestamp", "attribute_type": "N"}
        ],
        "key_schema": [
            {"attribute_name": "id", "key_type": "HASH"},
            {"attribute_name": "timestamp", "key_type": "RANGE"}
        ],
        "billing_mode": "PROVISIONED",
        "read_capacity_units": 5,
        "write_capacity_units": 5
    }
    ```
    """
    try:
        dynamodb = _get_dynamodb_client()
        
        # Build attribute definitions
        attribute_definitions = [
            {
                "AttributeName": attr.attribute_name,
                "AttributeType": attr.attribute_type
            }
            for attr in request.attribute_definitions
        ]
        
        # Build key schema
        key_schema = [
            {
                "AttributeName": key.attribute_name,
                "KeyType": key.key_type
            }
            for key in request.key_schema
        ]
        
        # Build create table parameters
        create_params = {
            "TableName": request.table_name,
            "AttributeDefinitions": attribute_definitions,
            "KeySchema": key_schema
        }
        
        # Add billing mode
        if request.billing_mode == "PROVISIONED":
            create_params["ProvisionedThroughput"] = {
                "ReadCapacityUnits": request.read_capacity_units,
                "WriteCapacityUnits": request.write_capacity_units
            }
        else:
            create_params["BillingMode"] = "PAY_PER_REQUEST"
        
        # Add Global Secondary Indexes if provided
        if request.global_secondary_indexes:
            gsi_list = []
            for gsi in request.global_secondary_indexes:
                gsi_def = {
                    "IndexName": gsi.index_name,
                    "KeySchema": [
                        {
                            "AttributeName": key.attribute_name,
                            "KeyType": key.key_type
                        }
                        for key in gsi.key_schema
                    ],
                    "Projection": {
                        "ProjectionType": gsi.projection_type
                    }
                }
                
                if gsi.projection_type == "INCLUDE" and gsi.non_key_attributes:
                    gsi_def["Projection"]["NonKeyAttributes"] = gsi.non_key_attributes
                
                if request.billing_mode == "PROVISIONED":
                    gsi_def["ProvisionedThroughput"] = {
                        "ReadCapacityUnits": gsi.read_capacity_units,
                        "WriteCapacityUnits": gsi.write_capacity_units
                    }
                
                gsi_list.append(gsi_def)
            
            create_params["GlobalSecondaryIndexes"] = gsi_list
        
        # Add Local Secondary Indexes if provided
        if request.local_secondary_indexes:
            lsi_list = []
            for lsi in request.local_secondary_indexes:
                lsi_def = {
                    "IndexName": lsi.index_name,
                    "KeySchema": [
                        {
                            "AttributeName": key.attribute_name,
                            "KeyType": key.key_type
                        }
                        for key in lsi.key_schema
                    ],
                    "Projection": {
                        "ProjectionType": lsi.projection_type
                    }
                }
                
                if lsi.projection_type == "INCLUDE" and lsi.non_key_attributes:
                    lsi_def["Projection"]["NonKeyAttributes"] = lsi.non_key_attributes
                
                lsi_list.append(lsi_def)
            
            create_params["LocalSecondaryIndexes"] = lsi_list
        
        # Create the table
        response = dynamodb.create_table(**create_params)
        
        return {
            "status": "success",
            "message": f"Table '{request.table_name}' creation initiated",
            "table_arn": response["TableDescription"]["TableArn"],
            "table_status": response["TableDescription"]["TableStatus"],
            "note": "Table is being created. Use /list-tables or /describe-table to check status."
        }
        
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "Unknown")
        error_message = exc.response.get("Error", {}).get("Message", str(exc))
        
        if error_code == "ResourceInUseException":
            raise HTTPException(
                status_code=409,
                detail=f"Table '{request.table_name}' already exists"
            )
        
        raise HTTPException(
            status_code=400,
            detail=f"AWS Error ({error_code}): {error_message}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(exc)}"
        )


@router.get("/list-tables")
async def list_tables() -> dict:
    """List all DynamoDB tables in the configured region"""
    try:
        settings = get_settings()  # Get fresh settings
        dynamodb = _get_dynamodb_client()
        response = dynamodb.list_tables()
        
        return {
            "status": "success",
            "region": settings.aws_region,
            "table_count": len(response.get("TableNames", [])),
            "tables": response.get("TableNames", [])
        }
        
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "Unknown")
        error_message = exc.response.get("Error", {}).get("Message", str(exc))
        
        raise HTTPException(
            status_code=403,
            detail=f"AWS Error ({error_code}): {error_message}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(exc)}"
        )


@router.get("/describe-table/{table_name}")
async def describe_table(table_name: str) -> TableInfo:
    """Get detailed information about a specific table"""
    try:
        dynamodb = _get_dynamodb_client()
        response = dynamodb.describe_table(TableName=table_name)
        
        table_desc = response["Table"]
        
        return TableInfo(
            table_name=table_desc["TableName"],
            table_status=table_desc["TableStatus"],
            creation_date=str(table_desc["CreationDateTime"]),
            item_count=table_desc.get("ItemCount", 0),
            table_size_bytes=table_desc.get("TableSizeBytes", 0),
            key_schema=table_desc["KeySchema"],
            attribute_definitions=table_desc["AttributeDefinitions"],
            global_secondary_indexes=table_desc.get("GlobalSecondaryIndexes"),
            local_secondary_indexes=table_desc.get("LocalSecondaryIndexes")
        )
        
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "Unknown")
        
        if error_code == "ResourceNotFoundException":
            raise HTTPException(
                status_code=404,
                detail=f"Table '{table_name}' not found"
            )
        
        error_message = exc.response.get("Error", {}).get("Message", str(exc))
        raise HTTPException(
            status_code=403,
            detail=f"AWS Error ({error_code}): {error_message}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(exc)}"
        )


@router.delete("/delete-table")
async def delete_table(request: DeleteTableRequest) -> dict:
    """
    Delete a DynamoDB table.
    
    WARNING: This operation is irreversible and will delete all data in the table.
    """
    try:
        dynamodb = _get_dynamodb_client()
        
        response = dynamodb.delete_table(TableName=request.table_name)
        
        return {
            "status": "success",
            "message": f"Table '{request.table_name}' deletion initiated",
            "table_status": response["TableDescription"]["TableStatus"],
            "note": "Table is being deleted. This may take a few moments."
        }
        
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "Unknown")
        error_message = exc.response.get("Error", {}).get("Message", str(exc))
        
        if error_code == "ResourceNotFoundException":
            raise HTTPException(
                status_code=404,
                detail=f"Table '{request.table_name}' not found"
            )
        
        raise HTTPException(
            status_code=400,
            detail=f"AWS Error ({error_code}): {error_message}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(exc)}"
        )


@router.post("/wait-for-table/{table_name}")
async def wait_for_table(table_name: str, timeout_seconds: int = 300) -> dict:
    """
    Wait for a table to become ACTIVE.
    Useful after creating a table to ensure it's ready for use.
    """
    try:
        dynamodb = _get_dynamodb_client()
        
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(
            TableName=table_name,
            WaiterConfig={
                'Delay': 5,
                'MaxAttempts': timeout_seconds // 5
            }
        )
        
        # Get final table status
        response = dynamodb.describe_table(TableName=table_name)
        
        return {
            "status": "success",
            "message": f"Table '{table_name}' is now ACTIVE",
            "table_status": response["Table"]["TableStatus"]
        }
        
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "Unknown")
        error_message = exc.response.get("Error", {}).get("Message", str(exc))
        
        raise HTTPException(
            status_code=400,
            detail=f"AWS Error ({error_code}): {error_message}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Timeout or error waiting for table: {str(exc)}"
        )


@router.get("/config-check")
async def check_configuration() -> dict:
    """
    Check if all required AWS configuration values are set.
    This doesn't make any AWS calls - just validates the config.
    """
    settings = get_settings()
    
    config_status = {
        "aws_access_key_id": "✓ Set" if settings.aws_access_key_id else "✗ Missing",
        "aws_access_key_id_length": len(settings.aws_access_key_id) if settings.aws_access_key_id else 0,
        "aws_access_key_id_preview": settings.aws_access_key_id[:10] + "..." if settings.aws_access_key_id else "Not set",
        "aws_secret_access_key": "✓ Set" if settings.aws_secret_access_key else "✗ Missing",
        "aws_secret_access_key_length": len(settings.aws_secret_access_key) if settings.aws_secret_access_key else 0,
        "aws_secret_access_key_preview": settings.aws_secret_access_key[:5] + "..." if settings.aws_secret_access_key else "Not set",
        "app_aws_region": settings.aws_region,
        "dynamodb_table_name": settings.dynamodb_table_name if settings.dynamodb_table_name else "Not set",
    }
    
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


@router.post("/reload-config")
async def reload_configuration() -> dict:
    """
    Force reload configuration from .env file.
    Use this after updating credentials in .env without restarting the server.
    """
    settings = reload_settings()
    
    return {
        "status": "success",
        "message": "Configuration reloaded from .env file",
        "aws_access_key_preview": settings.aws_access_key_id[:10] + "..." if settings.aws_access_key_id else "Not set",
        "app_aws_region": settings.aws_region,
        "dynamodb_table_name": settings.dynamodb_table_name if settings.dynamodb_table_name else "Not set",
    }
