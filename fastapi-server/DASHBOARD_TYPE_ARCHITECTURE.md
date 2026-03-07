# Dashboard Type Architecture

## Overview
Dashboards are categorized by `dashboardType` which determines what data to fetch for all widgets in that dashboard. Individual widgets don't have data source endpoints - the dashboard type controls data fetching.

## Key Concept

### Dashboard Type
Each dashboard has a `dashboardType` field (e.g., "revenue-type", "inventory-type", "sales-type") that determines:
- What data to fetch
- Which API endpoint to call
- What metrics to display

### Widget Metadata
Widgets store ONLY:
- Widget type (summaryCard, chart, grid)
- Chart type (if applicable)
- Title
- Position
- Refresh interval

Widgets do NOT store:
- Data source endpoints
- Configuration
- Actual data

## Data Model

### Dashboard
```python
{
  "dashboardId": "uuid",
  "dashboardName": "Revenue Dashboard",
  "dashboardType": "revenue-type",  # ← Determines data source
  "userId": "user-123",
  "widgets": [
    {
      "widgetId": "widget-1",
      "sessionId":"uid"
      "widgetType": "chart",
      "widgetChartType": "line",
      "title": "Revenue Trend",
      "position": 0,
      "refreshInterval": 600
    }
  ],
  "layout": "grid",
  "tags": ["revenue", "finance"]
}
```

## Dashboard Types

### Predefined Dashboard Types

| Dashboard Type | Description | Data Endpoint |
|----------------|-------------|---------------|
| `revenue-type` | Revenue metrics and trends | `/api/data/revenue-type` |
| `inventory-type` | Inventory management | `/api/data/inventory-type` |
| `sales-type` | Sales analytics | `/api/data/sales-type` |
| `customer-type` | Customer insights | `/api/data/customer-type` |
| `forecast-type` | Demand forecasting | `/api/data/forecast-type` |
| `pricing-type` | Pricing intelligence | `/api/data/pricing-type` |
| `market-type` | Market trends | `/api/data/market-type` |

## Data Flow

### 1. Frontend Requests Dashboard Metadata
```http
GET /api/dashboards/{dashboardId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
    "dashboardName": "Revenue Dashboard",
    "dashboardType": "revenue-type",
    "widgets": [
      {
        "widgetId": "widget-1",
        "widgetType": "chart",
        "widgetChartType": "line",
        "title": "Revenue Trend",
        "position": 0
      },
      {
        "widgetId": "widget-2",
        "widgetType": "summaryCard",
        "title": "Key Metrics",
        "position": 1
      }
    ]
  }
}
```

### 2. Frontend Fetches Data Based on Dashboard Type
```http
GET /api/data/revenue-type
```

**Response:**
```json
{
  "dashboardType": "revenue-type",
  "data": [
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
          "title": "Profit Margin",
          "value": "24.8%",
          "change": "+4.2%",
          "trend": "up"
        }
      ]
    },
    {
      "type": "chart",
      "data": [{
        "chart": { "type": "line", "height": 400 },
        "title": { "text": "Revenue Trend" },
        "xAxis": { "categories": ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"] },
        "series": [{
          "name": "Revenue",
          "data": [320000, 340000, 335000, 380000, 410000, 452000],
          "color": "#5B5FEF"
        }]
      }]
    },
    {
      "type": "chart",
      "data": [{
        "chart": { "type": "pie", "height": 400 },
        "title": { "text": "Revenue by Category" },
        "series": [{
          "name": "Revenue",
          "data": [
            { "name": "Electronics", "y": 45, "color": "#5B5FEF" },
            { "name": "Clothing", "y": 25, "color": "#10B981" },
            { "name": "Home & Garden", "y": 30, "color": "#FFC107" }
          ]
        }]
      }]
    }
  ]
}
```

### 3. Frontend Matches Data to Widgets
```typescript
async function loadDashboard(dashboardId: string) {
  // 1. Get dashboard metadata
  const metadataResponse = await fetch(`/api/dashboards/${dashboardId}`);
  const dashboard = await metadataResponse.json();
  
  // 2. Fetch data based on dashboardType
  const dataResponse = await fetch(`/api/data/${dashboard.dashboardType}`);
  const widgetData = await dataResponse.json();
  
  // 3. Match data to widgets by position/type
  const widgets = dashboard.widgets.map((widget, index) => ({
    ...widget,
    ...widgetData.data[index]  // Match by position
  }));
  
  return { ...dashboard, widgets };
}
```

## Data Source API Structure

### Endpoint Pattern
```
GET /api/data/{dashboardType}
```

### Response Format
```json
{
  "dashboardType": "revenue-type",
  "data": [
    {
      "type": "summaryCard",
      "data": [...]
    },
    {
      "type": "chart",
      "data": [...]
    },
    {
      "type": "grid",
      "data": [...]
    }
  ]
}
```

The `data` array contains widget data in the same order as widgets in the dashboard metadata.

## Example Implementation

