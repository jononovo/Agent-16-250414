# Enhanced Node Pattern

This document outlines the enhanced node pattern for building consistent, feature-rich nodes in the workflow system.

## Node Architecture

All nodes should follow the enhanced node pattern which provides:
- Settings drawer/sheet functionality
- Context menu for node operations
- Consistent styling and layout
- Status indicators for execution state

## How to Use the Enhanced Default Node

The preferred approach is to use the `EnhancedDefaultNode` component from `client/src/nodes/Default/ui.tsx`:

```tsx
import EnhancedDefaultNode from '@/nodes/Default/ui';
import { Handle, Position } from 'reactflow';

// Your node component
const YourNodeComponent = ({ data, id, selected, isConnectable }) => {
  // Create your node settings schema
  const nodeSettings = {
    title: "Your Node Settings",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "text",
        description: "Enter your API key"
      },
      {
        key: "model",
        label: "Model",
        type: "select",
        options: [
          { label: "Model A", value: "model-a" },
          { label: "Model B", value: "model-b" }
        ]
      }
    ]
  };

  // Prepare enhanced data with settings
  const enhancedData = {
    ...data,
    settings: nodeSettings,
    // Include any callback handlers for changes
    onChange: (updatedData) => {
      // Handle data changes (usually saved to node state)
      console.log('Node data updated:', updatedData);
    }
  };

  // Return the enhanced node
  return (
    <EnhancedDefaultNode
      id={id}
      data={enhancedData}
      selected={selected}
    >
      {/* Your custom node content goes here */}
      <div className="py-2">
        <p className="text-sm">Your custom node content</p>
      </div>
      
      {/* Your node's handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
      />
    </EnhancedDefaultNode>
  );
};

export default YourNodeComponent;
```

## Settings Schema Structure

The settings schema should follow this structure:

```javascript
{
  title: "Node Settings Title",
  fields: [
    {
      key: "uniqueKey",          // Used as the property name in data
      label: "Display Label",    // Shown to users
      type: "text",              // One of: text, number, select, checkbox, textarea, slider
      description: "Help text",  // Optional description
      // For select fields:
      options: [
        { label: "Option 1", value: "value1" },
        { label: "Option 2", value: "value2" }
      ],
      // For number/slider fields:
      min: 0,
      max: 100,
      step: 1
    }
  ]
}
```

## Legacy Components

The following components are being deprecated in favor of `EnhancedDefaultNode`:

- `EnhancedBaseNode` - Base implementation with settings drawer
- `EnhancedNode` - ReactFlow wrapper for EnhancedBaseNode

These components will continue to work during the transition period but are not recommended for new node development.

## Best Practices

1. **Data Persistence**: Always include an `onChange` handler to propagate setting changes
2. **Node State**: Use local state within your node to handle temporary UI state
3. **Consistent Handles**: Position handles consistently across similar node types
4. **Icon Selection**: Use appropriate icons from Lucide React for your node type
5. **Error Handling**: Utilize the `hasError` and `errorMessage` properties for error states

## Node Directory Structure

Organize your node files consistently following this pattern:

```
nodes/
  └── [node_type]/
      ├── definition.ts     # Node type definition and metadata
      ├── executor.ts       # Node execution logic
      ├── schema.ts         # Data validation schema
      ├── ui.tsx            # UI implementation using EnhancedDefaultNode
      └── index.ts          # Exports for registration
```