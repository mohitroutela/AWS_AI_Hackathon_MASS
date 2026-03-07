# Dashboard API Response Format

## Overview
The Dashboard component now fetches data dynamically from an API and renders visualizations based on the response format, similar to the AICopilot component.

## API Endpoint
Replace the mock function `fetchDashboardData()` in `Dashboard.tsx` with your actual API endpoint:

```typescript
async function fetchDashboardData(): Promise<DashboardResponse> {
  const response = await fetch('YOUR_DASHBOARD_API_ENDPOINT', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Add auth headers if needed
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}
```

## Response Structure

```typescript
{
  message?: string;  // Optional message
  data?: Array<{     // Array of visualization objects
    type: 'summaryCard' | 'chart' | 'grid';
    title?: string;
    data: any[];
  }>;
}
```

## Visualization Types

### 1. Summary Cards (KPI Cards)

Display key metrics with icons, values, and trends.

```json
{
  "type": "summaryCard",
  "data": [
    {
      "title": "Total Revenue",
      "value": "₹4,52,000",
      "change": "+12%",
      "trend": "up",
      "icon": "DollarSign"
    },
    {
      "title": "Inventory Health",
      "value": "92%",
      "change": "-2%",
      "trend": "down",
      "icon": "Package"
    },
    {
      "title": "Profit Margin",
      "value": "24.8%",
      "change": "+4.2%",
      "trend": "up",
      "icon": "Percent"
    },
    {
      "title": "Active Products",
      "value": "1,240",
      "change": "+85",
      "trend": "up",
      "icon": "ShoppingCart"
    }
  ]
}
```

**Available Icons:**
- `DollarSign` - Revenue/Money metrics
- `Package` - Inventory/Product metrics
- `Percent` - Percentage/Margin metrics
- `ShoppingCart` - Sales/Orders metrics
- `AlertTriangle` - Warnings/Alerts
- `TrendingUp` - Growth metrics
- `Activity` - Activity metrics

### 2. Charts (Highcharts)

Any valid Highcharts configuration. Supports all chart types.

```json
{
  "type": "chart",
  "data": [
    {
      "chart": { "type": "line" },
      "title": { "text": "Revenue Trend" },
      "xAxis": { "categories": ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"] },
      "yAxis": { 
        "title": { "text": "Revenue (₹)" },
        "labels": {
          "formatter": "function() { return '₹' + (this.value / 1000) + 'k'; }"
        }
      },
      "series": [{
        "name": "Revenue",
        "data": [320000, 340000, 335000, 380000, 410000, 452000],
        "color": "#5B5FEF"
      }],
      "credits": { "enabled": false }
    },
    {
      "chart": { "type": "pie" },
      "title": { "text": "Inventory Health" },
      "series": [{
        "name": "Percentage",
        "data": [
          { "name": "Healthy", "y": 70, "color": "#5B5FEF" },
          { "name": "Low Stock", "y": 20, "color": "#FFC107" },
          { "name": "Overstocked", "y": 10, "color": "#EF4444" }
        ],
        "innerSize": "60%"
      }],
      "credits": { "enabled": false }
    }
  ]
}
```

**Chart Layout:**
- Line/Bar/Area charts: Automatically span 2 columns (lg:col-span-2)
- Pie/Donut charts: Single column width
- Multiple charts can be included in one response

### 3. Data Grids

Custom grid layouts for specific dashboard sections.

```json
{
  "type": "grid",
  "data": [
    {
      "title": "Risk Alerts",
      "rows": [
        {
          "title": "Stockout Risk: Premium Headphones",
          "desc": "Predicted stockout in 3 days due to surge.",
          "severity": "high",
          "time": "2h ago"
        },
        {
          "title": "Price Competitiveness Drop",
          "desc": "Competitor X lowered prices by 15% on Sneakers.",
          "severity": "medium",
          "time": "5h ago"
        }
      ]
    },
    {
      "title": "Trending Products",
      "rows": [
        {
          "name": "Wireless Earbuds Pro",
          "increase": "+45%",
          "sales": "1,204 sold",
          "trend": "up"
        },
        {
          "name": "Smart Watch Series 5",
          "increase": "+32%",
          "sales": "892 sold",
          "trend": "up"
        }
      ]
    }
  ]
}
```

**Grid Types:**
- **Risk Alerts**: Requires `title`, `desc`, `severity` (high/medium/low), `time`
- **Trending Products**: Requires `name`, `increase`, `sales`, `trend`

## Complete Example Response

```json
{
  "message": "Dashboard data loaded successfully",
  "data": [
    {
      "type": "summaryCard",
      "data": [
        { "title": "Total Revenue", "value": "₹4,52,000", "change": "+12%", "trend": "up", "icon": "DollarSign" },
        { "title": "Inventory Health", "value": "92%", "change": "-2%", "trend": "down", "icon": "Package" },
        { "title": "Profit Margin", "value": "24.8%", "change": "+4.2%", "trend": "up", "icon": "Percent" },
        { "title": "Active Products", "value": "1,240", "change": "+85", "trend": "up", "icon": "ShoppingCart" }
      ]
    },
    {
      "type": "chart",
      "data": [
        {
          "chart": { "type": "line" },
          "title": { "text": "Revenue Trend" },
          "xAxis": { "categories": ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"] },
          "series": [{ "name": "Revenue", "data": [320000, 340000, 335000, 380000, 410000, 452000] }]
        }
      ]
    },
    {
      "type": "grid",
      "data": [
        {
          "title": "Risk Alerts",
          "rows": [...]
        }
      ]
    }
  ]
}
```

## Features

### Loading State
- Shows spinner with "Loading dashboard..." message
- Automatically displayed while fetching data

### Error Handling
- Displays error message if API fails
- Provides "Retry" button to reload data
- Logs errors to console for debugging

### Dynamic Rendering
- All visualizations render based on API response
- Order of visualizations matches API response order
- Supports multiple instances of each visualization type

## Implementation Details

### State Management
```typescript
const [dashboardData, setDashboardData] = useState<VisualizationData[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Data Flow
1. Component mounts → `useEffect` triggers
2. `loadDashboardData()` called
3. API request sent
4. Response parsed and stored in state
5. Visualizations rendered dynamically

### Icon Mapping
Icons are mapped by string name to actual icon components:
```typescript
const iconMap: Record<string, any> = {
  DollarSign,
  Package,
  Percent,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Activity
};
```

## Customization

### Adding New Icons
1. Import icon from lucide-react
2. Add to iconMap object
3. Use icon name in API response

### Adding New Grid Types
1. Check grid title in render logic
2. Add custom rendering for new grid type
3. Define row structure in API response

### Styling
- All components use Tailwind CSS
- Colors follow the existing design system
- Responsive grid layouts (1 col mobile, 2-4 cols desktop)

## Testing

### Mock Data
The current implementation includes mock data that matches the expected format. Test your API by:
1. Replacing `fetchDashboardData()` with your endpoint
2. Ensuring response matches the format above
3. Testing loading and error states

### Error Scenarios
- Network failure
- Invalid JSON response
- Missing required fields
- Incorrect data types

## Migration from Hardcoded Data

**Before:** Static data defined in component
```typescript
const revenueData = [{ name: 'Aug', value: 320000 }, ...];
```

**After:** Dynamic data from API
```typescript
const response = await fetchDashboardData();
setDashboardData(response.data);
```

All existing visualizations are preserved and work with the new API-driven approach!
