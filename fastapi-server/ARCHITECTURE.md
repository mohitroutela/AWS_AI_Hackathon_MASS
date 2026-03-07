# RetailAI Backend Architecture

## Data Separation Strategy

### Overview
The backend follows a **metadata-only** approach for dashboard storage. The DynamoDB table stores ONLY dashboard structure and widget references, NOT actual data or configurations.

## Architecture Principles

### 1. Separation of Concerns
- **Dashboard Metadata Table**: Stores structure, layout, and references
- **Data Source APIs**: Provide actual widget data and configurations
- **Frontend**: Fetches metadata first, then fetches data from sources

### 2. What Goes Where

#### ✅ Stored in DynamoDB (Dashboard Metadata Table)
```json
{
  "dashboardId": "uuid",
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
  "tags": ["main", "overview"]
}
```

#### ❌ NOT Stored in DynamoDB
- Widget configuration (chart settings, colors, etc.)
- Actual data (numbers, values, rows)
- Chart data series
- Grid rows
- Summary card values

#### ✅ Fetched from Data Source Endpoints
```json
// GET /api/data/revenue-trend
{
  "type": "chart",
  "data": [{
    "chart": { "type": "line", "height": 400 },
    "title": { "text": "Revenue Trend" },
    "xAxis": { "categories": ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"] },
    "yAxis": { "title": { "text": "Revenue (₹)" } },
    "series": [{
      "name": "Revenue",
      "data": [320000, 340000, 335000, 380000, 410000, 452000],
      "color": "#5B5FEF"
    }],
    "credits": { "enabled": false }
  }]
}
```

## Data Flow

### Dashboard Loading Flow

```
1. Frontend requests dashboard metadata
   GET /api/dashboards/{dashboardId}
   
2. Backend returns metadata with widget references
   {
     "dashboardId": "...",
     "widgets": [
       {
         "widgetId": "widget-1",
         "dataSourceEndpoint": "/api/data/revenue-trend",
         ...
       }
     ]
   }

3. Frontend loops through widgets and fetches data
   For each widget:
     GET {dataSourceEndpoint}
     
4. Frontend renders widgets with fetched data
```

### Widget Data Fetching

```typescript
// Frontend code
async function loadDashboard(dashboardId: string) {
  // 1. Get dashboard metadata
  const metadata = await fetch(`/api/dashboards/${dashboardId}`);
  const dashboard = await metadata.json();
  
  // 2. Fetch data for each widget
  const widgetsWithData = await Promise.all(
    dashboard.widgets.map(async (widget) => {
      const dataResponse = await fetch(widget.dataSourceEndpoint);
      const data = await dataResponse.json();
      return {
        ...widget,
        data: data
      };
    })
  );
  
  // 3. Render dashboard with data
  renderDashboard(dashboard, widgetsWithData);
}
```

## Widget Metadata Model

### WidgetMetadata Structure
```python
class WidgetMetadata(BaseModel):
    widgetId: str                    # Unique identifier
    widgetType: WidgetType           # "summaryCard" | "chart" | "grid"
    widgetChartType: Optional[ChartType]  # Chart type if applicable
    title: Optional[str]             # Widget title
    position: int                    # Display order
    dataSourceEndpoint: str          # WHERE to get data (required)
    refreshInterval: Optional[int]   # Auto-refresh in seconds
    createdAt: str                   # Creation timestamp
    updatedAt: str                   # Update timestamp
```

### Key Field: dataSourceEndpoint

This is the **most important field** - it tells the frontend where to fetch the actual widget data.

**Examples:**
- `/api/data/kpi-metrics` - Returns summary card data
- `/api/data/revenue-trend` - Returns chart configuration
- `/api/data/top-products` - Returns grid data
- `/api/external/analytics/sales` - External API
- `https://analytics.example.com/api/v1/metrics` - Full URL

## Data Source API Contracts

### Summary Card Data Source
```json
// GET /api/data/kpi-metrics
{
  "type": "summaryCard",
  "data": [
    {
      "title": "Total Revenue",
      "value": "₹4,52,000",
      "change": "+12%",
      "trend": "up"
    },
    {
      "title": "Inventory Health",
      "value": "92%",
      "change": "-2%",
      "trend": "down"
    }
  ]
}
```

### Chart Data Source
```json
// GET /api/data/revenue-trend
{
  "type": "chart",
  "data": [{
    "chart": { "type": "line" },
    "title": { "text": "Revenue Trend" },
    "xAxis": { "categories": ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"] },
    "series": [{
      "name": "Revenue",
      "data": [320000, 340000, 335000, 380000, 410000, 452000]
    }]
  }]
}
```

