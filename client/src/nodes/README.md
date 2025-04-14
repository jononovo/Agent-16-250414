# Folder-Based Node System

This directory contains all the node implementations for the workflow system using a folder-based architecture.

## Architecture Overview

Each node is implemented as a self-contained folder with the following structure:

```
nodes/
  └── node_type/               # e.g., text_input, http_request, etc.
      ├── index.ts             # Main entry point that exports the node
      ├── definition.ts        # Node metadata and interface definitions
      ├── schema.ts            # Node input/output schema
      ├── executor.ts          # Implementation of node execution logic
      ├── ui.tsx               # React component for node UI
      └── README.md            # (Optional) Documentation for the node
```

## Node Implementation Guidelines

### 1. Index File

The index.ts file serves as the main entry point for the node and should export the node definition:

```typescript
import { NodeRegistryEntry } from '../../lib/types';
import definition from './definition';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';

// Define metadata that complies with NodeMetadata interface
const metadata = {
  name: definition.name,
  description: definition.description,
  category: definition.category,
  version: definition.version
};

// Node Implementation
const MyNode: NodeRegistryEntry = {
  type: 'my_node_type',
  metadata,
  schema,
  executor: {
    execute: executor.execute,
    defaultData: ui.defaultData
  },
  ui: ui.component,
  validator: ui.validator,
  icon: // icon component
};

export default MyNode;
```

### 2. Definition File

The definition.ts file contains the node's metadata and interface definitions:

```typescript
export const definition = {
  type: 'my_node_type',
  name: 'My Node',
  description: 'Description of what the node does',
  icon: 'icon-name',
  category: 'category-name',
  version: '1.0.0',
  inputs: {
    // Input port definitions
  },
  outputs: {
    // Output port definitions
  },
  configOptions: [
    // Configuration options
  ]
};

export default definition;
```

### 3. Schema File

The schema.ts file defines the input/output schema for the node:

```typescript
import { NodeSchema } from '../../lib/types';

const schema: NodeSchema = {
  inputs: {
    myInput: {
      type: 'string',
      description: 'Description of the input',
      required: true
    }
  },
  outputs: {
    myOutput: {
      type: 'string',
      description: 'Description of the output'
    }
  }
};

export default schema;
```

### 4. Executor File

The executor.ts file contains the logic for executing the node:

```typescript
import { NodeExecutorFunction } from '../../lib/types';

export interface MyNodeData {
  // Node data structure
}

export const defaultData: MyNodeData = {
  // Default node data
};

export const execute: NodeExecutorFunction<MyNodeData> = async (data, inputs) => {
  // Node execution logic
  return {
    myOutput: 'processed result'
  };
};
```

### 5. UI File

The ui.tsx file contains the React component for the node's UI:

```typescript
import React from 'react';
import { NodeUIComponentProps } from '../../lib/types';
import { MyNodeData } from './executor';

export const defaultData: MyNodeData = {
  // Default data for the node
};

export const component: React.FC<NodeUIComponentProps<MyNodeData>> = ({ data, onChange }) => {
  // UI implementation
  return (
    <div>
      {/* Node UI content */}
    </div>
  );
};

export const validator = (data: MyNodeData) => {
  // Validation logic
  return {
    valid: true,
    errors: []
  };
};
```

## Adding a New Node

To add a new node to the system:

1. Create a new folder with the node's type name
2. Implement the required files as described above
3. The node will be automatically discovered and registered at runtime

No modification of central registry files is required - the system uses dynamic imports to discover and load node implementations.