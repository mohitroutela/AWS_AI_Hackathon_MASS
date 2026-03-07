from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
import json
import os
from pathlib import Path
from app.models.dashboard import (
    Dashboard, DashboardCreate, DashboardUpdate,
    DashboardResponse, DashboardListResponse,
    WidgetCreate, Widget
)
from app.services.dashboard_service import dashboard_service
from app.services import gateway_client as gw
from app.services.chat_transformer import chat_transformer
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboards", tags=["dashboard-management"])


def load_default_dashboard_config() -> dict:
    """Load default dashboard configuration from JSON file"""
    config_path = Path(__file__).parent.parent.parent / "configs" / "default_dashboard_config.json"
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load default dashboard config: {str(e)}")
        raise


@router.post("/", response_model=DashboardResponse, status_code=status.HTTP_201_CREATED)
async def create_dashboard(dashboard: Optional[DashboardCreate] = None, use_default: bool = False):
    """
    Create a new dashboard.
    
    Parameters:
    - dashboard: Custom dashboard configuration (optional)
    - use_default: If True, creates dashboard from default config (query parameter)
    
    Examples:
    - POST /api/dashboards/ with JSON body - Creates custom dashboard
    - POST /api/dashboards/?use_default=true - Creates default dashboard with random userId
    """
    try:
        # If use_default is True or no dashboard data provided, use default config
        if use_default or dashboard is None:
            import uuid
            default_config = load_default_dashboard_config()
            # Generate random userId
            default_config['userId'] = str(uuid.uuid4())
            dashboard = DashboardCreate(**default_config)
            logger.info(f"Creating dashboard from default configuration with userId: {default_config['userId']}")
        
        created_dashboard = dashboard_service.create_dashboard(dashboard)
        return DashboardResponse(
            success=True,
            message="Dashboard created successfully",
            data=created_dashboard
        )
    except Exception as e:
        import traceback
        error_details = {
            "error_type": type(e).__name__,
            "error_message": str(e),
            "traceback": traceback.format_exc()
        }
        logger.error(f"Error creating dashboard: {error_details}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": f"Failed to create dashboard: {str(e)}",
                "error_type": type(e).__name__,
                "details": str(e),
                "traceback": traceback.format_exc().split('\n')
            }
        )


@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(dashboard_id: str):
    """Get a dashboard by ID"""
    try:
        dashboard = dashboard_service.get_dashboard(dashboard_id)
        if not dashboard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dashboard {dashboard_id} not found"
            )
        return DashboardResponse(
            success=True,
            message="Dashboard retrieved successfully",
            data=dashboard
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dashboard {dashboard_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard: {str(e)}"
        )


@router.get("/", response_model=DashboardListResponse)
async def get_all_dashboards(limit: int = -1):
    """
    Get all dashboards with optional limit.
    
    Parameters:
    - limit: Number of dashboards to fetch
      - -1: Fetch all dashboards (default)
      - positive number: Fetch that many dashboards
      - 0 or other negative numbers: Invalid (returns 400 error)
    
    Examples:
    - GET /api/dashboards/ - Fetch all dashboards
    - GET /api/dashboards/?limit=10 - Fetch 10 dashboards
    - GET /api/dashboards/?limit=-1 - Fetch all dashboards
    """
    try:
        # Validate limit parameter
        if limit == 0 or (limit < 0 and limit != -1):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid limit value: {limit}. Must be -1 (all) or a positive number."
            )
        
        dashboards = dashboard_service.get_all_dashboards(limit)
        return DashboardListResponse(
            success=True,
            message="Dashboards retrieved successfully",
            data=dashboards,
            total=len(dashboards)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting all dashboards: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboards: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=DashboardListResponse)
async def get_user_dashboards(user_id: str):
    """Get all dashboards for a user"""
    try:
        dashboards = dashboard_service.get_user_dashboards(user_id)
        return DashboardListResponse(
            success=True,
            message="Dashboards retrieved successfully",
            data=dashboards,
            total=len(dashboards)
        )
    except Exception as e:
        logger.error(f"Error getting dashboards for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboards: {str(e)}"
        )


