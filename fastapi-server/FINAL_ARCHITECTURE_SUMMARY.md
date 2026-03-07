# Final Architecture Summary

## Dashboard Type-Based Architecture

### Core Concept
Dashboards are categorized by `dashboardType` which determines what data to fetch. Individual widgets don't specify data sources - the dashboard type controls everything.

## Data Model

### Dashboard (Stored in DynamoDB)
```json
{
  "dashboardId": "uuid",
  "dashboardName": "Revenue Dashboard",
  "dashboardType": "revenue-type",  ← Key field
  "userId": "user-123",
  "widgets": [
    {
      "widgetId": "widget-1",
      "widgetType": "chart",
      "widgetChartType": "line",
      "title": "Revenue Trend",
      "position": 0,
      "refreshInterval": 600
    }
  ],
  "layout": "grid",
  "tags": ["revenue"]
}
```

### Widget Metadata (No Data Source)
```python
class WidgetMetadata:
    widgetId: str
    widgetType: WidgetType  # summaryCard, chart, grid
    widgetChartType: Optional[ChartType]  # line, bar, pie, etc.
    title: Optional[str]
    position: int
    refreshInterval: Optional[int]
    # NO dataSourceEndpoint field
    # NO config field
```

## What's Stored vs What's Fetched

### ✅ Stored in DynamoDB
- Dashboard ID, name, type
- User ID
- Widget metadata (type, title, position)
- Layout, tags, flags

### ❌ NOT Stored in DynamoDB
- Widget configurations
- Chart data
- Grid rows
- Summary card values
- Data source endpoints

### ✅ Fetched from Data API
Based on `dashboardType`:
```
GET /api/data/{dashboardType}
```

Returns all widget data in order.

## Data Flow

```
1. Frontend: GET /api/dashboards/{dashboardId}
   ↓
2. Backend: Returns metadata with dashboardType
   {
     "dashboardType": "revenue-type",
     "widgets": [...]
   }
   ↓
3. Frontend: GET /api/data/revenue-type
   ↓
4. Backend: Returns all widget data
   {
     "data": [
       { "type": "summaryCard", "data": [...] },
       { "type": "chart", "data": [...] },
       { "type": "grid", "data": [...] }
     ]
   }
   ↓
5. Frontend: Matches data to widgets by position
   ↓
6. Frontend: Renders dashboard
```

## Dashboard Types

| Type | Description | Endpoint |
|------|-------------|----------|
| `revenue-type` | Revenue metrics | `/api/data/revenue-type` |
| `inventory-type` | Inventory management | `/api/data/inventory-type` |
| `sales-type` | Sales analytics | `/api/data/sales-type` |
| `customer-type` | Customer insights | `/api/data/customer-type` |
| `forecast-type` | Demand forecasting | `/api/data/forecast-type` |
| `pricing-type` | Pricing intelligence | `/api/data/pricing-type` |
| `market-type` | Market trends | `/api/data/market-type` |

## Example: Creating a Dashboard

```python
dashboard = DashboardCreate(
    dashboardName="Revenue Dashboard",
    dashboardType="revenue-type",  # Determines data source
    userId="user-123",
    widgets=[
        WidgetMetadataCreate(
            widgetType=WidgetType.SUMMARY_CARD,
            title="Key Metrics",
            position=0
        ),
        WidgetMetadataCreate(
            widgetType=WidgetType.CHART,
            widgetChartType=ChartType.LINE,
            title="Revenue Trend",
            position=1
        )
    ]
)
```

## Example: Data Source API

```python
@router.get("/data/revenue-type")
async def get_revenue_data():
    return {
        "dashboardType": "revenue-type",
        "data": [
            # Position 0: Summary Card
            {
                "type": "summaryCard",
                "data": [
                    {"title": "Total Revenue", "value": "₹4,52,000", "change": "+12%", "trend": "up"}
                ]
            },
            # Position 1: Chart
            {
                "type": "chart",
                "data": [{
                    "chart": {"type": "line"},
                    "title": {"text": "Revenue Trend"},
                    "series": [{"name": "Revenue", "data": [320000, 340000, 335000]}]
                }]
            }
        ]
    }
```

## Example: Frontend Integration

```typescript
async function loadDashboard(dashboardId: string) {
  // 1. Get metadata
  const metadata = await fetch(`/api/dashboards/${dashboardId}`);
  const dashboard = await metadata.json();
  
  // 2. Get data based on dashboardType
  const data = await fetch(`/api/data/${dashboard.dashboardType}`);
  const widgetData = await data.json();
  
  // 3. Combine
  const widgets = dashboard.widgets.map((widget, i) => ({
    ...widget,
    ...widgetData.data[i]
  }));
  
  return { ...dashboard, widgets };
}
```

## Benefits

### 1. Simple Metadata
- Dashboard table stays small
- Only structure, no data
- Fast queries

### 2. Centralized Data
- One endpoint per dashboard type
- Easy to update data logic
- Consistent format

### 3. Type-Based Organization
- Clear categorization
- Reusable dashboard types
- Easy to add new types

### 4. Performance
- Single API call for all widgets
- Better caching
- Parallel processing possible

### 5. Flexibility
- Change data without touching metadata
- Multiple dashboards can share types
- Easy to version

## Key Changes from Previous Approach

### Before
```python
# Widget had dataSourceEndpoint
class Widget:
    dataSourceEndpoint: str  # Each widget had its own endpoint
    config: Dict[str, Any]   # Stored configuration
```

### After
```python
# Dashboard has dashboardType
class Dashboard:
    dashboardType: str  # One type for entire dashboard

# Widget has no data source
class WidgetMetadata:
    # No dataSourceEndpoint
    # No config
    # Only metadata
```

## Files Updated

1. ✅ `backend/app/models/dashboard.py`
   - Added `dashboardType` to Dashboard
   - Removed `dataSourceEndpoint` from Widget
   - Made `dataSourceEndpoint` optional in create/update

2. ✅ `backend/scripts/create_sample_data.py`
   - Updated to use `dashboardType`
   - Removed `dataSourceEndpoint` from widgets
   - Created 4 sample dashboards with different types

3. ✅ `backend/DASHBOARD_TYPE_ARCHITECTURE.md`
   - Complete architecture documentation
   - Examples and best practices

## Next Steps

### 1. Create Data Source APIs
Create endpoints for each dashboard type:
```python
# backend/app/api/routes/data_sources.py
@router.get("/data/revenue-type")
@router.get("/data/inventory-type")
@router.get("/data/sales-type")
# etc.
```

### 2. Update Frontend
```typescript
// Update api.service.ts
export async function fetchDashboardData(dashboardType: string) {
  const response = await fetch(`/api/data/${dashboardType}`);
  return response.json();
}
```

### 3. Test Integration
1. Create dashboard with type
2. Fetch dashboard metadata
3. Fetch data based on type
4. Render widgets

## Summary

**Dashboard Level:**
- `dashboardType` field (required)
- Determines data source for all widgets
- One API call: `/api/data/{dashboardType}`

**Widget Level:**
- No `dataSourceEndpoint` field
- Only metadata (type, title, position)
- Data matched by position from dashboard type endpoint

This architecture keeps the metadata table lean while providing a clear, type-based organization for data fetching.
