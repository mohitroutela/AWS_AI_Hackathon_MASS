# Pin Widget Examples

## Visual Layout Examples

### Example 1: Summary Cards with Pin Button

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Key Metrics                                    [📌 Pin]  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Items to │  │  Total   │  │ Avg Days │                  │
│  │ Restock  │  │  Value   │  │   to     │                  │
│  │    12    │  │ $45,230  │  │ Stockout │                  │
│  │  ↑ +3    │  │  ↑ +12%  │  │    4     │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```
**Note:** One pin button pins all 3 cards together as a group.

---

### Example 2: Multiple Charts with Individual Pin Buttons

```
┌─────────────────────────────────────────────────────────────┐
│ Inventory Levels by Category                     [📌 Pin]  │
│                                                              │
│  [Column Chart Visualization]                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Sales Velocity - Last 7 Days                     [📌 Pin]  │
│                                                              │
│  [Line Chart Visualization]                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
**Note:** Each chart has its own pin button. User can pin one or both.

---

### Example 3: Multiple Grids with Individual Pin Buttons

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 High Priority Items                            [📌 Pin]  │
├─────────────────────────────────────────────────────────────┤
│ Product              │ Current │ Reorder │ Days │ Priority │
│                      │  Stock  │  Point  │      │          │
├──────────────────────┼─────────┼─────────┼──────┼──────────┤
│ Wireless Earbuds Pro │    8    │   25    │  2   │  🔴 High │
│ Smart Watch Series 5 │   12    │   30    │  3   │  🔴 High │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📦 Medium Priority Items                          [📌 Pin]  │
├─────────────────────────────────────────────────────────────┤
│ Product              │ Current │ Reorder │ Days │ Priority │
│                      │  Stock  │  Point  │      │          │
├──────────────────────┼─────────┼─────────┼──────┼──────────┤
│ USB-C Cable 6ft      │   45    │  100    │  5   │  🟡 Med  │
│ Phone Case - Clear   │   23    │   50    │  4   │  🟡 Med  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📦 Low Priority Items                             [📌 Pin]  │
├─────────────────────────────────────────────────────────────┤
│ Product              │ Current │ Reorder │ Days │ Priority │
│                      │  Stock  │  Point  │      │          │
├──────────────────────┼─────────┼─────────┼──────┼──────────┤
│ Screen Protector     │   67    │   80    │  7   │  🟢 Low  │
│ Laptop Stand         │   34    │   40    │  8   │  🟢 Low  │
└─────────────────────────────────────────────────────────────┘
```
**Note:** Each grid has its own pin button. User can pin only "High Priority" if needed.

---

## Interaction Flow

### Step 1: Hover to Reveal Pin Button
```
User hovers over widget → Pin button fades in (opacity 0 → 100)
```

### Step 2: Click Pin Button
```
User clicks pin → API call initiated → Loading state (optional)
```

### Step 3: Success Notification
```
Toast appears: "Widget pinned to Dashboard ✓"
Duration: 3 seconds
```

### Step 4: Widget Added to Page
```
Widget appears on the target page (Dashboard, Forecast, etc.)
User can navigate to that page to see the pinned widget
```

---

## API Payload Examples

### Pinning Summary Cards
```json
{
  "widget": {
    "type": "summaryCard",
    "title": "Key Metrics",
    "data": [
      { "title": "Items to Restock", "value": 12, "trend": "up", "change": "+3 from last week" },
      { "title": "Total Value", "value": "$45,230", "trend": "up", "change": "+12%" },
      { "title": "Avg Days to Stockout", "value": 4, "trend": "down", "change": "Critical" }
    ]
  },
  "targetPage": "dashboard"
}
```

### Pinning Individual Chart
```json
{
  "widget": {
    "type": "chart",
    "data": [
      {
        "chart": { "type": "column" },
        "title": { "text": "Inventory Levels by Category" },
        "xAxis": { "categories": ["Electronics", "Clothing", "Home & Garden"] },
        "series": [
          { "name": "Current Stock", "data": [45, 23, 67] },
          { "name": "Reorder Point", "data": [60, 40, 80] }
        ]
      }
    ]
  },
  "targetPage": "inventory"
}
```

### Pinning Individual Grid
```json
{
  "widget": {
    "type": "grid",
    "data": [
      {
        "title": "High Priority Items",
        "rows": [
          { "product": "Wireless Earbuds Pro", "currentStock": 8, "reorderPoint": 25, "daysToStockout": 2, "priority": "High" },
          { "product": "Smart Watch Series 5", "currentStock": 12, "reorderPoint": 30, "daysToStockout": 3, "priority": "High" }
        ]
      }
    ]
  },
  "targetPage": "inventory"
}
```

---

## User Benefits

1. **Selective Pinning**: Users can choose exactly which widgets they need
2. **Flexible Dashboard**: Build custom dashboards with only relevant data
3. **Quick Access**: Pin frequently used charts/grids for easy access
4. **Context Preservation**: Widgets maintain their formatting and data when pinned
5. **Multi-Page Support**: Pin different widgets to different pages based on context
