# Floating AI Copilot Implementation

## Overview
The AI Copilot is now accessible via a floating button that appears on all screens except the AI Copilot page itself and Data Management screens.

## Features

### 1. Floating Button
- **Location**: Fixed position at bottom-right corner of the screen
- **Design**: Gradient purple button with sparkle icon and pulse indicator
- **Animation**: Smooth scale-in/out transitions
- **Visibility**: Appears on all screens EXCEPT:
  - AI Copilot page (`copilot`)
  - Data Upload - Managed (`data-upload-managed`)
  - Data Upload - Federated (`data-upload-federated`)
  - Data Quality (`data-quality`)

### 2. Split View Panel
When the floating button is clicked:
- AI Copilot panel slides in from the right
- Main content shrinks to 50% width
- Smooth 300ms transition animation

### 3. Panel Controls
- **Full Width Toggle**: Maximize/minimize button to expand copilot to full screen
- **Close Button**: X button to close the panel and return to full view
- **Header**: Shows AI Copilot branding with bot icon

### 4. Global State Management
- Copilot state managed at App.tsx level
- Works across all pages consistently
- State persists during navigation (until manually closed)

## Implementation Details

### Modified Files

#### 1. `App.tsx`
- Added copilot state management (`isCopilotOpen`, `isFullWidth`)
- Implemented split-view layout wrapper
- Added floating copilot panel with header and controls
- Passes `onOpenCopilot` callback to Layout

#### 2. `Layout.tsx`
- Added `onOpenCopilot` prop
- Implemented conditional floating button rendering
- Button excluded from copilot and data management screens
- Added Framer Motion animations

#### 3. `Dashboard.tsx`
- Removed local copilot integration
- Simplified to standard dashboard view
- Removed "Ask Copilot" button (now uses global floating button)

## Usage

### For Users
1. Navigate to any screen (Dashboard, Forecast, Pricing, etc.)
2. Click the "Ask AI Copilot" floating button in the bottom-right
3. Copilot panel opens in split view
4. Use maximize button for full-width view
5. Click X to close and return to full screen

### For Developers
To exclude the floating button from additional screens, update the condition in `Layout.tsx`:

```typescript
const shouldShowFloatingButton = !['copilot', 'data-upload-managed', 'data-upload-federated', 'data-quality', 'your-new-screen-id'].includes(activeTab);
```

## Design Specifications

### Floating Button
- **Size**: Auto-width with padding
- **Colors**: Gradient from indigo-600 to purple-600
- **Shadow**: Large shadow with indigo tint on hover
- **Icon**: Sparkles icon with rotation on hover
- **Indicator**: Green pulse dot (top-right)
- **Z-index**: 50 (ensures it's above other content)

### Split View
- **Default Split**: 50/50
- **Full Width**: 100% copilot, 0% main content
- **Transition**: 300ms ease
- **Border**: Left border on copilot panel

## Future Enhancements
- Remember copilot state across sessions (localStorage)
- Keyboard shortcut to open/close (e.g., Ctrl+K)
- Draggable panel width
- Minimize to bottom-right corner instead of closing
- Context-aware initial messages based on current screen
