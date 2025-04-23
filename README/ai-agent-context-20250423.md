# AI Agent Workflow Platform - AI Agent Context

This document provides essential information for AI assistants to understand and work with this codebase effectively.

## Application Overview

This application is a flexible, extensible node-based workflow platform for creating, visualizing, and executing AI agent workflows. It allows users to visually design workflows by connecting nodes representing different operations, with a focus on developer experience and workflow optimization.

## Technology Stack

### Frontend
- **React + TypeScript**: Core framework with strong type safety
- **ReactFlow**: Powers the interactive workflow visualization
- **Shadcn UI**: Modern component library for a clean design system
- **TanStack Query**: Data fetching and state management
- **Wouter**: Lightweight routing solution

### Backend
- **Express**: API server for workflow execution and data persistence
- **Zod**: Runtime validation and type generation

### Database/Storage
- **Replit Database**: Key-value storage via @replit/database
- **In-memory Cache**: Performance optimization with periodic persistence

### Infrastructure
- **Replit**: Development and deployment environment

## Key Files and Directories

1. **`client/src/nodes/`**: Core node implementation directory
   - `System/`: Built-in node types
   - `Custom/`: User-defined node types
   - `Default/ui.tsx`: Base node component with enhanced functionality

2. **`client/src/lib/nodeSystem.ts`**: Node registration and discovery system

3. **`client/src/lib/enhancedWorkflowEngine.ts`**: Executes workflows by processing nodes

4. **`client/src/components/nodes/common/`**: Shared node UI components
   - `NodeHoverMenu.tsx`: Action menu that appears on node hover
   - `NodeSettingsForm.tsx`: Dynamic settings form for node configuration

5. **`server/storage.ts`**: Data persistence implementation using Replit Database

6. **`server/routes.ts`**: API endpoints for workflow execution and data management

7. **`shared/schema.ts`**: Core data models and type definitions

## Critical Functions

1. **`executeEnhancedWorkflow(workflow, inputs)`**: Executes a workflow by processing its nodes in the correct order based on edge connections.

2. **`registerNodeExecutorsFromRegistry()`**: Automatically discovers and registers all available node types with the execution engine.

3. **`createNodeOutput(data)`**: Creates standardized node output format for consistent data flow between nodes.

4. **`MemStorage.initialize()`**: Initializes the storage system and loads data from Replit Database.

5. **`MemStorage.saveAllData()`**: Persists all in-memory data to Replit Database for durability.

6. **`runWorkflow(workflowId, inputs)`**: API function that initiates workflow execution from the server.

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

## State Management

1. **Frontend State**:
   - ReactFlow manages workflow canvas state (nodes, edges, positions)
   - TanStack Query handles server state (data fetching, mutations, caching)
   - React's useState/useReducer for component-local state

2. **Backend State**:
   - In-memory Maps store entities (workflows, nodes, agents, logs)
   - Sequential ID generation for new entities
   - Periodic persistence to Replit Database

3. **Workflow State**:
   - Node states are tracked during execution
   - Execution logs capture process history
   - Node state includes processing status, errors, and outputs

## Common Development Tasks

### Adding a New Node Type

1. Create a folder in `client/src/nodes/Custom/` with your node name
2. Implement three required files:
   - `definition.ts`: Node metadata and interface
   - `executor.ts`: Execution logic
   - `ui.tsx`: Visual component using DefaultNode

### Updating Node UI

1. For system-wide changes, modify `client/src/nodes/Default/ui.tsx`
2. For node-specific changes, modify that node's ui.tsx file

### Working with Storage

1. Use `storage.ts` interface methods for CRUD operations
2. Call `saveAllData()` to ensure persistence to Replit Database

### Debugging Workflows

1. Check node execution results in the node state
2. Review logs saved to the storage system
3. Use createErrorOutput() to propagate errors in node executors

## Known Issues

1. **Settings Drawer Interaction**: The drawer UI can sometimes close unexpectedly during certain interactions.

2. **Node Registration Timing**: Node types must be properly registered before workflows can reference them.

3. **Replit Database Limitations**: As a key-value store, it has performance constraints with large datasets.

4. **ReactFlow Version Compatibility**: Careful attention needed when upgrading ReactFlow due to breaking changes.

5. **Hover Menu Positioning**: May need adjustment in different viewport sizes.