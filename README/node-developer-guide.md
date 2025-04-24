# Node Developer Guide

## Creating New Workflow Nodes

This guide explains how to create new nodes for the AI Agent Workflow Platform.

### Node Structure

A complete node implementation consists of three files:

1. **definition.ts** - Node metadata and interface specification
2. **ui.tsx** - React component for visual rendering
3. **executor.ts** - Runtime execution logic

### Required Folder Structure

Nodes must be placed in the appropriate directory:

```
client/src/nodes/
├── System/          # Core system nodes
│   └── my_node/
│       ├── definition.ts
│       ├── ui.tsx
│       └── executor.ts
└── Custom/          # User-created nodes
    └── another_node/
        ├── definition.ts
        ├── ui.tsx
        └── executor.ts
```

### Implementation Example

#### 1. definition.ts

```typescript
import { NodeDefinition } from '../../types';
import { FileText } from 'lucide-react';

const definition: NodeDefinition = {
  type: 'my_custom_node', // Unique identifier (used in code)
  name: 'My Custom Node',  // Display name
  description: 'Performs custom data processing',
  category: 'data',  // One of: ai, data, input, actions, triggers, etc.
  icon: FileText,    // Lucide icon component
  version: '1.0.0',
  inputs: {
    input1: {
      type: 'string',
      description: 'Primary input'
    }
  },
  outputs: {
    output1: {
      type: 'string',
      description: 'Processed output'
    }
  },
  defaultData: {
    // Default configuration
    option1: 'default',
    enabled: true
  }
};

export default definition;
```

#### 2. ui.tsx

```typescript
import React from 'react';
import { Handle, Position } from 'reactflow';
import DefaultNode from '@/nodes/Default/ui';

export const component = (props: any) => {
  const { data, id, selected, type } = props;
  
  // Custom UI logic 
  const handleSettingsClick = (e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Show settings dialog
  };
  
  // Use DefaultNode for consistent styling
  return (
    <DefaultNode
      id={id}
      type={type}
      data={{
        ...data,
        onSettingsClick: handleSettingsClick
      }}
      selected={selected}
    />
  );
};

export default component;
```

#### 3. executor.ts

```typescript
import { NodeExecutionData, WorkflowItem } from '@shared/nodeTypes';

export default async function execute(
  items: WorkflowItem[],
  params: Record<string, any>
): Promise<NodeExecutionData> {
  const startTime = new Date();
  
  try {
    // Node execution logic
    const processedItems = items.map(item => ({
      json: {
        // Process item.json data
        result: `Processed: ${item.json.value}`
      },
      text: `Result: ${item.json.value}`
    }));
    
    return {
      items: processedItems,
      meta: {
        startTime,
        endTime: new Date(),
        source: params.nodeId
      }
    };
  } catch (error) {
    return {
      items: [],
      meta: {
        startTime,
        endTime: new Date(),
        error: true,
        errorMessage: error.message,
        source: params.nodeId
      }
    };
  }
}
```

### Node Registration Process

The node registry automatically discovers nodes during the build process. No manual registration is required if:

1. Files are placed in the correct location
2. Each file exports the correct interface
3. The node definition includes all required fields

The `nodeRegistry.ts` scans the filesystem at build time using Vite's `import.meta.glob` functionality.

### Technical Requirements

- **Node Types**: Each node must implement the `NodeDefinition` interface
- **UI Components**: Must export a default React component
- **Executor Functions**: Must export a default async function that returns a `NodeExecutionData` object
- **Icon Usage**: Use Lucide icons or provide a custom SVG component