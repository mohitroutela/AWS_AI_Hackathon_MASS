# Dashboard Drag & Drop Feature

## Overview
Dashboard widgets can now be rearranged via drag-and-drop and removed. Controls appear on hover for a clean interface.

## Features

### 1. Drag to Reorder
- Hover over any widget to reveal the drag handle (grip icon)
- Click and hold the grip icon to drag the widget
- Drop it in a new position to reorder
- Other widgets automatically adjust their positions

### 2. Remove Widget
- Hover over any widget to reveal the remove button (X icon)
- Click the X button to remove the widget from the dashboard
- Widget is immediately removed with no confirmation (can be undone by refreshing)

### 3. Hover-Only Controls
- Drag handle and remove button are hidden by default
- Only appear when hovering over a widget
- Smooth opacity transition (0 to 100)
- Positioned in top-right corner with proper z-index

## Implementation Details

### Components

#### DraggableWidget Component
**Location:** `src/app/components/common/DraggableWidget.tsx`

**Props:**
- `id`: Unique identifier for the widget
- `index`: Current position in the widget array
- `children`: Widget content to render
- `moveWidget`: Callback function to handle reordering
- `onRemove`: Callback function to handle removal
- `className`: Optional additional CSS classes

**Features:**
- Uses `react-dnd` for drag-and-drop functionality
- Implements both drag source and drop target
- Hover detection for smooth reordering
- Visual feedback during drag (opacity change)
- Border color change on hover over drop zone

#### Updated Dashboard Component
**Location:** `src/app/components/Dashboard.tsx`

**Changes:**
1. Wrapped in `DndProvider` with HTML5Backend
2. Converted visualization data to widget items with unique IDs
3. Added `moveWidget` callback for reordering
4. Added `removeWidget` callback for deletion
5. Each widget wrapped in `DraggableWidget` component

### State Management

```typescript
interface WidgetItem {
  id: string;
  type: 'summaryCard' | 'chart' | 'grid';
  data: VisualizationData;
}

const [widgets, setWidgets] = useState<WidgetItem[]>([]);
```

### Drag & Drop Logic

**Move Widget:**
```typescript
const moveWidget = useCallback((dragIndex: number, hoverIndex: number) => {
  setWidgets((prevWidgets) => {
    const newWidgets = [...prevWidgets];
    const draggedWidget = newWidgets[dragIndex];
    newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, draggedWidget);
    return newWidgets;
  });
}, []);
```

**Remove Widget:**
```typescript
const removeWidget = useCallback((id: string) => {
  setWidgets((prevWidgets) => prevWidgets.filter((widget) => widget.id !== id));
}, []);
```

## Visual Design

### Control Buttons
- **Drag Handle**: GripVertical icon (6 dots in 2 columns)
- **Remove Button**: X icon
- **Background**: White with border
- **Hover State**: 
  - Drag handle: Light gray background
  - Remove button: Light red background with red text
- **Position**: Absolute top-right corner
- **Spacing**: 8px gap between buttons

### Widget States
- **Normal**: Controls hidden (opacity: 0)
- **Hover**: Controls visible (opacity: 100)
- **Dragging**: Widget semi-transparent (opacity: 0.5)
- **Drop Target**: Border color changes to indigo

## User Experience

### Reordering Flow
```
1. User hovers over widget
2. Drag handle and remove button fade in
3. User clicks and holds drag handle
4. Widget becomes semi-transparent
5. User drags to new position
6. Drop zones highlight with indigo border
7. User releases mouse
8. Widget snaps to new position
9. Other widgets reflow automatically
```

### Removal Flow
```
1. User hovers over widget
2. Remove button appears
3. User clicks X button
4. Widget is immediately removed
5. Remaining widgets reflow to fill space
```

## Technical Details

### Dependencies
- `react-dnd`: ^16.0.1
- `react-dnd-html5-backend`: ^16.0.1

### Drag & Drop Configuration
```typescript
const WIDGET_TYPE = 'DASHBOARD_WIDGET';

// Drag source
const [{ isDragging }, drag, preview] = useDrag({
  type: WIDGET_TYPE,
  item: { id, index },
  collect: (monitor) => ({
    isDragging: monitor.isDragging(),
  }),
});

// Drop target
const [{ isOver }, drop] = useDrop({
  accept: WIDGET_TYPE,
  hover: (item, monitor) => {
    // Reordering logic with hover detection
  },
  collect: (monitor) => ({
    isOver: monitor.isOver(),
  }),
});
```

### Hover Detection Logic
- Calculates vertical middle of hovered widget
- Only triggers reorder when cursor crosses 50% threshold
- Prevents flickering during drag
- Smooth reordering experience

## Widget Types Supported

All three widget types can be dragged and removed:

1. **Summary Cards**: KPI metrics grid
2. **Charts**: Highcharts visualizations (line, pie, etc.)
3. **Grids**: Data tables (Risk Alerts, Trending Products)

## Limitations & Future Enhancements

### Current Limitations
1. Widget order is not persisted (resets on page refresh)
2. No undo functionality for removed widgets
3. No confirmation dialog before removal
4. Cannot drag widgets between different sections

### Future Enhancements
1. **Persistence**: Save widget order to backend/localStorage
2. **Undo/Redo**: Implement action history
3. **Confirmation**: Add "Are you sure?" dialog for removal
4. **Cross-Section Drag**: Allow dragging between different dashboard sections
5. **Widget Resize**: Add ability to resize widgets
6. **Custom Layouts**: Save multiple dashboard layouts
7. **Widget Library**: Add new widgets from a library
8. **Export Layout**: Export/import dashboard configurations
9. **Responsive Drag**: Better mobile/tablet drag experience
10. **Animation**: Smooth animations during reorder

## API Integration (Future)

### Save Widget Order
```typescript
async function saveWidgetOrder(widgets: WidgetItem[]): Promise<void> {
  await fetch('/api/dashboard/layout', {
    method: 'POST',
    body: JSON.stringify({ widgets })
  });
}
```

### Load Widget Order
```typescript
async function loadWidgetOrder(): Promise<WidgetItem[]> {
  const response = await fetch('/api/dashboard/layout');
  return response.json();
}
```

## Testing Checklist

- [ ] Drag handle appears on hover
- [ ] Remove button appears on hover
- [ ] Controls hide when not hovering
- [ ] Widget can be dragged to new position
- [ ] Other widgets reflow correctly
- [ ] Widget can be removed
- [ ] Removed widget disappears immediately
- [ ] Drag works for all widget types
- [ ] Visual feedback during drag (opacity)
- [ ] Drop zone highlights correctly
- [ ] No flickering during drag
- [ ] Smooth transitions and animations
- [ ] Works with keyboard navigation (accessibility)
