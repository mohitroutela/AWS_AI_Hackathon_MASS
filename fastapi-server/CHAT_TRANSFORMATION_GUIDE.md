# Chat Response Transformation Guide

## Overview
The chat endpoint now transforms AI responses into frontend-compatible visualization configs. This document explains the transformation logic and data structures.

---

## Flow Diagram

```
User Request
    ↓
Chat Router (/chat)
    ↓
AI Response (stringified JSON)
    ↓
ChatResponseTransformer
    ↓
Transformed Response (structured JSON)
    ↓
Frontend (Dashboard.tsx)
```

---

## Input Structure

### User Request
```json
{
  "message": "what is the sales for 2003?",
  "session_id": "optional-uuid"
}
```

### AI Raw Response (from Bedrock)
```json
{
  "response": "{\"insight\": \"Total sales in 2003 was $3,516,979.54\", \"widget_type\": \"summary_card\", \"chart_type\": null, \"sql_query\": \"SELECT SUM(sales) AS total_sales FROM retail_db.sales WHERE year_id = 2003\", \"data\": [{\"total_sales\": \"3516979.540000001\"}]}",
  "session_id": "d7bc8b3d-94c8-4569-8b43-188ff70e2224",
  "context_injected": false
}
```

**Note:** The `response` field is a stringified JSON that needs to be parsed.

---

## Transformation Process

### Step 1: Parse Stringified JSON
```python
ai_data = json.loads(raw_response)
# Result:
# {
#   "insight": "Total sales in 2003 was $3,516,979.54",
#   "widget_type": "summary_card",
#   "chart_type": null,
#   "sql_query": "SELECT ...",
#   "data": [{"total_sales": "3516979.540000001"}]
# }
```

### Step 2: Extract Base Fields
```python
insight = ai_data.get('insight', '')
widget_type = ai_data.get('widget_type', '')
chart_type = ai_data.get('chart_type')
raw_data = ai_data.get('data', [])
```

### Step 3: Transform Data Based on Widget Type
The transformation logic varies by `widget_type`:

#### A. Summary Card (`widget_type: "summary_card"`)
**Input Data:**
```json
[{"total_sales": "3516979.540000001"}]
```

**Transformation Logic:**
1. Iterate through each key-value pair in data
2. Convert key to Title Case (e.g., `total_sales` → `Total Sales`)
3. Format value (add currency symbol, commas)
4. Create card config

**Output Data:**
```json
[
  {
    "title": "Total Sales",
    "value": "$3,516,979.54"
  }
]
```

**Optional Fields (not included unless provided by AI):**
- `change`: Percentage change (e.g., "+12%")
- `trend`: Trend direction ("up" | "down")
- `icon`: Icon name (e.g., "DollarSign")

#### B. Grid (`widget_type: "grid"`)
**Transformation:** None - data returned as-is

**Input/Output:**
```json
[
  {
    "title": "Risk Alerts",
    "rows": [
      {"title": "...", "desc": "...", "severity": "high"}
    ]
  }
]
```

#### C. Chart (`widget_type: "chart"`)
**Status:** To be implemented later

**Current Behavior:** Returns raw data as-is

---

## Output Structure

### Transformed Response
```json
{
  "insight": "Total sales in 2003 was $3,516,979.54",
  "widget_type": "summary_card",
  "chart_type": null,
  "session_id": "d7bc8b3d-94c8-4569-8b43-188ff70e2224",
  "context_injected": false,
  "data": [
    {
      "title": "Total Sales",
      "value": "$3,516,979.54"
    }
  ]
}
```

**Field Descriptions:**
- `insight`: Human-readable insight text
- `widget_type`: Type of visualization ("summary_card" | "grid" | "chart")
- `chart_type`: Chart subtype (only included if widget_type is "chart")
- `session_id`: Session identifier
- `context_injected`: Whether conversation history was injected
- `data`: Visualization-specific config (structure varies by widget_type)

---

## Frontend Integration

### Dashboard.tsx Expected Format

#### Summary Card
```typescript
{
  type: 'summaryCard',
  data: [
    {
      title: string,
      value: string | number,
      change?: string,      // Optional
      trend?: 'up' | 'down', // Optional
      icon?: string         // Optional
    }
  ]
}
```

#### Grid
```typescript
{
  type: 'grid',
  data: [
    {
      title: string,
      rows: any[]
    }
  ]
}
```

#### Chart
```typescript
{
  type: 'chart',
  data: any[]  // Highcharts config
}
```

---

## Code Architecture

### Components

