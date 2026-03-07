from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class WidgetType(str, Enum):
    SUMMARY_CARD = "summaryCard"
    CHART = "chart"
    GRID = "grid"


class ChartType(str, Enum):
    LINE = "line"
    BAR = "bar"
    COLUMN = "column"
    PIE = "pie"
    AREA = "area"
    SCATTER = "scatter"


class WidgetMetadata(BaseModel):
    """
    Widget metadata stored in dashboard table.
    Only stores references and positioning, NOT actual data or config.
    Data is fetched based on dashboard's dashboardType.
    """
    widgetId: str = Field(..., description="Unique identifier for the widget")
    widgetType: WidgetType = Field(..., description="Type of widget (summaryCard, chart, grid)")
    widgetChartType: Optional[ChartType] = Field(None, description="Chart type if widget is a chart")
    title: Optional[str] = Field(None, description="Widget title")
    sqlQuery: Optional[str] = Field(None, description="SQL query to fetch widget data")
    position: int = Field(..., description="Position/order of widget in dashboard")
    refreshInterval: Optional[int] = Field(None, description="Auto-refresh interval in seconds")
    createdAt: Optional[str] = Field(None, description="Widget creation timestamp")
    updatedAt: Optional[str] = Field(None, description="Widget last update timestamp")


class WidgetMetadataCreate(BaseModel):
    """
    Create widget metadata - only references, no data/config.
    Data is fetched based on dashboard's dashboardType.
    """
    widgetType: WidgetType
    widgetChartType: Optional[ChartType] = None
    title: Optional[str] = None
    sqlQuery: Optional[str] = None
    position: int
    refreshInterval: Optional[int] = None

class WidgetMetadataUpdate(BaseModel):
    """
    Update widget metadata - only references, no data/config.
    """
    widgetType: Optional[WidgetType] = None
    widgetChartType: Optional[ChartType] = None
    title: Optional[str] = None
    sqlQuery: Optional[str] = None
    position: Optional[int] = None
    refreshInterval: Optional[int] = None


# Alias for backward compatibility
Widget = WidgetMetadata


class Dashboard(BaseModel):
    """
    Dashboard metadata - stores only structure and references, NOT actual data.
    dashboardType determines what data to fetch for all widgets.
    """
    dashboardId: str = Field(..., description="Unique identifier for the dashboard")
    dashboardName: str = Field(..., description="Display name of the dashboard")
    dashboardType: str = Field(..., description="Dashboard type (e.g., 'revenue-type', 'inventory-type', 'sales-type')")
    description: Optional[str] = Field(None, description="Dashboard description")
    userId: str = Field(..., description="Owner user ID")
    widgets: List[WidgetMetadata] = Field(default_factory=list, description="Widget metadata (references only)")
    layout: Optional[str] = Field("grid", description="Layout type (grid, flex, custom)")
    isDefault: bool = Field(False, description="Whether this is the default dashboard")
    isPublic: bool = Field(False, description="Whether dashboard is publicly accessible")
    tags: List[str] = Field(default_factory=list, description="Dashboard tags for categorization")
    createdAt: str = Field(..., description="Dashboard creation timestamp")
    updatedAt: str = Field(..., description="Dashboard last update timestamp")


class DashboardCreate(BaseModel):
    dashboardName: str = Field(..., min_length=1, max_length=100)
    dashboardType: str = Field(..., description="Dashboard type (e.g., 'revenue-type', 'inventory-type')")
    description: Optional[str] = Field(None, max_length=500)
    userId: str = Field(...)
    widgets: List[WidgetMetadataCreate] = Field(default_factory=list)
    layout: Optional[str] = Field("grid")
    isDefault: bool = Field(False)
    isPublic: bool = Field(False)
    tags: List[str] = Field(default_factory=list)


class DashboardUpdate(BaseModel):
    dashboardName: Optional[str] = Field(None, min_length=1, max_length=100)
    dashboardType: Optional[str] = None
    description: Optional[str] = None
    widgets: Optional[List[WidgetMetadata]] = None
    layout: Optional[str] = None
    isDefault: Optional[bool] = None
    isPublic: Optional[bool] = None
    tags: Optional[List[str]] = None


# Aliases for backward compatibility
WidgetCreate = WidgetMetadataCreate
WidgetUpdate = WidgetMetadataUpdate


class DashboardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dashboard] = None


class DashboardListResponse(BaseModel):
    success: bool
    message: str
    data: List[Dashboard]
    total: int
