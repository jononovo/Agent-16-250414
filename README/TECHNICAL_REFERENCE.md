# Project Technical Reference

This document provides a quick reference for key files, components, and patterns in the AI Workflow Platform.

## Key Files & Their Purpose

### Core System Files

| File | Purpose |
|------|---------|
| `client/src/lib/nodeSystem.ts` | Handles node discovery, registration and management |
| `client/src/lib/enhancedWorkflowEngine.ts` | Executes workflows by processing nodes in dependency order |
| `client/src/lib/nodeExecution.ts` | Node execution utilities and interfaces |
| `client/src/lib/nodeValidator.ts` | Validates node definitions for consistency |
| `client/src/nodes/index.ts` | Entry point for node registration |
| `server/storage.ts` | Data persistence using Replit Key-Value Database |
| `server/routes.ts` | Express routes for API endpoints |
| `shared/schema.ts` | Type definitions for data models |

### UI Component Files

| File | Purpose |
|------|---------|
| `client/src/nodes/Default/ui.tsx` | Enhanced node base component with settings drawer |
| `client/src/components/nodes/common/NodeContainer.tsx` | Base container for all nodes |
| `client/src/components/nodes/common/NodeContent.tsx` | Content area for nodes |
| `client/src/components/nodes/common/NodeHeader.tsx` | Header with title and icon |
| `client/src/components/nodes/common/NodeHoverMenu.tsx` | Hover menu for node actions |
| `client/src/components/nodes/common/NodeSettingsForm.tsx` | Dynamic form for node settings |
| `client/src/components/flow/FlowEditor.tsx` | Main workflow editor component |

## Critical Functions

### Node System Functions

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

## Data Flow Architecture

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

## Type System Reference

### Core Types

| Type | Description | File |
|------|-------------|------|
| `NodeDefinition` | Defines a node's capabilities | `nodes/types.ts` |
| `NodeExecutorFunction` | Function signature for node execution | `lib/types.ts` |
| `NodeExecutionData` | Standardized output format | `lib/types.ts` |
| `User`, `Agent`, `Workflow`, `Node`, `Log` | Data models | `shared/schema.ts` |
| `IStorage` | Storage interface | `server/storage.ts` |

### Settings Schema Types

```typescript
// Node settings schema format
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

## Extension Points

Here are the main points where the system can be extended:

1. **New Node Types**
   - Create a new folder in `client/src/nodes/Custom/`
   - Implement definition.ts, executor.ts, and ui.tsx

2. **Enhanced Node UI**
   - Extend `client/src/nodes/Default/ui.tsx`
   - Add new field types to `NodeSettingsForm.tsx`

3. **Storage Adapters**
   - Implement new storage class conforming to IStorage interface
   - Replace MemStorage with your implementation

4. **API Endpoints**
   - Add new routes in `server/routes.ts`
   - Associate with appropriate storage methods