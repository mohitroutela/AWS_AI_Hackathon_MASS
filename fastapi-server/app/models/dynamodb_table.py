from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class AttributeDefinition(BaseModel):
    """DynamoDB attribute definition"""
    attribute_name: str = Field(..., description="Name of the attribute")
    attribute_type: Literal["S", "N", "B"] = Field(..., description="Attribute type: S (String), N (Number), B (Binary)")


class KeySchema(BaseModel):
    """DynamoDB key schema"""
    attribute_name: str = Field(..., description="Name of the attribute")
    key_type: Literal["HASH", "RANGE"] = Field(..., description="Key type: HASH (partition key) or RANGE (sort key)")


class GlobalSecondaryIndex(BaseModel):
    """DynamoDB Global Secondary Index"""
    index_name: str = Field(..., description="Name of the index")
    key_schema: List[KeySchema] = Field(..., description="Key schema for the index")
    projection_type: Literal["ALL", "KEYS_ONLY", "INCLUDE"] = Field(default="ALL", description="Projection type")
    non_key_attributes: Optional[List[str]] = Field(default=None, description="Non-key attributes to project (only for INCLUDE)")
    read_capacity_units: int = Field(default=5, description="Read capacity units")
    write_capacity_units: int = Field(default=5, description="Write capacity units")


class LocalSecondaryIndex(BaseModel):
    """DynamoDB Local Secondary Index"""
    index_name: str = Field(..., description="Name of the index")
    key_schema: List[KeySchema] = Field(..., description="Key schema for the index")
    projection_type: Literal["ALL", "KEYS_ONLY", "INCLUDE"] = Field(default="ALL", description="Projection type")
    non_key_attributes: Optional[List[str]] = Field(default=None, description="Non-key attributes to project (only for INCLUDE)")


class CreateTableRequest(BaseModel):
    """Request model for creating a DynamoDB table"""
    table_name: str = Field(..., description="Name of the table to create")
    attribute_definitions: List[AttributeDefinition] = Field(..., description="Attribute definitions")
    key_schema: List[KeySchema] = Field(..., description="Key schema (partition key and optional sort key)")
    global_secondary_indexes: Optional[List[GlobalSecondaryIndex]] = Field(default=None, description="Global secondary indexes")
    local_secondary_indexes: Optional[List[LocalSecondaryIndex]] = Field(default=None, description="Local secondary indexes")
    billing_mode: Literal["PROVISIONED", "PAY_PER_REQUEST"] = Field(default="PROVISIONED", description="Billing mode")
    read_capacity_units: int = Field(default=5, description="Read capacity units (only for PROVISIONED mode)")
    write_capacity_units: int = Field(default=5, description="Write capacity units (only for PROVISIONED mode)")


class TableInfo(BaseModel):
    """Response model for table information"""
    table_name: str
    table_status: str
    creation_date: str
    item_count: int
    table_size_bytes: int
    key_schema: List[dict]
    attribute_definitions: List[dict]
    global_secondary_indexes: Optional[List[dict]] = None
    local_secondary_indexes: Optional[List[dict]] = None


class DeleteTableRequest(BaseModel):
    """Request model for deleting a table"""
    table_name: str = Field(..., description="Name of the table to delete")
