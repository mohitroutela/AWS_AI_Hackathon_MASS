# Dashboard Configuration Files

This folder contains configuration files for dashboard creation and management.

## Files

### `default_dashboard_config.json`
Default dashboard configuration used when creating a dashboard without providing custom data.

**Structure:**
```json
{
  "dashboardName": "Revenue Dashboard",
  "dashboardType": "revenue-type",
  "description": "Dashboard description",
  "userId": "auto-generated-uuid",
  "widgets": [
    {
      "widgetType": "summaryCard|chart|grid",
      "widgetChartType": "line|bar|column|pie|area|scatter",
      "title": "Widget Title",
      "position": 0,
      "refreshInterval": 300
    }
  ],
  "layout": "grid",
  "isDefault": true,
  "isPublic": false,
  "tags": ["tag1", "tag2"]
}
```

### `create_dashboards_table_payload.json`
DynamoDB table creation payload for the dashboards table.

## Usage

### Create Dashboard with Default Config

**Option 1: Using query parameter**
```bash
POST http://localhost:8000/api/dashboards/?use_default=true
```

**Option 2: Empty POST request**
```bash
POST http://localhost:8000/api/dashboards/
# (with no body)
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard created successfully",
  "data": {
    "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
    "dashboardName": "Revenue Dashboard",
    "dashboardType": "revenue-type",
    "description": "Default revenue analytics dashboard with key metrics and trends",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "widgets": [
      {
        "widgetId": "widget-uuid-1",
        "widgetType": "summaryCard",
        "title": "Key Metrics",
        "position": 0,
        "refreshInterval": 300,
        "createdAt": "2026-03-01T13:00:00.000000",
        "updatedAt": "2026-03-01T13:00:00.000000"
      },
      {
        "widgetId": "widget-uuid-2",
        "widgetType": "chart",
        "widgetChartType": "line",
        "title": "Revenue Trend",
        "position": 1,
        "refreshInterval": 600,
        "createdAt": "2026-03-01T13:00:00.000000",
        "updatedAt": "2026-03-01T13:00:00.000000"
      }
    ],
    "layout": "grid",
    "isDefault": true,
    "isPublic": false,
    "tags": ["revenue", "sales", "default"],
    "createdAt": "2026-03-01T13:00:00.000000",
    "updatedAt": "2026-03-01T13:00:00.000000"
  }
}
```

### Create Dashboard with Custom Config

```bash
POST http://localhost:8000/api/dashboards/
Content-Type: application/json

{
  "dashboardName": "Custom Dashboard",
  "dashboardType": "sales-type",
  "description": "My custom dashboard",
  "userId": "user-123",
  "widgets": [
    {
      "widgetType": "chart",
      "widgetChartType": "bar",
      "title": "Sales Chart",
      "position": 0,
      "refreshInterval": 600
    }
  ],
  "layout": "grid",
  "isDefault": false,
  "isPublic": true,
  "tags": ["sales", "custom"]
}
```

## Widget Types

### Summary Card
```json
{
  "widgetType": "summaryCard",
  "title": "Key Metrics",
  "position": 0,
  "refreshInterval": 300
}
```

### Chart
```json
{
  "widgetType": "chart",
  "widgetChartType": "line",
  "title": "Revenue Trend",
  "position": 1,
  "refreshInterval": 600
}
```

**Chart Types:**
- `line` - Line chart
- `bar` - Bar chart
- `column` - Column chart
- `pie` - Pie chart
- `area` - Area chart
- `scatter` - Scatter plot

### Grid
```json
{
  "widgetType": "grid",
  "title": "Data Table",
  "position": 2,
  "refreshInterval": 900
}
```

## Dashboard Types

Available dashboard types that determine data sources:

- `revenue-type` - Revenue metrics and analytics
- `inventory-type` - Inventory management
- `sales-type` - Sales analytics
- `customer-type` - Customer insights
- `forecast-type` - Demand forecasting
- `pricing-type` - Pricing intelligence
- `market-type` - Market trends

## Notes

- `dashboardId` is auto-generated (UUID)
- `userId` is auto-generated (UUID) when using default config
- `widgetId` is auto-generated for each widget (UUID)
- `createdAt` and `updatedAt` timestamps are auto-generated
- `position` determines widget order (0-indexed)
- `refreshInterval` is in seconds
- Widget data is fetched from `/api/data/{dashboardType}` endpoint based on position

## Customizing Default Config

To change the default dashboard configuration:

1. Edit `default_dashboard_config.json`
2. Modify fields as needed
3. Restart the server (if not using auto-reload)
4. New default dashboards will use the updated config
