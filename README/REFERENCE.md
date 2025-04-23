# AI Agent Workflow Platform - Technical Reference

This document serves as a comprehensive technical reference for the project, designed to be useful for both developers and AI assistants.

## Project Overview

This application is a node-based workflow platform for creating AI agents. It allows users to visually design workflows by connecting nodes (building blocks) that represent different operations.

Key architectural components:
- **Folder-based Node System**: Nodes are organized in folders by category and function
- **React + TypeScript Frontend**: Uses React with TypeScript for type safety
- **Replit Database Storage**: Uses Replit's Key-Value Database for persistence

## Critical Files and Functions

### 🔑 Top 10 Most Important Files

1. **client/src/nodes/Default/ui.tsx**
   - Base node UI component that provides enhanced functionality
   - Used by all node UI implementations
   - Provides settings drawer and standardized node structure

2. **client/src/components/nodes/common/NodeHoverMenu.tsx**
   - Provides a hover menu for node actions like duplicate, delete, settings
   - Appears with a 400ms delay and positioned 20px from nodes

3. **client/src/components/nodes/common/NodeSettingsForm.tsx**
   - Dynamic form generator for node settings
   - Handles different field types (text, select, checkbox, etc.)

4. **client/src/lib/nodeSystem.ts**
   - Core system for node registration and discovery
   - Maps node types to implementations

5. **client/src/lib/enhancedWorkflowEngine.ts**
   - Executes workflows by processing nodes in order
   - Handles data passing between nodes

6. **server/storage.ts**
   - Implements storage interface using Replit Key-Value Database
   - Provides CRUD operations for all data types

7. **server/routes.ts**
   - API routes for frontend-backend communication
   - Handles workflow execution requests

8. **shared/schema.ts**
   - Type definitions for data models
   - Used by both frontend and backend

9. **client/src/lib/nodeExecution.ts**
   - Utilities for node execution
   - Standardizes execution data format

10. **client/src/App.tsx**
    - Main application entry point
    - Sets up routing for application pages

### Core System Functions

| Function | Purpose | File |
|----------|---------|------|
| `registerNodeExecutorsFromRegistry()` | Registers all nodes with the execution engine | `nodeSystem.ts` |
| `executeEnhancedWorkflow()` | Runs a workflow with the enhanced node system | `enhancedWorkflowEngine.ts` |
| `createNodeOutput()` | Creates standardized node output | `nodeOutputUtils.ts` |
| `validateNodeDefinition()` | Validates a node definition | `nodeValidator.ts` |
| `getNodesByCategory()` | Groups nodes by category for UI display | `nodes/index.ts` |

### Storage Functions

| Function | Purpose | File |
|----------|---------|------|
| `MemStorage.initialize()` | Initializes storage and loads data from Replit Database | `storage.ts` |
| `MemStorage.getWorkflows()` | Retrieves all workflows | `storage.ts` |
| `MemStorage.createWorkflow()` | Creates a new workflow | `storage.ts` |
| `MemStorage.saveAllData()` | Persists all data to Replit Database | `storage.ts` |

### API Functions

| Function | Purpose | File |
|----------|---------|------|
| `registerRoutes()` | Sets up all Express routes | `routes.ts` |
| `runWorkflow()` | Executes a workflow through the API | `routes.ts` |

## Key Data Structures

### Core Types

| Type | Description | File |
|------|-------------|------|
| `NodeDefinition` | Defines a node's capabilities | `nodes/types.ts` |
| `NodeExecutorFunction` | Function signature for node execution | `lib/types.ts` |
| `NodeExecutionData` | Standardized output format | `lib/types.ts` |
| `User`, `Agent`, `Workflow`, `Node`, `Log` | Data models | `shared/schema.ts` |
| `IStorage` | Storage interface | `server/storage.ts` |

### Workflow Data

```typescript
interface Workflow {
  id: number;
  name: string;
  description: string;
  type: string;
  status: string;
  agentId: number | null;
  flowData: {
    nodes: any[];
    edges: any[];
  };
  icon: string | null;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
}
```

