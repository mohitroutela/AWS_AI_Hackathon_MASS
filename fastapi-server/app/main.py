from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import chat, dashboard, dashboard_management, dynamodb_admin, chat_details_management, chat_history_management

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="Retail Analytics Chatbot & Dashboard Management",
    description="FastAPI orchestrator — calls AWS via API Gateway & manages dashboards",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    root_path="/Prod" 
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(dashboard.router)
app.include_router(dashboard_management.router)
app.include_router(dynamodb_admin.router)
app.include_router(chat_details_management.router)
app.include_router(chat_history_management.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Retail Analytics API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "api_gateway": settings.api_gateway_url,
        "environment": settings.environment
    }


# AWS Lambda handler (optional - only needed for Lambda deployment)
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    pass  # Mangum not installed, skip Lambda handler (for local development)
