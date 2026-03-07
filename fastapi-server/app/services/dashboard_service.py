from typing import List, Optional
from datetime import datetime
import uuid
from app.models.dashboard import (
    Dashboard, DashboardCreate, DashboardUpdate,
    Widget, WidgetCreate
)
from app.database.dashboard_repository import get_dashboard_repository
import logging

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self):
        self.repository = get_dashboard_repository()
    
    def create_dashboard(self, dashboard_data: DashboardCreate) -> Dashboard:
        """Create a new dashboard"""
        try:
            now = datetime.utcnow().isoformat()
            dashboard_id = str(uuid.uuid4())
            
            # Convert widgets and add auto-generated fields
            widgets_with_ids = []
            for widget in dashboard_data.widgets:
                widget_dict = widget.dict()
                widget_dict['widgetId'] = str(uuid.uuid4())
                widget_dict['createdAt'] = now
                widget_dict['updatedAt'] = now
                widgets_with_ids.append(widget_dict)
            
            dashboard_dict = {
                "dashboardId": dashboard_id,
                "dashboardName": dashboard_data.dashboardName,
                "dashboardType": dashboard_data.dashboardType,
                "description": dashboard_data.description,
                "userId": dashboard_data.userId,
                "widgets": widgets_with_ids,
                "layout": dashboard_data.layout,
                "isDefault": dashboard_data.isDefault,
                "isPublic": dashboard_data.isPublic,
                "tags": dashboard_data.tags,
                "createdAt": now,
                "updatedAt": now
            }
            
            logger.info(f"Creating dashboard: {dashboard_id} for user: {dashboard_data.userId}")
            created_dashboard = self.repository.create_dashboard(dashboard_dict)
            logger.info(f"Dashboard created successfully: {dashboard_id}")
            return Dashboard(**created_dashboard)
        except Exception as e:
            logger.error(f"Error creating dashboard: {type(e).__name__} - {str(e)}", exc_info=True)
            raise
    
    def get_dashboard(self, dashboard_id: str) -> Optional[Dashboard]:
        """Get a dashboard by ID"""
        try:
            dashboard_data = self.repository.get_dashboard(dashboard_id)
            if dashboard_data:
                return Dashboard(**dashboard_data)
            return None
        except Exception as e:
            logger.error(f"Error getting dashboard {dashboard_id}: {str(e)}")
            raise
    
    def get_user_dashboards(self, user_id: str) -> List[Dashboard]:
        """Get all dashboards for a user"""
        try:
            dashboards_data = self.repository.get_dashboards_by_user(user_id)
            return [Dashboard(**dashboard) for dashboard in dashboards_data]
        except Exception as e:
            logger.error(f"Error getting dashboards for user {user_id}: {str(e)}")
            raise
    
    def get_all_dashboards(self, limit: int = -1) -> List[Dashboard]:
        """
        Get all dashboards with optional limit.
        
        Args:
            limit: Number of dashboards to fetch. -1 means fetch all.
        
        Returns:
            List of Dashboard objects
        """
        try:
            dashboards_data = self.repository.get_all_dashboards(limit)
            return [Dashboard(**dashboard) for dashboard in dashboards_data]
        except Exception as e:
            logger.error(f"Error getting all dashboards: {str(e)}")
            raise
            return [Dashboard(**dashboard) for dashboard in dashboards_data]
        except Exception as e:
            logger.error(f"Error getting dashboards for user {user_id}: {str(e)}")
            raise
    
    def update_dashboard(self, dashboard_id: str, update_data: DashboardUpdate) -> Dashboard:
        """Update a dashboard"""
        try:
            # Get current dashboard
            current_dashboard = self.repository.get_dashboard(dashboard_id)
            if not current_dashboard:
                raise ValueError(f"Dashboard {dashboard_id} not found")
            
            # Prepare update data
            update_dict = update_data.dict(exclude_unset=True)
            
            # Convert widgets to dict if present
            if 'widgets' in update_dict and update_dict['widgets']:
                update_dict['widgets'] = [widget.dict() for widget in update_data.widgets]
            
            # Add updated timestamp
            update_dict['updatedAt'] = datetime.utcnow().isoformat()
            
            updated_dashboard = self.repository.update_dashboard(dashboard_id, update_dict)
            return Dashboard(**updated_dashboard)
        except Exception as e:
            logger.error(f"Error updating dashboard {dashboard_id}: {str(e)}")
            raise
    
    def delete_dashboard(self, dashboard_id: str) -> bool:
        """Delete a dashboard"""
        try:
            return self.repository.delete_dashboard(dashboard_id)
        except Exception as e:
            logger.error(f"Error deleting dashboard {dashboard_id}: {str(e)}")
            raise
    
    def add_widget(self, dashboard_id: str, widget_data: WidgetCreate) -> Dashboard:
        """Add a widget to a dashboard"""
        try:
            now = datetime.utcnow().isoformat()
            widget_id = str(uuid.uuid4())
            
            widget_dict = {
                "widgetId": widget_id,
                "widgetType": widget_data.widgetType,
                "widgetChartType": widget_data.widgetChartType,
                "title": widget_data.title,
                "position": widget_data.position,
                "refreshInterval": widget_data.refreshInterval,
                "createdAt": now,
                "updatedAt": now
            }
            
            updated_dashboard = self.repository.add_widget_to_dashboard(dashboard_id, widget_dict)
            return Dashboard(**updated_dashboard)
        except Exception as e:
            logger.error(f"Error adding widget to dashboard {dashboard_id}: {str(e)}")
            raise
    
    def remove_widget(self, dashboard_id: str, widget_id: str) -> Dashboard:
        """Remove a widget from a dashboard"""
        try:
            updated_dashboard = self.repository.remove_widget_from_dashboard(dashboard_id, widget_id)
            return Dashboard(**updated_dashboard)
        except Exception as e:
            logger.error(f"Error removing widget {widget_id} from dashboard {dashboard_id}: {str(e)}")
            raise
    
    def update_widget_positions(self, dashboard_id: str, widgets: List[Widget]) -> Dashboard:
        """Update widget positions (for drag-and-drop reordering)"""
        try:
            # Get current dashboard
            current_dashboard = self.repository.get_dashboard(dashboard_id)
            if not current_dashboard:
                raise ValueError(f"Dashboard {dashboard_id} not found")
            
            # Update widget positions
            widgets_dict = [widget.dict() for widget in widgets]
            for idx, widget in enumerate(widgets_dict):
                widget['position'] = idx
                widget['updatedAt'] = datetime.utcnow().isoformat()
            
            update_dict = {
                'widgets': widgets_dict,
                'updatedAt': datetime.utcnow().isoformat()
            }
            
            updated_dashboard = self.repository.update_dashboard(dashboard_id, update_dict)
            return Dashboard(**updated_dashboard)
        except Exception as e:
            logger.error(f"Error updating widget positions for dashboard {dashboard_id}: {str(e)}")
            raise


dashboard_service = DashboardService()