### Node Data

```typescript
interface Node {
  id: number;
  workflowId: number;
  type: string;
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}
```

### Node Definition

```typescript
interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  version: string;
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
  defaultData: Record<string, any>;
}
```

### NodeSettings Schema

```typescript
interface NodeSettings {
  title: string;
  fields: {
    key: string;         // Field identifier (matches data property)
    label: string;       // Display label
    type: string;        // text, number, select, checkbox, textarea, slider
    description?: string;// Help text
    options?: Array<{    // For select fields
      label: string;
      value: string;
    }>;
    min?: number;        // For number/slider fields
    max?: number;        // For number/slider fields
    step?: number;       // For number/slider fields
  }[];
}
```

## System Architecture and Data Flow

### Data Flow Architecture

1. **Frontend-to-Backend Flow**
   - Workflow data is created in the React UI
   - Saved via API to the backend
   - Persisted in Replit Key-Value Database
   - Retrieved on application startup

2. **Node Execution Flow**
   - Workflow execution begins with input nodes
   - Each node processes data and passes to next nodes
   - Results are collected and returned
   - Execution logs are stored

3. **Data Persistence**
   - In-memory storage with periodic Replit DB persistence
   - Data structures are mapped to JSON for storage
   - All entities have standard CRUD operations

### Enhanced Node Pattern

All nodes use a standardized UI pattern:
- Base node component defined in `Default/ui.tsx`
- Settings configured via a schema object
- Settings displayed in a drawer/sheet UI
- Common actions via hover menu

### Node Registration and Discovery

The node system automatically:
- Discovers nodes via folder structure
- Registers node types with the execution engine
- Maps UI components to node types
- Validates node definitions

## Common Code Patterns

### 1. Enhanced Node Pattern

```tsx
// In a node UI component
import DefaultNode from '@/nodes/Default/ui';

export const component = ({ data, id, selected }) => {
  // Settings schema
  const nodeSettings = {
    title: "Node Settings",
    fields: [/* fields */]
  };
  
  // Enhanced data
  const enhancedData = {
    ...data,
    settings: nodeSettings
  };
  
  // Node content
  const nodeContent = (
    <>
      {/* Custom content */}
    </>
  );

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

### 2. Node Executor Pattern

```typescript
// In executor.ts
export const execute: NodeExecutorFunction = async (nodeData, inputs) => {
  try {
    // Extract input data
    const inputValue = inputs.input || '';
    
    // Process according to node settings
    const result = processData(inputValue, nodeData);
    
    // Return standardized output
    return createNodeOutput({
      result: result
    });
  } catch (error) {
    return createErrorOutput(error.message);
  }
};
```

### 3. Storage Pattern

```typescript
// Creating an entity
async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
  // Generate ID
  const id = ++this.workflowId;
  
  // Create entity
  const workflow: Workflow = { 
    ...insertWorkflow,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Store in memory
  this.workflows.set(id, workflow);
  
  // Persist to Replit Database
  await this.saveWorkflows();
  
  return workflow;
}
```

## Common Tasks and How to Handle Them

### 1. Creating a New Node Type

1. Create a folder in `client/src/nodes/Custom/` with your node name
2. Create the three required files:
   - `definition.ts`: Node metadata and interface
   - `executor.ts`: Execution logic
   - `ui.tsx`: Visual component using DefaultNode
3. Ensure it's properly registered in the node system

### 2. Updating the Node UI

1. Modify components in `client/src/components/nodes/common/`
2. For system-wide changes, modify `client/src/nodes/Default/ui.tsx`
3. For node-specific changes, modify that node's ui.tsx file

### 3. Working with the Storage System

1. Use the `storage.ts` interface methods for CRUD operations
2. Understand that all data is cached in memory for performance
3. Data is periodically saved to Replit Database

### 4. Debugging Workflow Execution

1. Check node execution results in the node state
2. Review logs saved to the storage system
3. Trace execution through the enhancedWorkflowEngine