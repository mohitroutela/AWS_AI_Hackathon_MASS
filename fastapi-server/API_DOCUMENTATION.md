# RetailAI Dashboard API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
Currently, the API does not require authentication. This will be added in future versions.

---

## Endpoints

### 1. Health Check

Check if the API is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "environment": "development"
}
```

---

### 2. Create Dashboard

Create a new dashboard for a user.

**Endpoint:** `POST /api/dashboards/`

**Request Body:**
```json
{
  "dashboardName": "My Dashboard",
  "description": "Dashboard for monitoring key metrics",
  "userId": "user-123",
  "widgets": [
    {
      "widgetType": "summaryCard",
      "title": "Key Metrics",
      "position": 0,
      "config": {
        "cards": [
          {
            "title": "Total Revenue",
            "value": "₹4,52,000",
            "change": "+12%",
            "trend": "up"
          }
        ]
      },
      "dataSource": "kpi-api",
      "refreshInterval": 300
    }
  ],
  "layout": "grid",
  "isDefault": false,
  "isPublic": false,
  "tags": ["retail", "analytics"]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Dashboard created successfully",
  "data": {
    "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
    "dashboardName": "My Dashboard",
    "description": "Dashboard for monitoring key metrics",
    "userId": "user-123",
    "widgets": [...],
    "layout": "grid",
    "isDefault": false,
    "isPublic": false,
    "tags": ["retail", "analytics"],
    "createdAt": "2024-02-14T10:30:00.000Z",
    "updatedAt": "2024-02-14T10:30:00.000Z"
  }
}
```

---

### 3. Get Dashboard by ID

Retrieve a specific dashboard by its ID.

**Endpoint:** `GET /api/dashboards/{dashboard_id}`

**Path Parameters:**
- `dashboard_id` (string, required): The unique identifier of the dashboard

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Dashboard retrieved successfully",
  "data": {
    "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
    "dashboardName": "My Dashboard",
    "description": "Dashboard for monitoring key metrics",
    "userId": "user-123",
    "widgets": [...],
    "layout": "grid",
    "isDefault": false,
    "isPublic": false,
    "tags": ["retail", "analytics"],
    "createdAt": "2024-02-14T10:30:00.000Z",
    "updatedAt": "2024-02-14T10:30:00.000Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "detail": "Dashboard 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

---

### 4. Get User Dashboards

Retrieve all dashboards for a specific user.

**Endpoint:** `GET /api/dashboards/user/{user_id}`

**Path Parameters:**
- `user_id` (string, required): The unique identifier of the user

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Dashboards retrieved successfully",
  "data": [
    {
      "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
      "dashboardName": "Main Dashboard",
      "description": "Primary dashboard",
      "userId": "user-123",
      "widgets": [...],
      "layout": "grid",
      "isDefault": true,
      "isPublic": false,
      "tags": ["main"],
      "createdAt": "2024-02-14T10:30:00.000Z",
      "updatedAt": "2024-02-14T10:30:00.000Z"
    },
    {
      "dashboardId": "660e8400-e29b-41d4-a716-446655440001",
      "dashboardName": "Sales Dashboard",
      "description": "Sales analytics",
      "userId": "user-123",
      "widgets": [...],
      "layout": "grid",
      "isDefault": false,
      "isPublic": true,
      "tags": ["sales"],
      "createdAt": "2024-02-14T11:00:00.000Z",
      "updatedAt": "2024-02-14T11:00:00.000Z"
    }
  ],
  "total": 2
}
```

---

### 5. Update Dashboard

Update an existing dashboard.

**Endpoint:** `PUT /api/dashboards/{dashboard_id}`

**Path Parameters:**
- `dashboard_id` (string, required): The unique identifier of the dashboard

**Request Body:** (all fields optional)
```json
{
  "dashboardName": "Updated Dashboard Name",
  "description": "Updated description",
  "widgets": [...],
  "layout": "flex",
  "isDefault": true,
  "isPublic": false,
  "tags": ["updated", "new-tag"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Dashboard updated successfully",
  "data": {
    "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
    "dashboardName": "Updated Dashboard Name",
    "description": "Updated description",
    "userId": "user-123",
    "widgets": [...],
    "layout": "flex",
    "isDefault": true,
    "isPublic": false,
    "tags": ["updated", "new-tag"],
    "createdAt": "2024-02-14T10:30:00.000Z",
    "updatedAt": "2024-02-14T12:00:00.000Z"
  }
}
```

---

### 6. Delete Dashboard

Delete a dashboard permanently.

**Endpoint:** `DELETE /api/dashboards/{dashboard_id}`

**Path Parameters:**
- `dashboard_id` (string, required): The unique identifier of the dashboard

**Response:** `204 No Content`

---

### 7. Add Widget to Dashboard

Add a new widget to an existing dashboard.

**Endpoint:** `POST /api/dashboards/{dashboard_id}/widgets`

**Path Parameters:**
- `dashboard_id` (string, required): The unique identifier of the dashboard

