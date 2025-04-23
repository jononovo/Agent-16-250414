# AI Agent Workflow Platform - AI Model Context

This document provides a high-level overview of the project structure and key concepts to help AI assistants understand and work with the codebase.

## Project Purpose and Architecture

This application is a node-based workflow platform for creating AI agents. It allows users to visually design workflows by connecting nodes (building blocks) that represent different operations.

Key architectural components:
- **Folder-based Node System**: Nodes are organized in folders by category and function
- **React + TypeScript Frontend**: Uses React with TypeScript for type safety
- **Replit Database Storage**: Uses Replit's Key-Value Database for persistence

## Core Files and Their Relationships

### 🔑 Top 10 Most Important Files

1. **client/src/nodes/Default/ui.tsx**
   - Base node UI component that provides enhanced functionality
   - Used by all node UI implementations

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

### Critical Data Structures

1. **Workflows**: The main data entity representing a node-based workflow.
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

2. **Nodes**: Building blocks in workflows, connected by edges.
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

3. **Node Definition**: Metadata describing a node type.
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

4. **NodeSettings Schema**: Used for UI generation.
   ```typescript
   interface NodeSettings {
     title: string;
     fields: {
       key: string;
       label: string;
       type: string;
       description?: string;
       options?: {label: string, value: string}[];
     }[];
   }
   ```

## Key Concepts and Patterns

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

### Data Flow and Execution

Workflow execution follows these steps:
1. Build a dependency graph of nodes
2. Sort nodes topologically by dependencies
3. Execute nodes in order
4. Pass data between connected nodes
5. Handle errors and edge cases

### Storage System

Data persistence follows this pattern:
1. In-memory objects with Maps for immediate access
2. Periodic synchronization with Replit Key-Value Database
3. JSON serialization for database storage

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