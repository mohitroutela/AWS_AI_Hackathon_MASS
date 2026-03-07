# All Pages API Integration

## Overview
All main pages (except AI Copilot and Data Management) have been converted to use API-driven visualizations with a consistent response format.

## Updated Pages

1. ✅ **Dashboard** - Overview with KPIs, charts, and alerts
2. ✅ **Demand Forecast** - AI-driven predictions
3. ✅ **Pricing Intelligence** - Competitive pricing analysis
4. ✅ **Inventory Risk** - Stockout and overstock risks
5. ✅ **Market Trends** - Industry insights
6. ✅ **Customer Insights** - Segment performance and retention

## Architecture

### Reusable Component: `APIPage`
Created a reusable wrapper component (`src/app/utils/apiDrivenPage.tsx`) that handles:
- API data fetching
- Loading states
- Error handling with retry
- Dynamic visualization rendering
- Custom grid rendering support

### Usage Pattern
```typescript
import { APIPage, APIResponse } from '../utils/apiDrivenPage';

async function fetchPageData(): Promise<APIResponse> {
  const response = await fetch('YOUR_API_ENDPOINT');
  return response.json();
}

export function YourPage() {
  return (
    <APIPage
      title="Page Title"
      subtitle="Page description"
      fetchData={fetchPageData}
      headerActions={<>Your buttons here</>}
      renderCustomGrid={(gridConfig, idx) => {
        // Optional custom grid rendering
      }}
    />
  );
}
```

## API Response Format

All pages use the same response structure:

```typescript
{
  message?: string;
  data?: Array<{
    type: 'summaryCard' | 'chart' | 'grid';
    title?: string;
    data: any[];
  }>;
}
```

### 1. Summary Cards
```json
{
  "type": "summaryCard",
  "data": [
    {
      "title": "Metric Name",
      "value": "Value",
      "change": "+12%",
      "trend": "up"
    }
  ]
}
```

### 2. Charts (Highcharts)
```json
{
  "type": "chart",
  "data": [
    {
      "chart": { "type": "line", "height": 400 },
      "title": { "text": "Chart Title" },
      "xAxis": { "categories": [...] },
      "yAxis": { "title": { "text": "Y Axis" } },
      "series": [...],
      "credits": { "enabled": false }
    }
  ]
}
```

### 3. Grids (Tables)
```json
{
  "type": "grid",
  "data": [
    {
      "title": "Grid Title",
      "rows": [
        { "column1": "value1", "column2": "value2" }
      ]
    }
  ]
}
```

## Page-Specific Details

### Dashboard
**Endpoint:** `YOUR_DASHBOARD_API_ENDPOINT`
**Features:**
- 4 KPI cards (Revenue, Inventory, Margin, Products)
- Revenue trend line chart
- Inventory health pie chart
- Risk alerts grid
- Trending products grid

### Demand Forecast
**Endpoint:** `YOUR_FORECAST_API_ENDPOINT`
**Features:**
- 4 KPI cards (Growth, High Demand Items, Accuracy, Days)
- Historical vs Predicted line chart with dashed prediction line
- 14-day forecast visualization

### Pricing Intelligence
**Endpoint:** `YOUR_PRICING_API_ENDPOINT`
**Features:**
- 4 KPI cards (Avg Price, Competitive Index, Optimizations, Revenue Impact)
- Price comparison column chart (Your Price vs Competitor vs Recommended)
- Multi-series comparison for top products

### Inventory Risk
**Endpoint:** `YOUR_INVENTORY_RISK_API_ENDPOINT`
**Features:**
- 4 KPI cards (High Risk Items, Stockout Risk, Overstock, Optimal Stock)
- Risk score bar chart by category with color coding
- High risk items table with custom rendering

**Custom Grid:**
```typescript
renderCustomGrid={(gridConfig, idx) => {
  // Custom table with risk badges
  return <CustomTable data={gridConfig.rows} />;
}}
```

### Market Trends
**Endpoint:** `YOUR_MARKET_TRENDS_API_ENDPOINT`
**Features:**
- 4 KPI cards (Trending Categories, Market Growth, Competitors, Sentiment)
- Multi-series area chart for trend comparison
- Category distribution pie chart

### Customer Insights
**Endpoint:** `YOUR_CUSTOMER_INSIGHTS_API_ENDPOINT`
**Features:**
- 4 KPI cards (Total Customers, Retention, Avg Order Value, CLV)
- Customer segments column chart
- Acquisition trend line chart with target line
- Customer segments table with custom rendering

## Integration Steps

### For Each Page:

1. **Replace Mock Function**
```typescript
async function fetchPageData(): Promise<APIResponse> {
  const response = await fetch('YOUR_ACTUAL_ENDPOINT', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN' // if needed
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}
```

2. **Ensure Response Format**
Your API should return data matching the format shown above.

3. **Test Loading & Error States**
- Loading: Automatic spinner while fetching
- Error: Shows error message with retry button
- Success: Renders visualizations dynamically

## Features

### Loading State
- Centered spinner with loading message
- Automatic display during API calls
- Smooth transition to content

### Error Handling
- User-friendly error messages
- Retry button to reload data
- Console logging for debugging
- Graceful fallback

### Dynamic Rendering
- Visualizations render in order from API response
- Supports multiple instances of each type
- Responsive grid layouts
- Smooth animations

### Custom Grid Rendering
Pages can provide custom grid rendering:
```typescript
<APIPage
  renderCustomGrid={(gridConfig, idx) => {
    if (gridConfig.title === 'Special Grid') {
      return <CustomComponent data={gridConfig.rows} />;
    }
    return null; // Use default rendering
  }}
/>
```

## Chart Types Supported

All Highcharts chart types are supported:
- Line charts
- Area charts
- Column/Bar charts
- Pie/Donut charts
- Scatter plots
- Combination charts
- And more...

## Styling

All pages use consistent styling:
- Tailwind CSS classes
- Indigo primary color (#5B5FEF)
- Rounded corners (rounded-2xl)
- Subtle shadows and borders
- Responsive layouts

## Benefits

1. **Consistency** - All pages use same API format
2. **Maintainability** - Single source of truth for rendering logic
3. **Reusability** - APIPage component used across all pages
4. **Flexibility** - Custom rendering for special cases
5. **Error Handling** - Built-in loading and error states
6. **Type Safety** - TypeScript interfaces for all data structures

## Testing

### Mock Data
Each page includes mock data that demonstrates the expected format. Use this to:
1. Test the UI before API is ready
2. Understand the required data structure
3. Validate your API responses

### API Testing Checklist
- [ ] Response matches expected format
- [ ] All required fields present
- [ ] Chart configurations valid
- [ ] Loading state works
- [ ] Error handling works
- [ ] Retry functionality works
- [ ] Data renders correctly

## Migration Summary

**Before:** Hardcoded data in each component
```typescript
const data = [{ name: 'Aug', value: 320000 }, ...];
```

**After:** Dynamic data from API
```typescript
const response = await fetchPageData();
setPageData(response.data);
```

All pages now support real-time data updates from your backend APIs!