**Request Body:**
```json
{
  "widgetType": "chart",
  "widgetChartType": "line",
  "title": "Revenue Trend",
  "position": 2,
  "config": {
    "xAxis": ["Jan", "Feb", "Mar"],
    "series": [
      {
        "name": "Revenue",
        "data": [100000, 120000, 150000]
      }
    ]
  },
  "dataSource": "revenue-api",
  "refreshInterval": 600
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Widget added successfully",
  "data": {
    "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
    "dashboardName": "My Dashboard",
    "widgets": [
      {
        "widgetId": "770e8400-e29b-41d4-a716-446655440002",
        "widgetType": "chart",
        "widgetChartType": "line",
        "title": "Revenue Trend",
        "position": 2,
        "config": {...},
        "dataSource": "revenue-api",
        "refreshInterval": 600,
        "createdAt": "2024-02-14T12:30:00.000Z",
        "updatedAt": "2024-02-14T12:30:00.000Z"
      }
    ],
    ...
  }
}
```

---

### 8. Remove Widget from Dashboard

Remove a widget from a dashboard.

**Endpoint:** `DELETE /api/dashboards/{dashboard_id}/widgets/{widget_id}`

**Path Parameters:**
- `dashboard_id` (string, required): The unique identifier of the dashboard
- `widget_id` (string, required): The unique identifier of the widget

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Widget removed successfully",
  "data": {
    "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
    "dashboardName": "My Dashboard",
    "widgets": [
      // Remaining widgets
    ],
    ...
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "detail": "Widget 770e8400-e29b-41d4-a716-446655440002 not found in dashboard"
}
```

---

### 9. Reorder Widgets (Drag & Drop)

Update the order of widgets in a dashboard.

**Endpoint:** `PUT /api/dashboards/{dashboard_id}/widgets/reorder`

**Path Parameters:**
- `dashboard_id` (string, required): The unique identifier of the dashboard

**Request Body:** (array of all widgets in new order)
```json
[
  {
    "widgetId": "widget-2",
    "widgetType": "chart",
    "widgetChartType": "line",
    "title": "Revenue Trend",
    "position": 0,
    "config": {...},
    "dataSource": "revenue-api",
    "refreshInterval": 600,
    "createdAt": "2024-02-14T10:30:00.000Z",
    "updatedAt": "2024-02-14T10:30:00.000Z"
  },
  {
    "widgetId": "widget-1",
    "widgetType": "summaryCard",
    "title": "Key Metrics",
    "position": 1,
    "config": {...},
    "dataSource": "kpi-api",
    "refreshInterval": 300,
    "createdAt": "2024-02-14T10:30:00.000Z",
    "updatedAt": "2024-02-14T10:30:00.000Z"
  }
]
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Widgets reordered successfully",
  "data": {
    "dashboardId": "550e8400-e29b-41d4-a716-446655440000",
    "dashboardName": "My Dashboard",
    "widgets": [
      // Widgets in new order with updated positions
    ],
    ...
  }
}
```

---

## Data Models

### Dashboard
```typescript
{
  dashboardId: string;           // UUID
  dashboardName: string;         // 1-100 characters
  description?: string;          // 0-500 characters
  userId: string;                // User identifier
  widgets: Widget[];             // Array of widgets
  layout: string;                // "grid" | "flex" | "custom"
  isDefault: boolean;            // Default dashboard flag
  isPublic: boolean;             // Public access flag
  tags: string[];                // Array of tags
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Widget
```typescript
{
  widgetId: string;              // UUID
  widgetType: WidgetType;        // "summaryCard" | "chart" | "grid"
  widgetChartType?: ChartType;   // "line" | "bar" | "column" | "pie" | "area" | "scatter"
  title?: string;                // Widget title
  position: number;              // Order position
  config: object;                // Widget-specific configuration
  dataSource?: string;           // Data source identifier
  refreshInterval?: number;      // Auto-refresh in seconds
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Resource deleted successfully |
| 400 | Bad Request - Invalid request data |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

Currently, there is no rate limiting. This will be added in future versions.

---

## CORS

The API supports CORS for the following origins (configurable):
- http://localhost:5173 (Vite dev server)
- http://localhost:3000 (React dev server)

---

## Examples

### cURL Examples

**Create Dashboard:**
```bash
curl -X POST http://localhost:8000/api/dashboards/ \
  -H "Content-Type: application/json" \
  -d '{
    "dashboardName": "Test Dashboard",
    "description": "Testing dashboard creation",
    "userId": "user-123",
    "widgets": [],
    "layout": "grid",
    "isDefault": false,
    "isPublic": false,
    "tags": ["test"]
  }'
```

**Get User Dashboards:**
```bash
curl http://localhost:8000/api/dashboards/user/user-123
```

**Add Widget:**
```bash
curl -X POST http://localhost:8000/api/dashboards/{dashboard_id}/widgets \
  -H "Content-Type: application/json" \
  -d '{
    "widgetType": "chart",
    "widgetChartType": "line",
    "title": "Sales Trend",
    "position": 0,
    "config": {},
    "dataSource": "sales-api"
  }'
```

---

## Changelog

### Version 1.0.0 (2024-02-14)
- Initial API release
- Dashboard CRUD operations
- Widget management
- DynamoDB integration
- CORS support
