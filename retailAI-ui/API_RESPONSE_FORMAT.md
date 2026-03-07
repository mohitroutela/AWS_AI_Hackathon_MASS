# AI Copilot API Response Format

## Expected Response Structure

```typescript
{
  message: string;           // The AI's text response
  data?: Array<{            // Optional visualization data
    type: 'chart' | 'grid' | 'summaryCard';
    data: any[];
  }>;
  sessionId?: string;        // Session ID for conversation continuity
}
```

## Visualization Types

### 1. Summary Cards
Display key metrics with trends.

```json
{
  "type": "summaryCard",
  "data": [
    {
      "title": "Items to Restock",
      "value": 12,
      "trend": "up",
      "change": "+3 from last week"
    },
    {
      "title": "Total Value",
      "value": "$45,230",
      "trend": "up",
      "change": "+12%"
    }
  ]
}
```

### 2. Charts (Highcharts)
Any valid Highcharts configuration.

```json
{
  "type": "chart",
  "data": [
    {
      "chart": { "type": "column" },
      "title": { "text": "Inventory Levels by Category" },
      "xAxis": { "categories": ["Electronics", "Clothing", "Home & Garden"] },
      "yAxis": { "title": { "text": "Stock Level" } },
      "series": [
        { "name": "Current Stock", "data": [45, 23, 67] },
        { "name": "Reorder Point", "data": [60, 40, 80] }
      ]
    }
  ]
}
```

Supported chart types:
- `column` - Column/Bar charts
- `line` - Line charts
- `pie` - Pie charts
- `area` - Area charts
- `scatter` - Scatter plots
- And all other Highcharts types

### 3. Data Grid
Tabular data display. Like charts, one `type: 'grid'` can contain multiple grid tables.

```json
{
  "type": "grid",
  "data": [
    {
      "title": "High Priority Items",
      "rows": [
        {
          "product": "Wireless Earbuds Pro",
          "currentStock": 8,
          "reorderPoint": 25,
          "daysToStockout": 2,
          "priority": "High"
        },
        {
          "product": "Smart Watch Series 5",
          "currentStock": 12,
          "reorderPoint": 30,
          "daysToStockout": 3,
          "priority": "High"
        }
      ]
    },
    {
      "title": "Medium Priority Items",
      "rows": [
        {
          "product": "USB-C Cable 6ft",
          "currentStock": 45,
          "reorderPoint": 100,
          "daysToStockout": 5,
          "priority": "Medium"
        }
      ]
    }
  ]
}
```

**Note:** Each grid in the `data` array can have:
- `title` (optional): Header text for the grid
- `rows` (required): Array of row objects with consistent column structure

## Complete Example Response

```json
{
  "message": "Here is the list of products you need to restock. I've analyzed your inventory levels and sales velocity to identify critical items.",
  "sessionId": "session-1234567890",
  "data": [
    {
      "type": "summaryCard",
      "data": [
        { "title": "Items to Restock", "value": 12, "trend": "up", "change": "+3 from last week" },
        { "title": "Total Value", "value": "$45,230", "trend": "up", "change": "+12%" },
        { "title": "Avg Days to Stockout", "value": 4, "trend": "down", "change": "Critical" }
      ]
    },
    {
      "type": "chart",
      "data": [
        {
          "chart": { "type": "column" },
          "title": { "text": "Inventory Levels by Category" },
          "xAxis": { "categories": ["Electronics", "Clothing", "Home & Garden", "Sports", "Books"] },
          "yAxis": { "title": { "text": "Stock Level" } },
          "series": [
            { "name": "Current Stock", "data": [45, 23, 67, 34, 89] },
            { "name": "Reorder Point", "data": [60, 40, 80, 50, 100], "color": "#ef4444" }
          ]
        }
      ]
    },
    {
      "type": "grid",
      "data": [
        {
          "title": "High Priority Items",
          "rows": [
            { "product": "Wireless Earbuds Pro", "currentStock": 8, "reorderPoint": 25, "daysToStockout": 2, "priority": "High" },
            { "product": "Smart Watch Series 5", "currentStock": 12, "reorderPoint": 30, "daysToStockout": 3, "priority": "High" }
          ]
        },
        {
          "title": "Medium Priority Items",
          "rows": [
            { "product": "USB-C Cable 6ft", "currentStock": 45, "reorderPoint": 100, "daysToStockout": 5, "priority": "Medium" }
          ]
        }
      ]
    }
  ]
}
```

## Integration in AICopilot.tsx

Replace the `callAIAPI` function with your actual endpoint:

```typescript
async function callAIAPI(userMessage: string, conversationHistory: Message[], sessionId?: string): Promise<AIResponse> {
  const response = await fetch('YOUR_API_ENDPOINT', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      // Add any auth headers here
    },
    body: JSON.stringify({ 
      message: userMessage,
      history: conversationHistory,
      sessionId: sessionId
    })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}
```

## Notes

- The `data` array is optional - you can return just a message without visualizations
- Multiple visualizations can be included in a single response
- Charts use Highcharts configuration format - see [Highcharts API](https://api.highcharts.com/highcharts/)
- Grid data automatically formats column headers (camelCase → Title Case)
- Priority column in grids gets special color coding (High/Medium/Low)
- Session ID is maintained across the conversation for context
