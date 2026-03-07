"""
Dashboard Repository - Database operations for dashboard management
Handles all DynamoDB operations related to dashboards and widgets
"""
from typing import Optional, List, Dict, Any
from boto3.dynamodb.conditions import Key
import logging

from app.database.dynamodb import DynamoDBClient

logger = logging.getLogger(__name__)


class DashboardRepository:
    """Repository for dashboard-specific database operations"""
    
    def __init__(self, db_client: DynamoDBClient):
        self.db_client = db_client
    
    def get_dashboard(self, dashboard_id: str) -> Optional[Dict[str, Any]]:
        """Get a dashboard by ID"""
        return self.db_client.get_item({'dashboardId': dashboard_id})
    
    def get_dashboards_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all dashboards for a user"""
        return self.db_client.query(
            key_condition_expression=Key('userId').eq(user_id),
            index_name='userId-index'
        )
    
    def get_all_dashboards(self, limit: int = -1) -> List[Dict[str, Any]]:
        """
        Get all dashboards with optional limit.
        
        Args:
            limit: Number of dashboards to fetch. -1 means fetch all (no limit).
        
        Returns:
            List of dashboard dictionaries
        """
        if limit == -1:
            # Fetch all dashboards (no limit)
            return self.db_client.scan()
        else:
            # Fetch with limit
            return self.db_client.scan(limit=limit)
    
    def create_dashboard(self, dashboard_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new dashboard"""
        try:
            logger.info(f"Repository: Creating dashboard with ID: {dashboard_data.get('dashboardId')}")
            result = self.db_client.put_item(dashboard_data)
            logger.info(f"Repository: Dashboard created successfully")
            return result
        except Exception as e:
            logger.error(f"Repository error creating dashboard: {type(e).__name__} - {str(e)}", exc_info=True)
            raise
    
    def update_dashboard(self, dashboard_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing dashboard"""
        return self.db_client.update_item({'dashboardId': dashboard_id}, update_data)
    
    def delete_dashboard(self, dashboard_id: str) -> bool:
        """Delete a dashboard"""
        return self.db_client.delete_item({'dashboardId': dashboard_id})
    
    def add_widget_to_dashboard(self, dashboard_id: str, widget: Dict[str, Any]) -> Dict[str, Any]:
        """Add a widget to a dashboard"""
        try:
            # Use the underlying table directly for list operations
            response = self.db_client.table.update_item(
                Key={'dashboardId': dashboard_id},
                UpdateExpression="SET widgets = list_append(if_not_exists(widgets, :empty_list), :widget)",
                ExpressionAttributeValues={
                    ':widget': [widget],
                    ':empty_list': []
                },
                ReturnValues="ALL_NEW"
            )
            from app.database.dynamodb import _convert_decimals
            return _convert_decimals(response.get('Attributes'))
        except Exception as e:
            logger.error(f"Error adding widget to dashboard {dashboard_id}: {str(e)}")
            raise
    
    def remove_widget_from_dashboard(self, dashboard_id: str, widget_id: str) -> Dict[str, Any]:
        """Remove a widget from a dashboard"""
        try:
            # First, get the dashboard to find the widget index
            dashboard = self.get_dashboard(dashboard_id)
            if not dashboard:
                raise ValueError(f"Dashboard {dashboard_id} not found")
            
            widgets = dashboard.get('widgets', [])
            widget_index = None
            
            for idx, widget in enumerate(widgets):
                if widget.get('widgetId') == widget_id:
                    widget_index = idx
                    break
            
            if widget_index is None:
                raise ValueError(f"Widget {widget_id} not found in dashboard")
            
            # Remove the widget
            response = self.db_client.table.update_item(
                Key={'dashboardId': dashboard_id},
                UpdateExpression=f"REMOVE widgets[{widget_index}]",
                ReturnValues="ALL_NEW"
            )
            from app.database.dynamodb import _convert_decimals
            return _convert_decimals(response.get('Attributes'))
        except Exception as e:
            logger.error(f"Error removing widget {widget_id} from dashboard {dashboard_id}: {str(e)}")
            raise


# Singleton instance
dashboard_repository = None


def get_dashboard_repository() -> DashboardRepository:
    """Get or create dashboard repository instance"""
    global dashboard_repository
    if dashboard_repository is None:
        from app.database.dynamodb import db_client
        dashboard_repository = DashboardRepository(db_client)
    return dashboard_repository
