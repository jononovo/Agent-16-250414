# Node-Based Workflow System

This project implements a flexible, extensible node-based workflow system for creating, visualizing, and executing workflows. The system uses a folder-based architecture for implementing nodes, making it easy to add new node types.

## Architecture

### Node Structure

Each node is a self-contained module with three primary components:

1. **Definition (`definition.ts`)**: Declares the node's metadata, input/output ports, and configuration options.
2. **Execution Logic (`executor.ts`)**: Implements the node's functionality when executed within a workflow.
3. **UI Representation (`ui.tsx`)**: Renders the node in the workflow editor canvas.

All nodes are organized in one of two main folders:
- `/client/src/nodes/System/` - For core system nodes
- `/client/src/nodes/Custom/` - For custom, domain-specific nodes

### Node UI Guidelines

All nodes must follow the Simple AI Dev inspired UI design to maintain consistency across the workflow editor:

#### Visual Elements

1. **Node Container**:
   - Rounded corners with a consistent padding
   - Should show a subtle shadow and border
   - Selected state should be visually distinct (background change)

2. **Node Header**:
   - Icon representing node function in the primary color
   - Node name in a medium font weight
   - Optional badges for status information

3. **Handle Styling**:
   - Input handles on the left side with consistent positioning
   - Output handles on the right side with consistent positioning
   - Color-coded by data type
   - Consistent height and width

#### Layout & Interaction

1. **Content Areas**:
   - Use tabs for different sections (Editor, Preview, Options, etc.)
   - Form controls should have consistent sizing and spacing
   - Switches should use `className="scale-75"` rather than the deprecated `size` prop

2. **Interactive Elements**:
   - Form inputs should have labels
   - Toggles and switches should have clear descriptions
   - Consistent feedback for validation errors

## Node Implementation Example

Here's an example of how to implement a node following these conventions:

### UI Component Example (ui.tsx)

```tsx
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YourIcon } from 'lucide-react';

// Default data for the node
export const defaultData = {
  // Node-specific default properties
};

// React component for the node
export const component = ({ data, isConnectable, selected }: any) => {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Local state
  const [localState, setLocalState] = useState(nodeData.someProperty);
  
  return (
    <div className={`p-3 rounded-md ${selected ? 'bg-muted/80 shadow-md' : 'bg-background/80'} border shadow-sm transition-all duration-200 min-w-[280px]`}>
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <div className="p-1 rounded bg-primary/10 text-primary">
          <YourIcon size={16} />
        </div>
        <div className="font-medium text-sm">{nodeData.label || 'Node Name'}</div>
      </div>
      
      {/* Node Content */}
      <div className="flex flex-col gap-3">
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-2">
            <TabsTrigger value="editor" className="text-xs">Editor</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
            <TabsTrigger value="options" className="text-xs">Options</TabsTrigger>
          </TabsList>
          
          {/* Tab Contents */}
          <TabsContent value="options">
            <div className="flex items-center justify-between">
              <Label htmlFor="some-option" className="text-xs cursor-pointer">
                Option Name
              </Label>
              <Switch
                id="some-option"
                checked={localState}
                onCheckedChange={setLocalState}
                className="scale-75"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input1"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-blue-500 -ml-0.5 top-1/3"
      />
      
      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="output1"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-green-500 -mr-0.5 top-1/3"
      />
    </div>
  );
};

export default component;
```

## Node Output Format

All node executors must follow the standardized output format to ensure compatibility across the workflow system:

```typescript
interface NodeExecutionData {
  items: WorkflowItem[];  // Output data items
  meta: {
    startTime: Date;           // When execution started
    endTime: Date;             // When execution completed
    source?: string;           // Source node identifier
    error?: boolean;           // Whether execution resulted in an error
    errorMessage?: string;     // Error message if error is true
    warning?: string;          // Non-critical warning message
    [key: string]: any;        // Additional metadata properties
  };
}
```

Use the `createNodeOutput` and `createErrorOutput` utility functions from `client/src/nodes/lib/nodeOutputUtils.ts` to ensure consistent output formatting.

## Adding New Nodes

To add a new node:

1. Create a new folder with the node name in either `System` or `Custom` directory
2. Implement the three required files:
   - `definition.ts` - Node metadata and interface
   - `executor.ts` - Execution logic  
   - `ui.tsx` - Visual representation
3. Follow the styling guidelines to ensure UI consistency
4. Test the node for proper execution and output format conformance

## Testing Node Implementations

Before deploying new nodes, validate that:

1. The node UI follows the styling conventions
2. The executor produces properly formatted output
3. All inputs and outputs are properly typed
4. The node correctly handles error cases
5. The node works well with other nodes in workflows