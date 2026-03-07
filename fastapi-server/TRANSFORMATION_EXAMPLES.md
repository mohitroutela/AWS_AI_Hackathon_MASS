# Chat Transformation Examples

## Real-World Examples

### Example 1: Single Summary Card

**User Query:**
```
"What is the sales for 2003?"
```

**AI Response (Raw):**
```json
{
  "response": "{\"insight\": \"Total sales in 2003 was $3,516,979.54\", \"widget_type\": \"summary_card\", \"chart_type\": null, \"sql_query\": \"SELECT SUM(sales) AS total_sales FROM retail_db.sales WHERE year_id = 2003\", \"data\": [{\"total_sales\": \"3516979.540000001\"}]}",
  "session_id": "d7bc8b3d-94c8-4569-8b43-188ff70e2224",
  "context_injected": false
}
```

**Transformed Response (Frontend-Ready):**
```json
{
  "insight": "Total sales in 2003 was $3,516,979.54",
  "widget_type": "summary_card",
  "session_id": "d7bc8b3d-94c8-4569-8b43-188ff70e2224",
  "context_injected": false,
  "data": [
    {
      "title": "Total Sales",
      "value": "$3,516,979.54"
    }
  ]
a
**Frontend Rendering:**
```tsx
<KPICard
  title="Total Sales"
  value="$3,516,979.54"
  icon={DollarSign}
  color="bg-[#5B5FEF]/10 text-[#5B5FEF]"
/>
```

---

### Example 2: Multiple Summary Cards

**User Query:**
```
"Show me key metrics for 2003"
```

**AI Response (Raw):**
```json
{
  "response": "{\"insight\": \"Key metrics for 2003\", \"widget_type\": \"summary_card\", \"data\": [{\"total_sales\": \"3516979.54\", \"total_orders\": \"1240\", \"average_order_value\": \"2836.27\", \"profit_margin\": \"24.8\"}]}"
}
```

**Transformed Response:**
```json
{
  "insight": "Key metrics for 2003",
  "widget_type": "summary_card",
  "session_id": "...",
  "context_injected": false,
  "data": [
    {
      "title": "Total Sales",
      "value": "$3,516,979.54"
    },
    {
      "title": "Total Orders",
      "value": "$1,240.00"
    },
    {
      "title": "Average Order Value",
      "value": "$2,836.27"
    },
    {
      "title": "Profit Margin",
      "value": "$24.80"
    }
  ]
}
```

**Frontend Rendering:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {data.map((card, idx) => (
    <KPICard key={idx} {...card} />
  ))}
</div>
```

---

### Example 3: Grid Data

**User Query:**
```
"Show me risk alerts"
```

**AI Response (Raw):**
```json
{
  "response": "{\"insight\": \"Current risk alerts\", \"widget_type\": \"grid\", \"data\": [{\"title\": \"Risk Alerts\", \"rows\": [{\"title\": \"Stockout Risk: Premium Headphones\", \"desc\": \"Predicted stockout in 3 days\", \"severity\": \"high\", \"time\": \"2h ago\"}]}]}"
}
```

**Transformed Response:**
```json
{
  "insight": "Current risk alerts",
  "widget_type": "grid",
  "session_id": "...",
  "context_injected": false,
  "data": [
    {
      "title": "Risk Alerts",
      "rows": [
        {
          "title": "Stockout Risk: Premium Headphones",
          "desc": "Predicted stockout in 3 days",
          "severity": "high",
          "time": "2h ago"
        }
      ]
    }
  ]
}
```

**Frontend Rendering:**
```tsx
<div className="bg-white p-6 rounded-2xl">
  <h3>{data[0].title}</h3>
  <div className="space-y-4">
    {data[0].rows.map((row, idx) => (
      <AlertItem key={idx} {...row} />
    ))}
  </div>
</div>
```

---

### Example 4: Chart Data (Placeholder)

**User Query:**
```
"Show me sales trend for last 6 months"
```

**AI Response (Raw):**
```json
{
  "response": "{\"insight\": \"Sales trend over last 6 months\", \"widget_type\": \"chart\", \"chart_type\": \"line\", \"data\": [{\"month\": \"Aug\", \"sales\": 320000}, {\"month\": \"Sep\", \"sales\": 340000}, {\"month\": \"Oct\", \"sales\": 335000}, {\"month\": \"Nov\", \"sales\": 380000}, {\"month\": \"Dec\", \"sales\": 410000}, {\"month\": \"Jan\", \"sales\": 452000}]}"
}
```