@router.put("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(dashboard_id: str, dashboard_update: DashboardUpdate):
    """Update a dashboard"""
    try:
        updated_dashboard = dashboard_service.update_dashboard(dashboard_id, dashboard_update)
        return DashboardResponse(
            success=True,
            message="Dashboard updated successfully",
            data=updated_dashboard
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating dashboard {dashboard_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update dashboard: {str(e)}"
        )


@router.delete("/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard(dashboard_id: str):
    """Delete a dashboard"""
    try:
        dashboard_service.delete_dashboard(dashboard_id)
        return None
    except Exception as e:
        logger.error(f"Error deleting dashboard {dashboard_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete dashboard: {str(e)}"
        )


@router.post("/{dashboard_id}/widgets", response_model=DashboardResponse)
async def add_widget(dashboard_id: str, widget: WidgetCreate):
    """Add a widget to a dashboard"""
    try:
        updated_dashboard = dashboard_service.add_widget(dashboard_id, widget)
        return DashboardResponse(
            success=True,
            message="Widget added successfully",
            data=updated_dashboard
        )
    except Exception as e:
        logger.error(f"Error adding widget to dashboard {dashboard_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add widget: {str(e)}"
        )


@router.delete("/{dashboard_id}/widgets/{widget_id}", response_model=DashboardResponse)
async def remove_widget(dashboard_id: str, widget_id: str):
    """Remove a widget from a dashboard"""
    try:
        updated_dashboard = dashboard_service.remove_widget(dashboard_id, widget_id)
        return DashboardResponse(
            success=True,
            message="Widget removed successfully",
            data=updated_dashboard
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error removing widget {widget_id} from dashboard {dashboard_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove widget: {str(e)}"
        )


@router.put("/{dashboard_id}/widgets/reorder", response_model=DashboardResponse)
async def reorder_widgets(dashboard_id: str, widgets: List[Widget]):
    """Reorder widgets in a dashboard (for drag-and-drop)"""
    try:
        updated_dashboard = dashboard_service.update_widget_positions(dashboard_id, widgets)
        return DashboardResponse(
            success=True,
            message="Widgets reordered successfully",
            data=updated_dashboard
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error reordering widgets for dashboard {dashboard_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reorder widgets: {str(e)}"
        )


@router.get("/widget/{widget_id}/data")
async def get_widget_data(widget_id: str):
    """
    Get widget data by widget ID.
    
    This endpoint:
    1. Fetches widget metadata from DynamoDB (sql_query, widget_type, chart_type)
    2. Calls external AI API with the SQL query
    3. Transforms the response based on widget_type and chart_type
    4. Returns transformed widget data to UI
    
    Parameters:
    - widget_id: Unique identifier for the widget
    
    Returns:
    - Transformed widget data ready for frontend consumption
    """
    try:
        # Step 1: Find the widget in all dashboards
        logger.info(f"Fetching widget data for widget_id: {widget_id}")
        
        # Get all dashboards to find the widget
        all_dashboards = dashboard_service.get_all_dashboards(limit=-1)
        
        widget_metadata = None
        dashboard_id = None
        
        for dashboard in all_dashboards:
            # Dashboard is a Pydantic object, access attributes directly
            for widget in dashboard.widgets:
                if widget.widgetId == widget_id:
                    widget_metadata = widget
                    dashboard_id = dashboard.dashboardId
                    break
            if widget_metadata:
                break
        
        if not widget_metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Widget {widget_id} not found in any dashboard"
            )
        
        logger.info(f"Found widget in dashboard {dashboard_id}: {widget_metadata}")
        
        # Step 2: Extract widget metadata (access as object attributes)
        sql_query = widget_metadata.sqlQuery
        widget_type = widget_metadata.widgetType
        chart_type = widget_metadata.widgetChartType
        
        if not sql_query:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Widget {widget_id} does not have a SQL query defined"
            )
        
        logger.info(f"Widget metadata - Type: {widget_type}, Chart Type: {chart_type}, SQL: {sql_query}")
        
        # Step 3: Call external AI API with SQL query
        try:
            api_response = await gw.execute_sql_query(sql_query)
            logger.info(f"API response: {api_response}")
        except Exception as exc:
            logger.error(f"Failed to execute SQL query: {exc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to execute SQL query: {str(exc)}"
            )
        
        # Step 4: Parse the response body (it's stringified JSON)
        status_code = api_response.get('statusCode', 500)
        body_str = api_response.get('body', '{}')
        
        try:
            body_data = json.loads(body_str)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse API response body: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse API response: {str(e)}"
            )
        
        if status_code != 200 or not body_data.get('success'):
            error_msg = body_data.get('error', 'Unknown error')
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"SQL query execution failed: {error_msg}"
            )
        
        raw_data = body_data.get('data', [])
        logger.info(f"Parsed data: {raw_data}")
        
        # Step 5: Transform data based on widget_type and chart_type
        try:
            # Use the chat_transformer's internal method to transform data
            transformed_data = chat_transformer._transform_data(
                widget_type=widget_type,
                chart_type=chart_type,
                raw_data=raw_data,
                insight=widget_metadata.title or ''
            )
            
            logger.info(f"Transformed data: {transformed_data}")
            
            # Step 6: Build response
            response = {
                'success': True,
                'message': 'Widget data retrieved successfully',
                'data': {
                    'widgetId': widget_id,
                    'widgetType': widget_type,
                    'chartType': chart_type,
                    'title': widget_metadata.title,
                    'data': transformed_data,
                    'rowCount': body_data.get('row_count', len(raw_data))
                }
            }
            
            return response
            
        except Exception as exc:
            logger.error(f"Failed to transform widget data: {exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to transform widget data: {str(exc)}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting widget data for {widget_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get widget data: {str(e)}"
        )