### Grid Data Source
```json
// GET /api/data/top-products
{
  "type": "grid",
  "data": [{
    "title": "Top Products",
    "rows": [
      {
        "product": "Wireless Earbuds",
        "sales": 1204,
        "revenue": "₹2,40,800",
        "growth": "+45%"
      },
      {
        "product": "Smart Watch",
        "sales": 892,
        "revenue": "₹1,78,400",
        "growth": "+32%"
      }
    ]
  }]
}
```

## Benefits of This Architecture

### 1. Scalability
- Dashboard metadata table stays small
- Data can be distributed across multiple services
- Each data source can scale independently

### 2. Flexibility
- Change data without updating dashboard metadata
- Different widgets can use different data sources
- Easy to add new data sources

### 3. Performance
- Metadata loads quickly (small payload)
- Data can be cached at source level
- Parallel data fetching for widgets

### 4. Security
- Fine-grained access control per data source
- Dashboard metadata doesn't expose sensitive data
- Data sources can have their own authentication

### 5. Maintainability
- Clear separation of concerns
- Data logic separate from dashboard logic
- Easy to update data without touching dashboards

## Implementation Example

### Backend: Dashboard Metadata API
```python
# Returns only metadata
@router.get("/{dashboard_id}")
async def get_dashboard(dashboard_id: str):
    dashboard = dashboard_service.get_dashboard(dashboard_id)
    return {
        "dashboardId": dashboard.dashboardId,
        "dashboardName": dashboard.dashboardName,
        "widgets": [
            {
                "widgetId": w.widgetId,
                "widgetType": w.widgetType,
                "dataSourceEndpoint": w.dataSourceEndpoint,
                "position": w.position
            }
            for w in dashboard.widgets
        ]
    }
```

### Backend: Data Source API (Separate)
```python
# Returns actual data
@router.get("/data/revenue-trend")
async def get_revenue_trend():
    # Fetch from database, external API, etc.
    data = fetch_revenue_data()
    return {
        "type": "chart",
        "data": [format_as_highcharts_config(data)]
    }
```

### Frontend: Dashboard Loader
```typescript
async function loadDashboard(dashboardId: string) {
  // 1. Get metadata
  const response = await fetch(`/api/dashboards/${dashboardId}`);
  const dashboard = await response.json();
  
  // 2. Fetch all widget data in parallel
  const widgetDataPromises = dashboard.widgets.map(widget =>
    fetch(widget.dataSourceEndpoint).then(r => r.json())
  );
  
  const widgetData = await Promise.all(widgetDataPromises);
  
  // 3. Combine metadata with data
  const widgets = dashboard.widgets.map((widget, index) => ({
    ...widget,
    ...widgetData[index]
  }));
  
  return { ...dashboard, widgets };
}
```

## Migration from Old Approach

If you have existing dashboards with config/data stored:

### Option 1: Data Migration
```python
# Migrate existing dashboards
for dashboard in old_dashboards:
    for widget in dashboard.widgets:
        # Extract config and save to data source
        save_to_data_source(widget.config, widget.dataSourceEndpoint)
        
        # Remove config from widget
        widget.config = None
        widget.dataSource = widget.dataSourceEndpoint
```

### Option 2: Gradual Migration
- Keep old dashboards as-is
- New dashboards use new approach
- Migrate old dashboards over time

## Best Practices

### 1. Data Source Naming
Use descriptive, RESTful endpoint names:
- ✅ `/api/data/revenue-trend`
- ✅ `/api/data/inventory-status`
- ❌ `/api/widget1`
- ❌ `/api/data`

### 2. Data Source Versioning
Include version in endpoint:
- `/api/v1/data/revenue-trend`
- `/api/v2/data/revenue-trend`

### 3. Error Handling
Data sources should return consistent error format:
```json
{
  "error": true,
  "message": "Failed to fetch revenue data",
  "code": "DATA_FETCH_ERROR"
}
```

### 4. Caching
- Cache data source responses
- Use appropriate cache TTL
- Respect refreshInterval from metadata

### 5. Authentication
- Data sources should validate user permissions
- Pass user context to data sources
- Use JWT or session tokens

## Summary

**Dashboard Metadata Table:**
- Stores: Structure, references, positioning
- Does NOT store: Data, configurations, values

**Data Source APIs:**
- Provide: Actual data, configurations, values
- Separate endpoints per widget type
- Can be internal or external APIs

**Frontend:**
1. Fetches dashboard metadata
2. Loops through widgets
3. Fetches data from each dataSourceEndpoint
4. Renders widgets with combined metadata + data

This architecture keeps the dashboard metadata table lean, scalable, and maintainable while providing flexibility for data sources.
