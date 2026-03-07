# Metadata-Only Architecture Changes

## Summary of Changes

The backend has been refactored to store **ONLY metadata** in the dashboard table, not actual data or configurations.

## What Changed

### 1. Widget Model Renamed
- **Old**: `Widget` (contained config and data)
- **New**: `WidgetMetadata` (contains only references)

### 2. Removed Fields
- ❌ `config: Dict[str, Any]` - Widget configuration removed
- ❌ `dataSource: str` - Generic data source removed

### 3. Added Fields
- ✅ `dataSourceEndpoint: str` - Specific API endpoint to fetch data (required)

### 4. Model Comparison

#### Before (Old Model)
```python
class Widget(BaseModel):
    widgetId: str
    widgetType: WidgetType
    widgetChartType: Optional[ChartType]
    title: Optional[str]
    position: int
    config: Dict[str, Any]  # ❌ Stored chart config, data
    dataSource: Optional[str]  # ❌ Generic identifier
    refreshInterval: Optional[int]
```

#### After (New Model)
```python
class WidgetMetadata(BaseModel):
    widgetId: str
    widgetType: WidgetType
    widgetChartType: Optional[ChartType]
    title: Optional[str]
    position: int
    dataSourceEndpoint: str  # ✅ Specific API endpoint (required)
    refreshInterval: Optional[int]
```

## DynamoDB Storage

### What's Stored
```json
{
  "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
  "dashboardName": "Main Dashboard",
  "userId": "user-123",
  "widgets": [
    {
      "widgetId": "widget-1",
      "widgetType": "chart",
      "widgetChartType": "line",
      "title": "Revenue Trend",
      "position": 0,
      "dataSourceEndpoint": "/api/data/revenue-trend",
      "refreshInterval": 600
    }
  ],
  "layout": "grid",
  "tags": ["main"]
}
```

### What's NOT Stored
- Chart configurations (xAxis, yAxis, series, etc.)
- Actual data values
- Grid rows
- Summary card values
- Any widget-specific configuration

## Data Flow

### 1. Frontend Requests Dashboard
```http
GET /api/dashboards/550e8400-e29b-41d4-a716-446655440000
```

### 2. Backend Returns Metadata Only
```json
{
  "success": true,
  "data": {
    "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
    "widgets": [
      {
        "widgetId": "widget-1",
        "dataSourceEndpoint": "/api/data/revenue-trend",
        "widgetType": "chart",
        "position": 0
      }
    ]
  }
}
```

### 3. Frontend Fetches Widget Data
```http
GET /api/data/revenue-trend
```

### 4. Data Source Returns Actual Data
```json
{
  "type": "chart",
  "data": [{
    "chart": { "type": "line" },
    "title": { "text": "Revenue Trend" },
    "series": [{
      "name": "Revenue",
      "data": [320000, 340000, 335000, 380000, 410000, 452000]
    }]
  }]
}
```

## API Changes

### Create Widget Endpoint

#### Before
```json
POST /api/dashboards/{id}/widgets
{
  "widgetType": "chart",
  "widgetChartType": "line",
  "title": "Revenue Trend",
  "position": 0,
  "config": {
    "xAxis": ["Aug", "Sep", "Oct"],
    "series": [{"name": "Revenue", "data": [100, 200, 300]}]
  },
  "dataSource": "revenue-api"
}
```

#### After
```json
POST /api/dashboards/{id}/widgets
{
  "widgetType": "chart",
  "widgetChartType": "line",
  "title": "Revenue Trend",
  "position": 0,
  "dataSourceEndpoint": "/api/data/revenue-trend"
}
```

## Sample Data Script Changes

### Before
```python
WidgetCreate(
    widgetType=WidgetType.CHART,
    widgetChartType=ChartType.LINE,
    title="Revenue Trend",
    position=1,
    config={
        "xAxis": ["Aug", "Sep", "Oct"],
        "series": [{"name": "Revenue", "data": [320000, 340000, 335000]}]
    },
    dataSource="revenue-api"
)
```

