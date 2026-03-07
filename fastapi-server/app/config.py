from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Gateway base URL — all Lambda calls go through here
    api_gateway_url: str  # e.g. https://abc123.execute-api.us-east-1.amazonaws.com/prod

    # Optional API key if you secured API Gateway with an API key
    api_gateway_key: str = ""
    
    # SQL API Gateway URL for executeSqlQuery endpoint
    sql_api_gateway_url: str = ""  # e.g. https://xyz789.execute-api.us-east-1.amazonaws.com/Prod

    # AWS Configuration for DynamoDB
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    
    # DynamoDB Configuration
    dynamodb_table_name: str = "retail-ai-dashboards"
    dynamodb_endpoint_url: str = ""  # Empty for AWS, set for local DynamoDB
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:3000,https://main.d3u33ygukfpl43.amplifyapp.com"
    # Environment
    environment: str = "development"

    # Behaviour tuning
    session_ttl_seconds: int = 600  # warm-session window
    context_turns: int = 10  # history turns to inject when stale
    http_timeout: int = 120  # seconds to wait for Lambda response

    class Config:
        env_file = ".env"
        case_sensitive = False
        env_file_encoding = "utf-8"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def reload_settings() -> Settings:
    """Force reload settings by clearing cache. Useful during development."""
    get_settings.cache_clear()
    return get_settings()
