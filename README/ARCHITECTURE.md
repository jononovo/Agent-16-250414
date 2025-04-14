# Node System Architecture

This document provides a comprehensive technical overview of the folder-based node system architecture.

## Directory Structure

```
client/src/
├── nodes/                        # Root folder for all node implementations
│   ├── types.ts                  # Shared type definitions for all nodes
│   └── node_type/                # Folder for a specific node type (e.g., text_input)
│       ├── definition.ts         # Node metadata and interface definitions
│       ├── executor.ts           # Node execution logic
│       └── ui.tsx                # React component for node UI
│
├── lib/                          # Supporting libraries for the node system
│   ├── nodeSystem.ts             # Node registration and dynamic import system
│   ├── nodeValidation.ts         # Validation utilities for node definitions
│   └── validateAllNodes.ts       # System-wide node validation
│
└── components/
    └── nodes/                    # Shared UI components for node rendering
        ├── common/               # Basic building blocks
        ├── handles/              # Connection points components
        └── controls/             # Input controls and interactive elements
```

## System Components

### 1. Node Definition

The `definition.ts` file defines the core metadata and interface for a node:

```typescript
// definition.ts
import { NodeDefinition } from '../types';

const definition: NodeDefinition = {
  type: 'text_input',            // Unique identifier for the node type
  name: 'Text Input',            // Display name
  description: 'Provides text input for workflows',
  category: 'input',             // Functional category
  version: '1.0.0',              // Semantic versioning
  icon: 'text',                  // Icon identifier
  
  // Input ports and their data types
  inputs: {
    default: {
      type: 'string',
      description: 'Default value for the input'
    }
  },
  
  // Output ports and their data types
  outputs: {
    text: {
      type: 'string',
      description: 'The text input value'
    }
  },
  
  // Default data for initialization
  defaultData: {
    text: '',
    placeholder: 'Enter text...'
  }
};

export default definition;
```

### 2. Node Executor

The `executor.ts` file implements the execution logic for the node:

```typescript
// executor.ts
import { NodeExecutorFunction } from '../../lib/types';

export const execute: NodeExecutorFunction = async (nodeData, inputs) => {
  // Implementation of the node's execution logic
  const result = nodeData.text || inputs.default || '';
  return result;
};
```

### 3. Node UI Component

The `ui.tsx` file defines the React component for rendering the node in the workflow editor.

### 4. Node Registration System

The node system uses dynamic imports to discover and register node components:

```typescript
// nodeSystem.ts
export function registerNodeExecutorsFromRegistry(): void {
  // List of known node types
  const FOLDER_BASED_NODE_TYPES = [
    'text_input',
    'claude',
    'http_request',
    // etc.
  ];
  
  // Register each node by dynamically importing it
  FOLDER_BASED_NODE_TYPES.forEach(nodeType => {
    import(/* @vite-ignore */ `../nodes/${nodeType}/executor`).then(executor => {
      import(/* @vite-ignore */ `../nodes/${nodeType}/definition`).then(definition => {
        // Register with workflow engine
        registerEnhancedNodeExecutor(nodeType, createEnhancedNodeExecutor(...));
      });
    });
  });
}
```

### 5. Node Validation System

The validation system ensures all nodes meet the required standards:

```typescript
// validateAllNodes.ts
export function validateAllNodes(verbose = true): boolean {
  // Import all node definitions
  const nodeModules = import.meta.glob('../nodes/*/definition.ts', { eager: true });
  
  // Extract node definitions from modules
  const nodeDefinitions = {};
  for (const path in nodeModules) {
    const module = nodeModules[path] as any;
    const nodeDef = module.default;
    if (nodeDef) {
      nodeDefinitions[nodeDef.type] = nodeDef;
    }
  }
  
  // Validate all node definitions
  const results = validateNodes(nodeDefinitions);
  
  // Log results if verbose mode is enabled
  if (verbose) {
    logValidationResults(results);
  }
  
  // Return whether all nodes are valid
  return !Object.values(results).some(result => !result.valid);
}
```

## Workflow Engine Operation

The workflow engine (`enhancedWorkflowEngine.ts`) processes nodes in topological order:

1. Data flows between nodes through defined connections
2. Each node has inputs, processing logic, and outputs
3. Nodes are executed asynchronously based on their dependencies

## Data Flow

1. User sends prompt to an agent through chat UI
2. Prompt passes through API endpoint
3. Workflow engine processes the prompt through the agent's workflow
4. Nodes in the workflow execute in sequence based on connections
5. Results return to the user through the chat interface

## Type System

The node system uses TypeScript interfaces to ensure consistent implementation:

```typescript
// Core interfaces for node definitions
export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  version: string;
  icon?: string;
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
  defaultData: Record<string, any>;
}

export interface PortDefinition {
  type: string;
  description: string;
  optional?: boolean;
}
```

## Standard Node Categories

Nodes are organized into categories for easier discovery:

- **Input**: Nodes that collect data from users or external sources
- **Output**: Nodes that display or send data
- **Processing**: Nodes that transform or analyze data
- **AI**: Nodes that utilize AI models
- **Integration**: Nodes that connect to external systems
- **Logic**: Nodes that implement decision logic
- **Utility**: General-purpose utility nodes

## Performance Considerations

- **Dynamic Imports**: Nodes are loaded only when needed
- **Validation**: Early validation prevents runtime errors
- **Caching**: Results can be cached for improved performance
- **Error Isolation**: Issues in one node don't break others

## Migration from Legacy System

The folder-based node system replaces the previous centralized registry approach:

**Before (Centralized Registry)**
- All nodes registered in a single registry file
- Node definitions spread across multiple files
- Manual registration required for each new node

**After (Folder-Based Architecture)**
- Each node in its own folder with standard files
- Clear separation of concerns
- Automatic node discovery and registration

## Current Status and Future Development

The migration to the folder-based architecture is complete, with all nodes now following the new pattern. Future enhancements will focus on:

1. Enhanced validation capabilities
2. More specialized node types
3. Improved UI components for node configuration
4. Performance optimizations for complex workflows