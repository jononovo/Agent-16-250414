# Workflow Node Styling Guide

This guide defines the styling principles and visual specifications for workflow nodes in the system. Following these guidelines ensures consistency in node appearance and behavior.

## General Node Structure

Each node follows a common structure with these elements:

1. **Container** - The main node container with border, background, and shadow
2. **Header** - Contains the node title and optional status badge
3. **Body** - Contains the node's configuration controls or content
4. **Handles** - Connection points for edges (inputs on left, outputs on right)
5. **Expanded Panel** - Additional details and configuration shown when focused

## Color System

Nodes use a consistent color system aligned with the application's theme:

- **Primary Color** - Used for handles, icons, and selection highlights
- **Background** - Node background (supports dark/light modes)
- **Border** - Container border (enhanced when selected)
- **Text Colors** - Following the theme's text color palette
- **Status Colors**:
  - Idle: Gray (#94a3b8)
  - Running: Blue (#3b82f6)
  - Complete: Green (#22c55e)
  - Error: Red (#ef4444)

## Node Type Visual Indicators

Each node category has visual indicators to distinguish its function:

- **AI Nodes** - Purple accents and AI-related icons
- **Data Nodes** - Teal accents with data visualization icons
- **Trigger Nodes** - Orange accents with event-related icons
- **Action Nodes** - Blue accents with action-related icons

## Selection State

Nodes have distinct styling when selected:

```css
.selected-node {
  border-color: theme('colors.primary.DEFAULT');
  box-shadow: 0 0 0 2px rgba(var(--primary), 0.2);
}
```

## Interactive Elements

Nodes contain various interactive elements:

1. **Collapse/Expand Button** - Toggles between compact and detailed views
2. **Configuration Controls** - Input fields, dropdowns, text areas
3. **Action Buttons** - Execute, copy, add buttons
4. **Handle Points** - Connection points for dragging edges

## Responsive Behavior

Nodes adapt to different states:

1. **Default State** - Compact view showing essential information
2. **Expanded State** - Detailed view with all configuration options
3. **Execution State** - Visual indicators during workflow execution
4. **Error State** - Visual indicators when errors occur

## Accessibility Considerations

- Contrast ratios meet WCAG 2.1 AA standards
- Interactive elements have appropriate focus states
- Status information is conveyed through both color and text
- Dark mode support with adjusted contrast

## CSS Implementation Example

```css
.workflow-node {
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  background-color: var(--background);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
  min-width: 200px;
}

.node-header {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--header-background);
}

.node-body {
  padding: 0.75rem;
}

.node-footer {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-status-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-weight: 500;
}

.node-handle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--primary);
  border: 2px solid var(--background);
  position: absolute;
  z-index: 1;
}

.node-handle-input {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.node-handle-output {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
}
```

## Component Organization

Node styling is implemented through a combination of:

1. **Base styles** - Common to all nodes (defined in CSS/Tailwind)
2. **Node-specific styles** - Variations for each node type
3. **State-based styles** - Variations based on node state
4. **Theme-aware styles** - Adaptations for dark/light mode

This styling guide ensures that all workflow nodes have a consistent, professional appearance while clearly communicating their purpose and state to users.