### Backend: Data Source API
```python
# backend/app/api/routes/data_sources.py

from fastapi import APIRouter

router = APIRouter(prefix="/api/data", tags=["data-sources"])

@router.get("/revenue-type")
async def get_revenue_data():
    """Get all widget data for revenue-type dashboards"""
    return {
        "dashboardType": "revenue-type",
        "data": [
            {
                "type": "summaryCard",
                "data": [
                    {"title": "Total Revenue", "value": "₹4,52,000", "change": "+12%", "trend": "up"},
                    {"title": "Profit Margin", "value": "24.8%", "change": "+4.2%", "trend": "up"}
                ]
            },
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

@router.get("/inventory-type")
async def get_inventory_data():
    """Get all widget data for inventory-type dashboards"""
    return {
        "dashboardType": "inventory-type",
        "data": [
            {
                "type": "summaryCard",
                "data": [
                    {"title": "High Risk Items", "value": "8", "change": "+2", "trend": "up"},
                    {"title": "Stockout Risk", "value": "12%", "change": "+3%", "trend": "up"}
                ]
            },
            {
                "type": "chart",
                "data": [{
                    "chart": {"type": "bar"},
                    "title": {"text": "Inventory Risk by Category"},
                    "series": [{"name": "Risk Score", "data": [85, 45, 25, 60, 15]}]
                }]
            },
            {
                "type": "grid",
                "data": [{
                    "title": "High Risk Items",
                    "rows": [
                        {"product": "Wireless Earbuds", "stock": 8, "reorderPoint": 25, "risk": "High"}
                    ]
                }]
            }
        ]
    }

@router.get("/sales-type")
async def get_sales_data():
    """Get all widget data for sales-type dashboards"""
    return {
        "dashboardType": "sales-type",
        "data": [
            {
                "type": "summaryCard",
                "data": [
                    {"title": "Total Sales", "value": "₹8,45,000", "change": "+18%", "trend": "up"}
                ]
            },
            {
                "type": "chart",
                "data": [{
                    "chart": {"type": "column"},
                    "title": {"text": "Sales by Category"},
                    "series": [{"name": "Sales", "data": [45000, 23000, 67000]}]
                }]
            },
            {
                "type": "grid",
                "data": [{
                    "title": "Top Products",
                    "rows": [
                        {"product": "Wireless Earbuds", "sales": 1204, "revenue": "₹2,40,800"}
                    ]
                }]
            }
        ]
    }
```

### Frontend: Dashboard Loader
```typescript
// frontend/src/services/dashboard.service.ts

export async function loadDashboard(dashboardId: string) {
  // 1. Get dashboard metadata
  const metadataResponse = await fetch(`/api/dashboards/${dashboardId}`);
  const metadata = await metadataResponse.json();
  const dashboard = metadata.data;
  
  // 2. Fetch data based on dashboardType
  const dataResponse = await fetch(`/api/data/${dashboard.dashboardType}`);
  const widgetData = await dataResponse.json();
  
  // 3. Combine metadata with data
  const widgets = dashboard.widgets.map((widget, index) => ({
    ...widget,
    ...widgetData.data[index]
  }));
  
  return {
    ...dashboard,
    widgets
  };
}
```

## Benefits

### 1. Simplified Storage
- Dashboard metadata table only stores structure
- No complex widget configurations
- Smaller database footprint

### 2. Centralized Data Logic
- All data for a dashboard type in one place
- Easy to update data logic
- Consistent data format

### 3. Type Safety
- Dashboard type determines data structure
- Frontend knows what to expect
- Easier validation

### 4. Flexibility
- Easy to add new dashboard types
- Can reuse dashboard types
- Simple to modify data without touching metadata

### 5. Performance
- Single API call for all widget data
- No need to loop through widgets
- Better caching opportunities

## Creating New Dashboard Types

### Step 1: Define Dashboard Type
```python
# Add to your constants or enum
DASHBOARD_TYPES = {
    "revenue-type": "Revenue Dashboard",
    "inventory-type": "Inventory Dashboard",
    "sales-type": "Sales Dashboard",
    "custom-type": "Custom Dashboard"  # New type
}
```

### Step 2: Create Data Source Endpoint
```python
@router.get("/custom-type")
async def get_custom_data():
    return {
        "dashboardType": "custom-type",
        "data": [
            # Widget data in order
        ]
    }
```

### Step 3: Create Dashboard with New Type
```python
dashboard = DashboardCreate(
    dashboardName="My Custom Dashboard",
    dashboardType="custom-type",
    userId="user-123",
    widgets=[...]
)
```

## Best Practices

### 1. Consistent Naming
Use descriptive, hyphenated names:
- ✅ `revenue-type`
- ✅ `inventory-type`
- ❌ `type1`
- ❌ `dashboard_revenue`

### 2. Data Order
Ensure data array order matches widget position order in metadata.

### 3. Error Handling
```python
@router.get("/{dashboard_type}")
async def get_dashboard_data(dashboard_type: str):
    if dashboard_type not in DASHBOARD_TYPES:
        raise HTTPException(404, f"Dashboard type '{dashboard_type}' not found")
    
    # Return data
```

### 4. Caching
Cache data source responses based on dashboard type:
```python
@cache(ttl=300)  # Cache for 5 minutes
@router.get("/revenue-type")
async def get_revenue_data():
    # ...
```

### 5. Versioning
Include version in dashboard type if needed:
- `revenue-type-v1`
- `revenue-type-v2`

## Migration from Old Approach

If you have dashboards with `dataSourceEndpoint` in widgets:

```python
# Migration script
for dashboard in old_dashboards:
    # Determine dashboard type from widgets
    dashboard_type = infer_dashboard_type(dashboard.widgets)
    
    # Update dashboard
    dashboard.dashboardType = dashboard_type
    
    # Remove dataSourceEndpoint from widgets
    for widget in dashboard.widgets:
        if hasattr(widget, 'dataSourceEndpoint'):
            delattr(widget, 'dataSourceEndpoint')
    
    # Save updated dashboard
    save_dashboard(dashboard)
```

## Summary

**Dashboard Level:**
- `dashboardType` field determines data source
- One API call: `/api/data/{dashboardType}`
- Returns all widget data in order

**Widget Level:**
- No data source endpoints
- Only metadata (type, title, position)
- Data matched by position

This architecture keeps metadata simple while providing flexibility for data sources.