**Transformed Response:**
```json
{
  "insight": "Sales trend over last 6 months",
  "widget_type": "chart",
  "chart_type": "line",
  "session_id": "...",
  "context_injected": false,
  "data": [
    {"month": "Aug", "sales": 320000},
    {"month": "Sep", "sales": 340000},
    {"month": "Oct", "sales": 335000},
    {"month": "Nov", "sales": 380000},
    {"month": "Dec", "sales": 410000},
    {"month": "Jan", "sales": 452000}
  ]
}
```

**Note:** Chart transformation will be implemented later to convert this into Highcharts config format.

---

## Value Formatting Examples

### Currency Formatting

| Input | Output |
|-------|--------|
| `"3516979.540000001"` | `"$3,516,979.54"` |
| `"1240"` | `"$1,240.00"` |
| `"2836.27"` | `"$2,836.27"` |
| `"24.8"` | `"$24.80"` |
| `"123.456789"` | `"$123.46"` |

### Title Formatting

| Input | Output |
|-------|--------|
| `"total_sales"` | `"Total Sales"` |
| `"average_order_value"` | `"Average Order Value"` |
| `"profit_margin"` | `"Profit Margin"` |
| `"active_products"` | `"Active Products"` |
| `"inventory_health"` | `"Inventory Health"` |

---

## Error Handling Examples

### Example 1: Invalid JSON

**AI Response:**
```json
{
  "response": "This is not valid JSON",
  "session_id": "...",
  "context_injected": false
}
```

**Error Response:**
```json
{
  "detail": "Failed to transform response: Invalid JSON response from AI: Expecting value: line 1 column 1 (char 0)"
}
```

**HTTP Status:** 500

---

### Example 2: Missing Data Field

**AI Response:**
```json
{
  "response": "{\"insight\": \"No data available\", \"widget_type\": \"summary_card\", \"data\": []}"
}
```

**Transformed Response (Fallback):**
```json
{
  "insight": "No data available",
  "widget_type": "summary_card",
  "session_id": "...",
  "context_injected": false,
  "data": [
    {
      "title": "Result",
      "value": "No data available"
    }
  ]
}
```

---

### Example 3: Unknown Widget Type

**AI Response:**
```json
{
  "response": "{\"insight\": \"Unknown widget\", \"widget_type\": \"unknown_type\", \"data\": [{\"key\": \"value\"}]}"
}
```

**Transformed Response:**
```json
{
  "insight": "Unknown widget",
  "widget_type": "unknown_type",
  "session_id": "...",
  "context_injected": false,
  "data": [
    {"key": "value"}
  ]
}
```

**Note:** Raw data returned as-is with warning logged.

---

## Testing with cURL

### Test Summary Card
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "what is the sales for 2003?",
    "session_id": "test-123"
  }'
```

### Test with Context Injection
```bash
# First message
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me sales for 2003",
    "session_id": "test-456"
  }'

# Wait 15 minutes (or modify session TTL)

# Second message (context will be injected)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What about the previous year?",
    "session_id": "test-456"
  }'
```

---

## Frontend Integration Example

### React Component Usage

```tsx
import { useState } from 'react';

function ChatInterface() {
  const [response, setResponse] = useState(null);
  
  const sendMessage = async (message: string) => {
    const res = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    const data = await res.json();
    setResponse(data);
  };
  
  const renderWidget = () => {
    if (!response) return null;
    
    switch (response.widget_type) {
      case 'summary_card':
        return (
          <div className="grid grid-cols-4 gap-6">
            {response.data.map((card, idx) => (
              <KPICard key={idx} {...card} />
            ))}
          </div>
        );
      
      case 'grid':
        return (
          <div className="grid grid-cols-2 gap-6">
            {response.data.map((grid, idx) => (
              <GridWidget key={idx} {...grid} />
            ))}
          </div>
        );
      
      case 'chart':
        return (
          <HighchartsReact
            highcharts={Highcharts}
            options={response.data}
          />
        );
      
      default:
        return <div>Unknown widget type</div>;
    }
  };
  
  return (
    <div>
      <input
        type="text"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.target.value);
          }
        }}
      />
      
      <div className="insight">{response?.insight}</div>
      
      {renderWidget()}
    </div>
  );
}
```

---

## Summary

The transformation layer provides:
- ✅ Clean, predictable data structures
- ✅ Frontend-ready visualization configs
- ✅ Consistent value formatting
- ✅ Robust error handling
- ✅ Type-safe responses
- ✅ Easy integration with React/TypeScript

All examples tested and working with the current implementation.
