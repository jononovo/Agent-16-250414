# Node-Based Workflow System Architecture

This document provides a comprehensive overview of the core architecture of the node-based workflow system. It serves as a high-level guide for developers and AI assistants working with the codebase.

## Core Architectural Components

### 1. Data Model (`/shared/schema.ts`)
The central data schema defines all entities in the system:
- `User` - System users
- `Workflow` - Executable node workflows
- `Node` - Individual processing units in a workflow
- `Agent` - Autonomous entities that can interact with workflows
- `Log` - Execution and error logs

Each model has corresponding insert types and validation schemas created with Drizzle and Zod.

### 2. Storage System (`/server/storage.ts`)
Implements the `IStorage` interface for all data persistence:
- Uses Replit Key-Value Database as the storage backend
- Provides typed CRUD operations for all models
- Handles serialization/deserialization of complex data objects
- Ensures data consistency across the application

```typescript
export interface IStorage {
  // Database access
  db: Database;
  
  // Data access methods
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  // ... other methods for Workflow, Node, Agent, Log models
}
```

### 3. Node System Architecture (`/client/src/nodes`)
Employs a folder-based approach for extensibility and organization:
- Each node type has its own folder with standardized files:
  - `definition.ts` - Node metadata and configuration options
  - `executor.ts` - Execution logic
  - `ui.tsx` - Visual representation
  - `schema.ts` - Data schema for inputs/outputs
  - `index.ts` - Main export

Nodes are organized into categories:
- `System` - Core nodes provided by the platform
- `Custom` - User-defined or specialized nodes
- `Default` - Fallback and utility nodes

### 4. Workflow Execution Engine (`/client/src/lib/nodeExecution.ts`, `/client/src/lib/enhancedWorkflowEngine.ts`)
Handles the execution of workflows by processing nodes in sequence:
- Dynamically loads node executors from the folder structure
- Manages data flow between connected nodes
- Tracks execution state and handles errors
- Provides debugging capabilities

```typescript
export interface NodeExecutionData {
  items: WorkflowItem[];  // Output data items
  meta: {
    startTime: Date;      // When execution started
    endTime?: Date;       // When execution completed
    error?: boolean;      // Whether an error occurred
    [key: string]: any;   // Additional metadata
  };
}
```

### 5. API and Routes (`/server/routes.ts`)
Provides endpoints for workflow management and execution:
- Workflow CRUD operations
- Node execution and testing
- Workflow generation
- Agent configuration

Critical endpoints:
- `/api/workflows` - Workflow management
- `/api/workflows/generate` - AI-based workflow generation
- `/api/tools/execute` - Direct tool execution

### 6. AI Integration Components (`/client/src/nodes/System/claude`, OpenAI integration)
Integrates various AI models into the workflow system:
- Claude API for text generation and reasoning
- OpenAI integration for workflow generation
- Supports API key configuration and usage
- Handles prompt construction and response parsing

### 7. Workflow Generation Service (`/server/services/workflowGenerationService.ts`)
Leverages AI to automatically generate workflows based on natural language prompts:
- Uses OpenAI/Claude to interpret user requirements
- Generates appropriate node structures and connections
- Creates fully functional workflows with minimal user input
- Supports various complexity levels and domains

### 8. Workflow Testing Framework (`/client/src/pages/workflow-test.tsx`)
Provides comprehensive testing capabilities for workflows:
- Visual execution monitoring
- Real-time node state tracking
- Input/output visualization
- Error diagnostics and debugging tools
- Performance metrics

### 9. ReactFlow Integration (`/client/src/components/flow`)
Uses ReactFlow for visual workflow representation:
- Custom node renderers
- Edge handling for connections
- Interactive canvas
- Node selection and manipulation

### 10. Builder Context (`/client/src/contexts/BuilderContext.tsx`)
Global state management for the workflow builder:
- Manages active workflow
- Tracks node selection and editing
- Handles undo/redo operations
- Manages sidebar and panel states

## Critical User Flows

### 1. Workflow Creation Flow
1. User initiates a new workflow
2. User adds nodes by dragging from palette
3. User configures each node through settings panel
4. User connects nodes to define data flow
5. Workflow is saved to storage

### 2. AI-Generated Workflow Flow
1. User provides natural language description
2. System generates workflow structure
3. User reviews and refines the generated workflow
4. User can test execution and make adjustments
5. Workflow is saved to storage

### 3. Workflow Execution Flow
1. Execution order is determined by node connections
2. Nodes are executed in sequence
3. Data flows between nodes according to connections
4. Node outputs are captured and visualized
5. Execution results are returned

### 4. Node Development Flow
1. Developer creates a new folder in the appropriate category
2. Implements standard node files (definition, executor, ui, schema)
3. Registers the node in the node registry
4. Node becomes available in the workflow editor

## Implementation Patterns

### Node Extension Pattern
Base nodes are enhanced with additional capabilities through a decorator pattern:
- Base functionality defined in core node components
- Extensions add features like hover menus, settings panels
- Ensures consistent behavior across all node types

### Data Flow Pattern
Standardized format for data flowing between nodes:
- `WorkflowItem` as the atomic unit of data
- `NodeExecutionData` as the container for execution results
- Strongly typed inputs and outputs
- Metadata for tracking execution details

### Settings Schema Pattern
Node configuration is defined by a schema that automatically generates UI:
- Settings defined in node definition
- UI components auto-generated based on schema
- Validation rules enforce proper configuration
- Persistence handled through the workflow storage

### Error Handling Pattern
Comprehensive error handling throughout the system:
- Errors captured and contained at the node level
- Error state visualization in the UI
- Detailed error logs for debugging
- Recovery mechanisms for non-critical errors

## Critical Dependencies

1. **ReactFlow** - Canvas visualization and interaction
2. **Drizzle** - Database schema and query building
3. **Zod** - Runtime type validation
4. **Express** - API server
5. **TypeScript** - Type-safe development
6. **ShadCN UI** - Component library for UI elements