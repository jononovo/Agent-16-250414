# AI Agent Workflow Platform

This project implements a flexible, extensible node-based workflow system for creating, visualizing, and executing workflows. The architecture uses a folder-based approach for implementing nodes, making it easy to add new node types.

> **Note**: For AI assistants helping with this codebase, see [AI Agent Context](./ai-agent-context-20250423.md) for a concise overview tailored for AI systems.

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Core Architecture](#core-architecture)
3. [Node System](#node-system)
4. [Storage System](#storage-system)
5. [UI Guidelines](#ui-guidelines)
6. [Technical Reference](#technical-reference)
   - [Key Files and Functions](#key-files-and-functions)
   - [Data Structures](#data-structures)
   - [Code Patterns](#code-patterns)
7. [Development Guide](#development-guide)
8. [Troubleshooting](#troubleshooting)

## Quick Start Guide

### Key Features

- **Folder-based Node Architecture**: Each node is a self-contained module with definition, execution logic, and UI
- **Enhanced Node Pattern**: Standardized UI with settings drawer and hover menu functionality
- **Consistent User Experience**: All nodes follow the same visual design patterns
- **Type Safety**: Strong TypeScript typing throughout the system
- **Replit Database Integration**: Persistent storage using Replit's Key-Value Database

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

## Core Architecture

The AI Agent Workflow Platform is built around a modular node-based architecture that enables the composition of complex workflows through simple, reusable components. The architecture follows these core design principles:

1. **Modularity**: Each node is a self-contained unit with well-defined interfaces
2. **Discoverability**: Components are automatically discovered and registered
3. **Type Safety**: Strong typing ensures consistent interfaces and validation
4. **Separation of Concerns**: Clear boundaries between definition, execution, and presentation

## Node System

### Node Structure

Each node is a self-contained module with three primary components:

1. **Definition (`definition.ts`)**: Declares the node's metadata, input/output ports, and configuration options.
2. **Execution Logic (`executor.ts`)**: Implements the node's functionality when executed within a workflow.
3. **UI Representation (`ui.tsx`)**: Renders the node in the workflow editor canvas.

All nodes are organized in one of three main folders:
- `/client/src/nodes/System/` - For core system nodes
- `/client/src/nodes/Custom/` - For custom, domain-specific nodes
- `/client/src/nodes/Default/` - For default node implementation patterns

### Node Output Format

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

## Storage System

The platform uses the Replit Key-Value Database (via @replit/database) for persistent storage of:

- Workflows
- Nodes
- Agents
- Logs

The storage implementation in `server/storage.ts` provides a comprehensive interface for CRUD operations on all data types, with methods for:
- Getting, creating, updating, and deleting workflows
- Managing agents and their relationships to workflows
- Tracking execution logs

## UI Guidelines

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

## Technical Reference

### Key Files and Functions

#### 🔑 Top 10 Most Important Files

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

### Data Structures

#### Core Types

| Type | Description | File |
|------|-------------|------|
| `NodeDefinition` | Defines a node's capabilities | `nodes/types.ts` |
| `NodeExecutorFunction` | Function signature for node execution | `lib/types.ts` |
| `NodeExecutionData` | Standardized output format | `lib/types.ts` |
| `User`, `Agent`, `Workflow`, `Node`, `Log` | Data models | `shared/schema.ts` |
| `IStorage` | Storage interface | `server/storage.ts` |

#### Workflow Data

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

#### Node Data

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

#### Node Definition

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

#### NodeSettings Schema

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

### Code Patterns

#### 1. Enhanced Node Pattern

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

#### 2. Node Executor Pattern

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

#### 3. Storage Pattern

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

## Development Guide

### System Architecture and Data Flow

#### Data Flow Architecture

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

### Common Tasks

#### 1. Creating a New Node Type

1. Create a folder in `client/src/nodes/Custom/` with your node name
2. Create the three required files:
   - `definition.ts`: Node metadata and interface
   - `executor.ts`: Execution logic
   - `ui.tsx`: Visual component using DefaultNode
3. Ensure it's properly registered in the node system

#### 2. Updating the Node UI

1. Modify components in `client/src/components/nodes/common/`
2. For system-wide changes, modify `client/src/nodes/Default/ui.tsx`
3. For node-specific changes, modify that node's ui.tsx file

#### 3. Working with the Storage System

1. Use the `storage.ts` interface methods for CRUD operations
2. Understand that all data is cached in memory for performance
3. Data is periodically saved to Replit Database

#### 4. Debugging Workflow Execution

1. Check node execution results in the node state
2. Review logs saved to the storage system
3. Trace execution through the enhancedWorkflowEngine

## Troubleshooting

| Issue | Possible Solutions |
|-------|-------------------|
| Node not appearing in editor | Check registration in nodeSystem.ts |
| Inputs not receiving data | Verify input handle IDs match input names |
| Outputs not connecting | Check output handle IDs match output names |
| Execution errors | Add try/catch and verbose logging |
| UI not rendering properly | Check component imports and props |
| Type errors | Ensure type definitions match actual data |
| Settings drawer closing unexpectedly | Verify event propagation is properly stopped |
| Hover menu not appearing | Check z-index and positioning calculations |