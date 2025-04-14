# Node System Architecture

This document describes the new node system architecture implemented in the workflow platform. The architecture is designed to be modular, maintainable, and extensible, making it easy to add new node types and capabilities.

## Overview

The node system is structured around a folder-based architecture where each node type has its own directory containing all necessary files for that node. This approach provides several benefits:

1. **Encapsulation**: Each node is self-contained with all its components in one place
2. **Discoverability**: New nodes can be easily discovered and registered
3. **Maintainability**: Changes to a node only affect files in that node's directory
4. **Standardization**: Common structure across all nodes ensures consistency

## Node Structure

Each node has the following standard files:

```
/nodes/
  └── [node_type]/              
      ├── index.ts              # Main export for the node
      ├── schema.ts             # Node parameters, inputs, and outputs definition
      ├── executor.ts           # Node execution logic
      ├── ui.tsx                # React component for node visualization
      └── metadata.json         # Node metadata (category, description, etc.)
```

### File Responsibilities

- **index.ts**: Exports the node implementation and registers it with the node registry
- **schema.ts**: Defines the inputs, outputs, and parameters for the node
- **executor.ts**: Contains the logic for executing the node
- **ui.tsx**: Provides the React component for rendering the node in the workflow editor
- **metadata.json**: Contains metadata about the node (name, description, category, etc.)

## Node Registry

The node registry (`nodes/registry.ts`) is responsible for managing all registered nodes. It provides functions for:

- Registering nodes
- Retrieving nodes by type
- Getting all nodes in a category
- Getting all available categories
- Getting all registered nodes

## Adding a New Node

To add a new node:

1. Create a new directory under `client/src/nodes/` with the node type name
2. Create the standard files for the node:
   - `index.ts`
   - `schema.ts`
   - `executor.ts`
   - `ui.tsx`
   - `metadata.json`
3. Update `client/src/nodes/registry.ts` to import and register the new node
4. Update `client/src/nodes/index.ts` to export the new node

### Example: Minimal Node Implementation

#### 1. Create the folder structure:

```
mkdir -p client/src/nodes/my_new_node
```

#### 2. Create schema.ts:

```typescript
import { NodeSchema } from '../registry';

const schema: NodeSchema = {
  inputs: {
    // Define node inputs
  },
  outputs: {
    // Define node outputs
  },
  parameters: {
    // Define node parameters
  }
};

export default schema;
```

#### 3. Create executor.ts:

```typescript
export const execute = async (nodeData: any, inputs?: any): Promise<any> => {
  try {
    // Node execution logic here
    return {
      meta: {
        status: 'success',
        message: 'Node executed successfully',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: [
        {
          json: {
            // Output data
          },
          binary: null
        }
      ]
    };
  } catch (error: any) {
    return {
      meta: {
        status: 'error',
        message: error.message || 'Error executing node',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: []
    };
  }
};
```

#### 4. Create ui.tsx:

```typescript
import React from 'react';
import { Handle, Position } from 'reactflow';

export const defaultData = {
  // Default node data
};

export const validator = (data: any) => {
  // Validation logic
  return { valid: true, errors: [] };
};

export const component = ({ data, isConnectable }: any) => {
  return (
    <div className="p-3 rounded-md bg-background border shadow-sm">
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
      />
      
      {/* Node content */}
      <div>
        {/* Node UI components */}
      </div>
      
      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
      />
    </div>
  );
};
```

#### 5. Create metadata.json:

```json
{
  "name": "My New Node",
  "description": "Description of the new node",
  "category": "category_name",
  "version": "1.0.0",
  "tags": ["tag1", "tag2"],
  "color": "#3B82F6"
}
```

#### 6. Create index.ts:

```typescript
import { NodeRegistryEntry } from '../registry';
import metadata from './metadata.json';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { Icon } from 'lucide-react';
import React from 'react';

const MyNewNode: NodeRegistryEntry = {
  type: 'my_new_node',
  metadata,
  schema,
  executor,
  ui: {
    component: ui.component,
    defaultData: ui.defaultData,
    validator: ui.validator
  },
  icon: React.createElement(Icon, { size: 16 })
};

export default MyNewNode;
```

#### 7. Update registry.ts:

```typescript
import MyNewNode from './my_new_node';
// ...

function registerBuiltInNodes() {
  // ...existing nodes
  
  // Register new node
  registerNode('my_new_node', MyNewNode);
}
```

#### 8. Update index.ts:

```typescript
import MyNewNode from './my_new_node';
// ...

export {
  // ...existing exports
  
  // Export new node
  MyNewNode
};
```

## Node Execution

Nodes are executed using the `executeNode` function in `client/src/lib/nodeExecution.ts`. This function:

1. Retrieves the node implementation from the registry
2. Calls the node's `execute` function with the provided data and inputs
3. Returns the execution result or an error

## Testing Nodes

The `test-node-system.ts` file provides a way to test the node system. It demonstrates:

1. Getting all registered nodes
2. Getting nodes by category
3. Getting specific node details
4. Executing nodes

To run the test, call the `testNodeSystem` function.

## Demo Page

The `node-system-demo.tsx` page provides a UI for testing nodes. It allows:

1. Browsing all registered nodes by category
2. Viewing node details
3. Testing node execution with custom inputs

This page can be accessed at `/node-system-demo`.

## Best Practices

1. **Keep Nodes Focused**: Each node should do one thing well
2. **Standard Error Handling**: Always use the standardized error response format
3. **Clear Documentation**: Document inputs, outputs, and parameters clearly
4. **Validation**: Validate inputs and parameters before execution
5. **Testing**: Test nodes with a variety of inputs to ensure they work correctly
6. **UI Feedback**: Provide clear feedback in the UI when errors occur
7. **Reuse Components**: Use common UI components for consistency

## Migration from Old System

When migrating existing nodes from the old system:

1. Create the folder structure for the node
2. Extract the schema, execution logic, and UI from the old implementation
3. Convert to the new format
4. Test thoroughly to ensure compatibility