#### 1. Models (`app/models/chat.py`)
```python
class TransformedChatResponse(BaseModel):
    insight: str
    widget_type: str
    chart_type: Optional[str] = None
    session_id: str
    context_injected: bool = False
    data: Any
```

#### 2. Transformer Service (`app/services/chat_transformer.py`)
```python
class ChatResponseTransformer:
    @staticmethod
    def transform_response(raw_response, session_id, context_injected):
        # Main transformation logic
        pass
    
    @staticmethod
    def _transform_data(widget_type, chart_type, raw_data, insight):
        # Route to specific transformer based on widget_type
        pass
    
    @staticmethod
    def _transform_summary_card(raw_data, insight):
        # Summary card specific transformation
        pass
```

#### 3. Router (`app/routers/chat.py`)
```python
@router.post("", response_model=TransformedChatResponse)
async def chat(req: ChatRequest) -> TransformedChatResponse:
    # ... existing logic ...
    
    # Transform response
    transformed_response = chat_transformer.transform_response(
        raw_response=response_text,
        session_id=session_id,
        context_injected=injected
    )
    return TransformedChatResponse(**transformed_response)
```

---

## Design Principles

### 1. Separation of Concerns
- **Router**: Handles HTTP, orchestration
- **Transformer**: Handles data transformation logic
- **Models**: Defines data structures

### 2. Extensibility
- Easy to add new widget types
- Each widget type has its own transformation method
- Generic fallback for unknown types

### 3. Error Handling
- JSON parsing errors caught and logged
- Transformation errors return HTTP 500 with details
- Graceful fallback for missing data

### 4. Type Safety
- Pydantic models for validation
- Type hints throughout
- FastAPI auto-validates responses

---

## Value Formatting Logic

### Number Formatting
```python
def _format_value(value: Any) -> str:
    try:
        num_value = float(value)
        if num_value >= 1000:
            return f"${num_value:,.2f}"  # $3,516,979.54
        else:
            return f"${num_value:.2f}"   # $123.45
    except (ValueError, TypeError):
        return str(value)  # Not a number, return as-is
```

**Examples:**
- `3516979.540000001` → `$3,516,979.54`
- `123.45` → `$123.45`
- `"N/A"` → `"N/A"`

### Title Formatting
```python
title = key.replace('_', ' ').title()
```

**Examples:**
- `total_sales` → `Total Sales`
- `profit_margin` → `Profit Margin`
- `active_products` → `Active Products`

---

## Future Enhancements

### 1. Chart Transformation
```python
def _transform_chart(raw_data, chart_type):
    if chart_type == 'line':
        return _transform_line_chart(raw_data)
    elif chart_type == 'pie':
        return _transform_pie_chart(raw_data)
    # ... more chart types
```

### 2. Enhanced Summary Cards
AI could provide optional fields:
```json
{
  "data": [
    {
      "total_sales": "3516979.54",
      "change": "+12%",
      "trend": "up",
      "icon": "DollarSign"
    }
  ]
}
```

### 3. Multi-Widget Responses
AI could return multiple widgets:
```json
{
  "widgets": [
    {"widget_type": "summary_card", "data": [...]},
    {"widget_type": "chart", "data": [...]}
  ]
}
```

---

## Testing

### Manual Test
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "what is the sales for 2003?",
    "session_id": "test-session-123"
  }'
```

### Expected Response
```json
{
  "insight": "Total sales in 2003 was $3,516,979.54",
  "widget_type": "summary_card",
  "session_id": "test-session-123",
  "context_injected": false,
  "data": [
    {
      "title": "Total Sales",
      "value": "$3,516,979.54"
    }
  ]
}
```

---

## Error Scenarios

### 1. Invalid JSON from AI
```python
# Input: "Invalid JSON string"
# Output: HTTP 500
{
  "detail": "Failed to transform response: Invalid JSON response from AI: ..."
}
```

### 2. Missing Fields
```python
# Input: {"widget_type": "summary_card"}  # No data
# Output: Uses fallback extraction from insight
{
  "data": [{"title": "Result", "value": "..."}]
}
```

### 3. Unknown Widget Type
```python
# Input: {"widget_type": "unknown_type", "data": [...]}
# Output: Returns raw data with warning logged
{
  "data": [...]  # Raw data unchanged
}
```

---

## Summary

The transformation layer provides:
- ✅ Clean separation between AI response and frontend format
- ✅ Type-safe data structures
- ✅ Extensible architecture for new widget types
- ✅ Robust error handling
- ✅ Consistent value formatting
- ✅ Frontend-ready visualization configs

This design ensures the frontend receives predictable, well-structured data regardless of AI response variations.
