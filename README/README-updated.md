# AI Agent Workflow Platform - Quick Start Guide

This project is a powerful node-based workflow system for building, visualizing, and executing AI agent workflows. It features a folder-based node architecture, standardized interfaces, and a modern UI design inspired by simple-ai.dev.

## Key Features

- **Folder-based Node Architecture**: Each node is a self-contained module with definition, execution logic, and UI
- **Enhanced Node Pattern**: Standardized UI with settings drawer and hover menu functionality
- **Consistent User Experience**: All nodes follow the same visual design patterns
- **Type Safety**: Strong TypeScript typing throughout the system
- **Replit Database Integration**: Persistent storage using Replit's Key-Value Database

## Getting Started

### Project Structure

```
client/src/nodes/          # Node implementation folders
  ├── System/              # System nodes (core functionality)
  ├── Custom/              # Domain-specific custom nodes
  └── Default/             # Default node implementation pattern

client/src/components/     # Shared UI components
  └── nodes/common/        # Common node UI components
    ├── NodeContainer.tsx  # Base container for all nodes
    ├── NodeHoverMenu.tsx  # Hover menu with node actions
    └── NodeSettingsForm.tsx # Dynamic settings form

client/src/lib/            # Core system libraries
  ├── nodeSystem.ts        # Node registration and discovery
  ├── nodeExecution.ts     # Node execution utilities
  └── enhancedWorkflowEngine.ts # Workflow execution
```

### Node Structure

Each node consists of three primary files:

1. **Definition (`definition.ts`)**: Metadata, input/output ports, and configuration
2. **Execution Logic (`executor.ts`)**: Processing functionality
3. **UI Representation (`ui.tsx`)**: Visual appearance in the editor

### Creating a New Node

To add a new node type:

1. Create a folder in `client/src/nodes/Custom/` with your node name
2. Implement the required files (definition.ts, executor.ts, ui.tsx)
3. Use the DefaultNode pattern for UI implementation
4. Test node functionality in the workflow editor

Example Node UI (using the DefaultNode pattern):

```tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import DefaultNode from '@/nodes/Default/ui';
import { FileText } from 'lucide-react';

// UI component that uses the enhanced DefaultNode
export const component = ({ data, id, selected, isConnectable }) => {
  // Settings schema for the settings drawer
  const nodeSettings = {
    title: "Text Input Settings",
    fields: [
      {
        key: "placeholder",
        label: "Placeholder Text",
        type: "text",
        description: "Text shown when input is empty"
      },
      {
        key: "required",
        label: "Required Field",
        type: "checkbox",
        description: "Whether input is required"
      }
    ]
  };
  
  // Enhance the node data with settings
  const enhancedData = {
    ...data,
    settings: nodeSettings,
    icon: <FileText size={16} />
  };
  
  // Custom node content
  const nodeContent = (
    <>
      {/* Custom UI elements here */}
      
      {/* Standard handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
      />
    </>
  );
  
  // Return enhanced node with our content
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
```

## Documentation Resources

For detailed documentation, see:
- [Technical Reference](./TECHNICAL_REFERENCE.md) - Key files, functions, and patterns
- [Architecture Documentation](./ARCHITECTURE.md) - System architecture details
- [Development Guide](./DEVELOPMENT.md) - Step-by-step developer guidance
- [Complete Documentation](./README-CONSOLIDATED.md) - Comprehensive project documentation