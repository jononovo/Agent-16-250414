# AI Agent Workflow Platform - AI Agent Context (Optimized)

This document provides essential information for AI assistants to understand and work with this codebase effectively.

## Application Overview

This application is a flexible, extensible node-based workflow platform for creating, visualizing, and executing AI agent workflows. It allows users to visually design workflows by connecting nodes representing different operations, with a focus on developer experience and workflow optimization.

## Technology Stack

### Frontend
- **React 18.x + TypeScript 5.x**: Core framework with strict type checking
- **ReactFlow 11.x**: Powers the interactive workflow visualization (incompatible with versions <11.0)
- **Shadcn UI**: Component library built on Radix UI primitives
- **TanStack Query v5**: Data fetching with object-form query syntax only
- **Wouter**: Lightweight routing (6kb) alternative to React Router

### Backend
- **Express 4.x**: REST API server with standard middleware pattern
- **Zod**: Schema validation for API request/response
- **WebSocket**: WebSocket server for real-time communication

### Database/Storage
- **Replit Database**: Key-value storage via `@replit/database` package
- **Storage Pattern**: In-memory Maps with periodic JSON serialization to Replit DB
- **Data Access**: Through `storage.ts` interface methods only, never direct DB access

### Authentication/Security
- **Simple API Key Management**: Keys stored in environment variables
- **Webhook Authentication**: API Key, Bearer Token, and secret key validation options
- **No User Authentication**: System designed for single-user usage within Replit

### Configuration Requirements
- **Environment Variables**: OPENAI_API_KEY, CLAUDE_API_KEY, PERPLEXITY_API_KEY (optional)
- **Node.js**: Version 18+ required
- **Vite**: Used for both development and production builds

## Component Relationships

### Dependency Mapping
- **Node System → Workflow Engine**: Nodes must be registered before workflow execution
- **Storage → API Routes**: Routes depend on storage layer for data persistence
- **Node Definitions → Node UI**: UI components rely on node definitions for rendering
- **Default Node → Custom Nodes**: All custom nodes extend the default node pattern
- **Webhook System → Routes**: Webhook endpoints integrated with node system for external triggers

### Data Transformation Flow
```
User Input → Node Executor → NodeExecutionData → Next Node → Final Output
```

### Critical API Boundaries
- **Frontend-Backend**: REST API with JSON payloads at `/api/*` endpoints
- **External Services**: Proxied through `/api/proxy/*` routes for API key protection
- **Workflow-Node**: Well-defined interface through `NodeExecutorFunction` type
- **Webhook Integration**: External systems connect through `/api/webhooks/*` endpoints

### Initialization Sequence
1. Server startup (`server/index.ts`)
2. Express routes registration (`server/routes.ts`) including webhook routes
3. Storage initialization and data loading (`storage.initialize()`)
4. Node discovery and registration (`discoverAndRegisterNodeExecutors()`)
5. React application mounting with available node types

## Key Files and Directories

1. **`client/src/nodes/`**: Core node implementation directory
   - `System/`: Built-in node types
   - `Custom/`: User-defined node types including webhook nodes
   - `Default/ui.tsx`: Base node component with enhanced functionality

2. **`client/src/lib/nodeSystem.ts`**: Node registration and discovery system
   - Handles automatic node discovery
   - Maps node types to implementations

3. **`client/src/lib/enhancedWorkflowEngine.ts`**: Executes workflows by processing nodes
   - Creates node dependency graph
   - Handles sequential and parallel execution

4. **`client/src/components/nodes/common/`**: Shared node UI components
   - `NodeHoverMenu.tsx`: Action menu that appears on node hover
   - `NodeSettingsForm.tsx`: Dynamic settings form for node configuration
   - `NodeContainer.tsx`: Base container for all nodes with shared styling

5. **`server/storage.ts`**: Data persistence implementation using Replit Database
   - Implements `IStorage` interface
   - Provides CRUD operations for all entities

6. **`server/routes.ts`**: API endpoints for workflow execution and data management
   - Handles API and webhook requests
   - Manages external service integration
   - Processes webhook authentication and payloads

7. **`shared/schema.ts`**: Core data models and type definitions
   - Defines data structures for the entire application
   - Used by both frontend and backend

## Critical Functions

1. **`executeEnhancedWorkflow(workflow, inputs)`** (`enhancedWorkflowEngine.ts`)
   ```typescript
   // Creates dependency graph and executes nodes in correct order
   const dependencyGraph = createNodeDependencyGraph(workflow.flowData);
   ```

2. **`registerNodeExecutorsFromRegistry()`** (`nodeSystem.ts`)
   ```typescript
   // Discovers and registers node implementations
   const systemDefinitionModules = import.meta.glob('../nodes/System/*/definition.ts');
   ```

3. **`createNodeOutput(data)`** (`nodeOutputUtils.ts`)
   ```typescript
   // Creates standardized output format for nodes
   return { items: [{json: data}], meta: {startTime, endTime} };
   ```

4. **`MemStorage.initialize()`** (`storage.ts`)
   ```typescript
   // Loads data from Replit Database to memory
   const workflows = this.parseDbResult(await this.db.get('workflows'));
   ```

5. **`MemStorage.saveAllData()`** (`storage.ts`)
   ```typescript
   // Persists all data to Replit Database
   await this.db.set('workflows', JSON.stringify(Array.from(this.workflows.values())));
   ```

6. **`runWorkflow(workflowId, inputs)`** (`routes.ts`)
   ```typescript
   // API entry point for workflow execution
   const result = await executeEnhancedWorkflow(workflow, inputs);
   ```

7. **`handleWebhookRequest(req, res)`** (`routes.ts`)
   ```typescript
   // Processes incoming webhook requests and triggers workflows
   const { workflowId, nodeId } = req.params;
   // Authentication and payload processing
   // Workflow execution with webhook data
   ```

