# AI Agent Workflow Platform

This project implements a flexible, extensible node-based workflow system for creating, visualizing, and executing workflows. The architecture uses a folder-based approach for implementing nodes, making it easy to add new node types.

## Core Architecture Overview

The AI Agent Workflow Platform is built around a modular node-based architecture that enables the composition of complex workflows through simple, reusable components. The architecture follows these core design principles:

1. **Modularity**: Each node is a self-contained unit with well-defined interfaces
2. **Discoverability**: Components are automatically discovered and registered
3. **Type Safety**: Strong typing ensures consistent interfaces and validation
4. **Separation of Concerns**: Clear boundaries between definition, execution, and presentation

### Node Structure

Each node is a self-contained module with three primary components:

1. **Definition (`definition.ts`)**: Declares the node's metadata, input/output ports, and configuration options.
2. **Execution Logic (`executor.ts`)**: Implements the node's functionality when executed within a workflow.
3. **UI Representation (`ui.tsx`)**: Renders the node in the workflow editor canvas.

All nodes are organized in one of three main folders:
- `/client/src/nodes/System/` - For core system nodes
- `/client/src/nodes/Custom/` - For custom, domain-specific nodes
- `/client/src/nodes/Default/` - For default node implementation patterns

### Storage System

The platform uses the Replit Key-Value Database (via @replit/database) for persistent storage of:

- Workflows
- Nodes
- Agents
- Logs

The storage implementation in `server/storage.ts` provides a comprehensive interface for CRUD operations on all data types, with methods for:
- Getting, creating, updating, and deleting workflows
- Managing agents and their relationships to workflows
- Tracking execution logs

## Directory Structure

```
client/src/
├── nodes/                        # Root folder for all node implementations
│   ├── System/                   # Core system nodes
│   │   ├── text_input/           # Example system node
│   │   │   ├── definition.ts     # Node metadata and interface
│   │   │   ├── executor.ts       # Execution logic
│   │   │   └── ui.tsx            # UI representation
│   ├── Custom/                   # Custom nodes
│   └── Default/                  # Default node implementation & enhancement
│       └── ui.tsx                # Default enhanced node component
│
├── lib/                          # Core system libraries
│   ├── nodeSystem.ts             # Node discovery and registration
│   ├── nodeValidator.ts          # Validation utilities
│   ├── nodeExecution.ts          # Node execution utilities
│   ├── nodeOutputUtils.ts        # Output formatting utilities
│   └── enhancedWorkflowEngine.ts # Workflow execution engine
│
├── components/                   # UI components
│   └── nodes/                    # Node-specific UI components
│       └── common/               # Shared node UI components
│           ├── NodeContainer.tsx # Base node container
│           ├── NodeContent.tsx   # Node content area
│           ├── NodeHeader.tsx    # Node header with title and icon
│           ├── NodeHoverMenu.tsx # Hover menu for node actions
│           └── NodeSettingsForm.tsx # Dynamic settings form
```

## Node UI Guidelines

All nodes follow UI design inspired by simple-ai.dev to maintain consistency across the workflow editor:

### Visual Elements

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

### Layout & Interaction

1. **Content Areas**:
   - Use tabs for different sections (Editor, Preview, Options, etc.)
   - Form controls should have consistent sizing and spacing

2. **Interactive Elements**:
   - Node hover menu appears after a short delay (400ms) and provides actions:
     - Duplicate node
     - Delete node
     - Open settings
     - Edit/customize node
   - Settings drawer opens on demand, does not close when editing form fields

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

## Node Implementation Example

### UI Component Example (ui.tsx)

```tsx
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import DefaultNode from '@/nodes/Default/ui';
import { YourIcon } from 'lucide-react';

export const component = ({ data, id, selected, isConnectable }) => {
  // Node settings schema for the settings drawer
  const nodeSettings = {
    title: "Node Settings",
    fields: [
      {
        key: "option1",
        label: "Option 1",
        type: "text",
        description: "Description of option 1"
      },
      {
        key: "option2",
        label: "Option 2",
        type: "checkbox",
        description: "Description of option 2"
      }
    ]
  };
  
  // Enhanced data with settings schema
  const enhancedData = {
    ...data,
    settings: nodeSettings
  };
  
  // Node content (what appears inside the node)
  const nodeContent = (
    <>
      {/* Custom node content here */}
      
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-blue-500 -ml-0.5 top-1/3"
      />
      
      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-green-500 -mr-0.5 top-1/3"
      />
    </>
  );

  // Use the DefaultNode component with our custom content
  return (
    <DefaultNode
      id={id}
      data={enhancedData}
      selected={selected}
    >
      {nodeContent}
    </DefaultNode>
  );
};

export default component;
```

## Testing Node Implementations

Before deploying new nodes, validate that:

1. The node UI follows the styling conventions
2. The executor produces properly formatted output
3. All inputs and outputs are properly typed
4. The node correctly handles error cases
5. The node works well with other nodes in workflows

## Common Troubleshooting

| Issue | Possible Solutions |
|-------|-------------------|
| Node not appearing in editor | Check registration in nodeSystem.ts |
| Inputs not receiving data | Verify input handle IDs match input names |
| Outputs not connecting | Check output handle IDs match output names |
| Execution errors | Add try/catch and verbose logging |
| UI not rendering properly | Check component imports and props |
| Type errors | Ensure type definitions match actual data |