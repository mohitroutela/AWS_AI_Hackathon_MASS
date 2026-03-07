# Pin Widget Feature

## Overview
Individual widgets generated in the AI Copilot can be pinned to the currently open page (Dashboard or any other navigation page). Each widget type (summary card group, individual chart, individual grid) has its own pin icon.

## Implementation Details

### 1. Pin Button Location
Each widget type has a pin button in a specific location:

- **Summary Cards**: Pin button appears at the top-right of the entire summary card group (pins all cards together)
- **Charts**: Each individual chart has its own pin button in the top-right corner
- **Grids**: Each individual grid/table has its own pin button in the top-right corner

All pin buttons:
- Only appear on hover (using group-hover)
- Are hidden when viewing the AI Copilot page itself
- Have smooth opacity transitions

### 2. User Flow
1. User opens AI Copilot from any page (Dashboard, Demand Forecast, etc.)
2. User asks a question and receives visualizations
3. User hovers over any widget to reveal its pin icon
4. User clicks the pin icon for the specific widget they want
5. An API call is made to pin that specific widget to the current page
6. A success toast notification appears confirming the widget was pinned

### 3. Widget Granularity

**Summary Cards:**
- Pinned as a group (all cards in the summaryCard visualization)
- One pin button for the entire group
- Maintains the grid layout when pinned

**Charts:**
- Each chart is pinned individually
- If a response contains multiple charts, each has its own pin button
- Allows users to select only the charts they need

**Grids:**
- Each grid/table is pinned individually
- If a response contains multiple grids (e.g., High Priority, Medium Priority, Low Priority), each has its own pin button
- Allows users to select specific data tables

### 3. API Integration

#### API Function: `pinWidgetToPage()`
Located in: `src/app/services/api.service.ts`

```typescript
export async function pinWidgetToPage(
  widget: any,
  targetPage: string
): Promise<{ success: boolean; message: string }>
```

**Parameters:**
- `widget`: The complete widget object (type, data, title)
- `targetPage`: The page identifier (dashboard, forecast, pricing, inventory, market, reports)

**Response:**
```json
{
  "success": true,
  "message": "Widget pinned to Dashboard successfully"
}
```

**TODO:** Replace the mock implementation with actual API endpoint:
```typescript
return fetchFromAPI('/pin-widget', {
  method: 'POST',
  body: JSON.stringify({ widget, targetPage })
});
```

### 4. Current Page Context
- The `AICopilot` component receives `currentPage` prop from `App.tsx`
- This prop contains the active tab/page identifier
- Used to determine which page to pin the widget to
- Used to hide pin button when on the copilot page itself

### 5. Toast Notifications
- Uses `sonner` library for toast notifications
- Success toast: "Widget pinned to [Page Name]"
- Error toast: "Failed to pin widget"
- Toast duration: 3 seconds

### 6. Widget Types Supported
All three widget types can be pinned individually:

**Summary Cards (Group Pin):**
- Pins all KPI cards in the group together
- Maintains 3-column grid layout
- One pin action for the entire summary card visualization

**Charts (Individual Pin):**
- Each chart (line, bar, pie, column, area) can be pinned separately
- Highcharts configuration is preserved
- Multiple charts in one response = multiple pin buttons

**Grids (Individual Pin):**
- Each data table can be pinned separately
- Table structure and styling preserved
- Multiple grids in one response = multiple pin buttons

### 7. Visual Design
- Pin icon: Lucide React `Pin` icon
- Button styling: White background with border, hover effect changes to indigo
- Opacity: 0 by default, 100 on group hover
- Position: 
  - Summary Cards: Absolute top-right of the group container
  - Charts: Absolute top-right corner inside chart container
  - Grids: Absolute top-right of the grid container
- Z-index: 10 to stay above content

## Files Modified

1. **src/app/components/AICopilot.tsx**
   - Added `Pin` icon import
   - Added `currentPage` prop
   - Added `handlePinWidget()` function
   - Added pin button to widget rendering

2. **src/app/App.tsx**
   - Pass `currentPage={activeTab}` to AICopilot component

3. **src/app/services/api.service.ts**
   - Added `pinWidgetToPage()` function

4. **src/main.tsx**
   - Added `Toaster` component for notifications

## Page Name Mapping
```typescript
const pageNames: Record<string, string> = {
  'dashboard': 'Dashboard',
  'forecast': 'Demand Forecast',
  'pricing': 'Pricing Intelligence',
  'inventory': 'Inventory Risk',
  'market': 'Market Trends',
  'reports': 'Customer Insights'
};
```

## Future Enhancements
1. Add ability to unpin widgets from pages
2. Show pinned widgets indicator on the page
3. Allow widget repositioning after pinning (drag & drop)
4. Add widget customization options before pinning (resize, edit title)
5. Implement widget persistence across sessions
6. Add bulk pin/unpin functionality
7. Allow pinning individual summary cards (not just the group)
8. Add widget preview before pinning
9. Support pinning to multiple pages simultaneously
10. Add widget version history and updates