## Data Flow

1. **Frontend to Backend**:
   - React components in the workflow editor allow visual creation of workflows
   - TanStack Query sends workflow data to Express API endpoints
   - Workflows are persisted in Replit Database

2. **Node Execution Flow**:
   - Workflow execution starts at input nodes
   - Each node processes data according to its executor function
   - Output is passed to connected nodes via edges
   - Final outputs are collected and returned

3. **Persistence Flow**:
   - In-memory storage maintains application state for performance
   - Periodic synchronization with Replit Database ensures durability
   - On application startup, data is loaded from Replit Database to memory

4. **Webhook Flow**:
   - External system sends request to webhook endpoint
   - Server authenticates and processes the request
   - Webhook trigger node receives data and starts workflow execution
   - Results can be returned synchronously or dispatched asynchronously

## State Management

1. **Frontend State**:
   - ReactFlow manages workflow canvas state (nodes, edges, positions)
   - TanStack Query handles server state (data fetching, mutations, caching)
   - React's useState/useReducer for component-local state
   - Events system for global component communication

2. **Backend State**:
   - In-memory Maps store entities (workflows, nodes, agents, logs)
   - Sequential ID generation for new entities
   - Periodic persistence to Replit Database

3. **Workflow State**:
   - Node states are tracked during execution
   - Execution logs capture process history
   - Node state includes processing status, errors, and outputs

## Pattern Examples

### Enhanced Node Pattern
```tsx
// client/src/nodes/Custom/myNode/ui.tsx
import DefaultNode from '@/nodes/Default/ui';

export const component = ({ data, id, selected }) => {
  // Settings schema
  const nodeSettings = {
    title: "Node Settings",
    fields: [{ key: "option", type: "text" }]
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

### Node Executor Pattern
```typescript
// client/src/nodes/Custom/myNode/executor.ts
export const execute = async (nodeData, inputs) => {
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

### Icon Management Pattern
```typescript
// Direct import in definition.ts
import { Webhook } from 'lucide-react';

const definition = {
  type: 'my_node',
  name: 'My Node',
  description: 'Description of my node',
  category: 'actions',
  icon: Webhook, // Direct component reference
  // ...other properties
};
```

### Event Communication Pattern
```typescript
// Opening settings drawer
window.dispatchEvent(new CustomEvent('node-settings-open', {
  detail: { nodeId: id }
}));

// Event listener
useEffect(() => {
  const handleSettingsOpen = (event) => {
    const { nodeId } = event.detail;
    setIsOpen(true);
    setCurrentNodeId(nodeId);
  };
  
  window.addEventListener('node-settings-open', handleSettingsOpen);
  return () => window.removeEventListener('node-settings-open', handleSettingsOpen);
}, []);
```

### Naming Conventions
- **File/Folder**: camelCase for files, snake_case for node type folders
- **Components**: PascalCase for React components (e.g., `NodeHeader.tsx`)
- **Functions**: camelCase for functions/methods
- **Types/Interfaces**: PascalCase (e.g., `NodeDefinition`, `WorkflowData`)

## Common Development Tasks

### Adding a New Node Type

1. Create a folder in `client/src/nodes/Custom/` with your node name
2. Implement three required files:
   - `definition.ts`: Node metadata and interface
   - `executor.ts`: Execution logic
   - `ui.tsx`: Visual component using DefaultNode

### Creating Webhook-Enabled Nodes

1. For **Trigger Nodes**:
   - Set category to "triggers"
   - Define output ports for webhook payload, headers, and method
   - Use the global settings drawer with useGlobalSettingsOnly=true

2. For **Response Nodes**:
   - Validate destination URLs with zod
   - Implement error handling with retry logic
   - Configure timeout and status feedback

### Updating Node UI

1. For system-wide changes, modify `client/src/nodes/Default/ui.tsx`
2. For node-specific changes, modify that node's ui.tsx file

> **Important Note**: Changes to `Default/ui.tsx` only affect nodes that explicitly use DefaultNode as a wrapper

### Working with Storage

1. Use `storage.ts` interface methods for CRUD operations
2. Call `saveAllData()` to ensure persistence to Replit Database

### Debugging Workflows

1. Check node execution results in the node state
2. Review logs saved to the storage system
3. Add console logging in node executors for debugging

## Common Error Patterns and Solutions

### General Node Issues
- **Node not appearing**: Check registration in nodeSystem.ts
- **Inputs not receiving data**: Verify handle IDs match input names
- **Settings drawer issues**: Verify event propagation is properly stopped
- **Node updates not affecting all nodes**: DefaultNode changes only affect nodes using it as a wrapper

### Webhook-Specific Issues
- **Webhook URLs not generating**: Check server route registration in routes.ts
- **Authentication failures**: Verify header format matches expected pattern
- **Webhook not triggering**: Test endpoint directly with curl or Postman
- **Webhook response issues**: Check timeout settings and response format

### React Flow Edge Connection Issues
- **Symptom**: Cannot connect nodes in the editor
- **Solution**: Verify handle IDs match input/output names in node definition

### Storage Synchronization Errors
- **Symptom**: Data not persisting between sessions
- **Solution**: Manually call `storage.saveAllData()` or check Replit Database connectivity

### Environment Differences
- **Development**: Hot module reloading available, error overlay visible
- **Production**: Optimized bundles, no developer tools, stricter error handling

## Update History

- **2025-04-24-0706**: 
  - Added comprehensive webhook system documentation
  - Updated node architecture patterns with latest best practices
  - Enhanced icon management section with direct component references
  - Added event-based communication system details
  - Updated troubleshooting with webhook-specific issues
  - Previous version: replit-dev-agent-context-20250423-1644.md