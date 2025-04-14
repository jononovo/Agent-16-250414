# AI Agent Workflow Platform Node System

## Node Architecture Overview

The platform is built on a folder-based node architecture where each node is a modular, self-contained component with standardized interfaces. This document focuses on the technical aspects of the node system to help developers and AI agents understand the internals.

## Technical Node Structure

Each node is defined by three core technical components:

```
client/src/nodes/node_type/
  ├── definition.ts  # Node interface definition & metadata
  ├── executor.ts    # Runtime execution logic
  └── ui.tsx         # React component for visualization
```

### 1. Node Definition (definition.ts)

The definition file contains the formal interface specification for the node:

```typescript
import { NodeDefinition } from '../types';

const definition: NodeDefinition = {
  // Core identity
  type: 'text_input',           // Unique identifier
  name: 'Text Input',           // Display name
  category: 'input',            // Functional category
  version: '1.0.0',             // Semantic versioning
  description: 'Provides text input for workflows',
  
  // Technical interface
  inputs: {                     // Input ports with type definitions
    default: {
      type: 'string',
      description: 'Default value for the input',
      optional: true
    }
  },
  outputs: {                    // Output ports with type definitions
    text: {
      type: 'string',
      description: 'The text input value'
    }
  },
  
  // Default configuration 
  defaultData: {
    text: '',
    placeholder: 'Enter text...'
  }
};

export default definition;
```

### 2. Node Executor (executor.ts)

The executor implements the runtime logic for processing inputs and producing outputs:

```typescript
import { NodeExecutorFunction } from '../../lib/types';

export const execute: NodeExecutorFunction = async (nodeData, inputs) => {
  // Process inputs and node configuration
  const result = nodeData.text || inputs.default || '';
  
  // Return structured outputs
  return result; // or { outputName: result } for multiple outputs
};
```

The executor function is pure and isolated, with inputs coming from:
- `inputs`: Values from connected upstream nodes
- `nodeData`: Configuration values from the node instance

### 3. Node Registration System

Nodes are automatically discovered and registered through dynamic imports in `nodeSystem.ts`:

```typescript
// List of implemented node types
const FOLDER_BASED_NODE_TYPES = [
  'text_input', 'claude', 'http_request', 'text_template',
  'data_transform', 'decision', 'function', 'json_path'
];

// Dynamic registration loop
FOLDER_BASED_NODE_TYPES.forEach(nodeType => {
  import(/* @vite-ignore */ `../nodes/${nodeType}/executor`).then(executor => {
    import(/* @vite-ignore */ `../nodes/${nodeType}/definition`).then(definition => {
      // Register with the workflow engine
      registerEnhancedNodeExecutor(nodeType, /* ... */);
    });
  });
});
```

## Technical Node Interfaces

The node system uses TypeScript interfaces to enforce consistent implementation:

```typescript
// Core interfaces (simplified)
export interface NodeDefinition {
  type: string;                 // Unique type identifier
  name: string;                 // Display name
  description: string;          // Human-readable description
  category: string;             // Functional category
  version: string;              // Semantic version
  inputs: Record<string, PortDefinition>;  // Input ports 
  outputs: Record<string, PortDefinition>; // Output ports
  defaultData: Record<string, any>;        // Default configuration
}

export interface PortDefinition {
  type: string;                 // Data type (string, number, object, etc.)
  description: string;          // Human-readable description
  optional?: boolean;           // Whether the port is required
}

export interface NodeExecutorFunction {
  (nodeData: any, inputs: Record<string, any>): Promise<any>;
}
```

## Node Validation System

The platform includes built-in validation for all nodes at runtime and development time:

```typescript
// Validation workflow in validateAllNodes.ts
export function validateAllNodes(verbose = true): boolean {
  // Find all node definitions
  const nodeModules = import.meta.glob('../nodes/*/definition.ts', { eager: true });
  
  // Extract and validate each definition
  const nodeDefinitions = {};
  for (const path in nodeModules) {
    const module = nodeModules[path] as any;
    const nodeDef = module.default;
    nodeDefinitions[nodeDef.type] = nodeDef;
  }
  
  // Run validation on all nodes
  const results = validateNodes(nodeDefinitions);
  return !Object.values(results).some(result => !result.valid);
}
```

## Node Type Hierarchy

The system includes these core node types, each with specific technical characteristics:

| Node Type | Technical Function | Input/Output Interface |
|-----------|-------------------|------------------------|
| `text_input` | Provides literal text or user input | `outputs: { text: string }` |
| `claude` | AI model integration with Anthropic's Claude | `inputs: { prompt: string }, outputs: { completion: string }` |
| `http_request` | Makes HTTP requests to external services | `inputs: { url: string, method: string, headers: object, body: string }, outputs: { response: object, statusCode: number }` |
| `text_template` | String templating with variable substitution | `inputs: { template: string, variables: object }, outputs: { result: string }` |
| `data_transform` | Data transformation and manipulation | `inputs: { data: any, transform: string }, outputs: { result: any }` |
| `decision` | Conditional branching based on inputs | `inputs: { condition: any }, outputs: { true: any, false: any }` |
| `function` | Executes JavaScript code dynamically | `inputs: { code: string, args: object }, outputs: { result: any }` |
| `json_path` | Data extraction using JSONPath | `inputs: { data: object, path: string }, outputs: { result: any }` |

## Node Execution Flow

When a workflow runs, the node execution follows these steps:

1. Workflow engine determines execution order based on node dependencies
2. For each node:
   - Input values are collected from upstream nodes
   - Node executor function is called with inputs and configuration
   - Outputs are captured and passed to downstream nodes
   - Execution results are logged and monitored

## For Developers

To implement a new node:

1. Create a folder `client/src/nodes/your_node_type/`
2. Create `definition.ts` with the NodeDefinition interface
3. Implement `executor.ts` with the execution logic
4. Add the node type to `FOLDER_BASED_NODE_TYPES` in nodeSystem.ts

For detailed development instructions, see [DEVELOPMENT.md](./DEVELOPMENT.md)
For deeper technical architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)