### After
```python
WidgetMetadataCreate(
    widgetType=WidgetType.CHART,
    widgetChartType=ChartType.LINE,
    title="Revenue Trend",
    position=1,
    dataSourceEndpoint="/api/data/revenue-trend"
)
```

## Frontend Integration Changes

### Old Approach
```typescript
// Dashboard had everything
const dashboard = await fetchDashboard(dashboardId);
// Render directly
renderWidgets(dashboard.widgets);
```

### New Approach
```typescript
// 1. Get metadata
const dashboard = await fetchDashboard(dashboardId);

// 2. Fetch data for each widget
const widgetsWithData = await Promise.all(
  dashboard.widgets.map(async (widget) => {
    const data = await fetch(widget.dataSourceEndpoint);
    return { ...widget, data: await data.json() };
  })
);

// 3. Render with data
renderWidgets(widgetsWithData);
```

## Benefits

### 1. Smaller Database
- Dashboard table only stores references
- No large config objects
- Faster queries

### 2. Flexibility
- Change data without updating dashboard
- Multiple dashboards can share data sources
- Easy to update data logic

### 3. Scalability
- Data sources can be distributed
- Independent scaling
- Better caching strategies

### 4. Security
- Fine-grained access control per data source
- Dashboard metadata doesn't expose sensitive data

## Migration Guide

### For Existing Dashboards

If you have dashboards with config/data stored:

1. **Extract data source endpoints**
   ```python
   # For each widget with config
   endpoint = create_data_source_endpoint(widget.config)
   widget.dataSourceEndpoint = endpoint
   widget.config = None  # Remove config
   ```

2. **Create data source APIs**
   ```python
   @router.get("/data/revenue-trend")
   async def get_revenue_trend():
       # Return the config that was previously stored
       return {
           "type": "chart",
           "data": [previous_config]
       }
   ```

3. **Update dashboard metadata**
   ```python
   dashboard_service.update_dashboard(
       dashboard_id,
       DashboardUpdate(widgets=updated_widgets)
   )
   ```

## Backward Compatibility

The code includes aliases for backward compatibility:
```python
# Old names still work
Widget = WidgetMetadata
WidgetCreate = WidgetMetadataCreate
WidgetUpdate = WidgetMetadataUpdate
```

## Next Steps

1. ✅ Models updated to metadata-only
2. ✅ Sample data script updated
3. ✅ Architecture documented
4. ⏳ Create data source API endpoints
5. ⏳ Update frontend to fetch from data sources
6. ⏳ Migrate existing dashboards (if any)

## Data Source API Template

Create separate endpoints for each widget type:

```python
# backend/app/api/routes/data_sources.py

@router.get("/data/kpi-metrics")
async def get_kpi_metrics():
    return {
        "type": "summaryCard",
        "data": [
            {"title": "Total Revenue", "value": "₹4,52,000", "change": "+12%", "trend": "up"},
            {"title": "Inventory Health", "value": "92%", "change": "-2%", "trend": "down"}
        ]
    }

@router.get("/data/revenue-trend")
async def get_revenue_trend():
    return {
        "type": "chart",
        "data": [{
            "chart": {"type": "line"},
            "title": {"text": "Revenue Trend"},
            "series": [{"name": "Revenue", "data": [320000, 340000, 335000]}]
        }]
    }

@router.get("/data/top-products")
async def get_top_products():
    return {
        "type": "grid",
        "data": [{
            "title": "Top Products",
            "rows": [
                {"product": "Wireless Earbuds", "sales": 1204, "revenue": "₹2,40,800"}
            ]
        }]
    }
```

## Summary

The dashboard metadata table now stores **ONLY**:
- Dashboard structure
- Widget references
- Widget positioning
- Data source endpoints

Actual data and configurations are fetched from separate data source APIs, keeping the metadata table lean and scalable.
