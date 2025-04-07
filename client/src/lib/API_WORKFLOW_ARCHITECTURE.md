# API-Centric Workflow Architecture

This document explains the client-centric workflow architecture implemented in this system, which moves most workflow execution to the client side while using the server as an API provider.

## Architecture Overview

The new architecture uses a client-centric approach where:

1. Workflows are executed primarily in the browser
2. The server provides well-defined API endpoints for:
   - Data persistence (agents, workflows, nodes, logs)
   - API proxying for external services
   - Authentication and authorization
   - Advanced operations that can't be performed client-side

## Key Components

### 1. API Client (`apiClient.ts`)

A standardized client for making API requests to both internal and external endpoints, with:
- Standardized error handling
- Response transformation
- Request interceptors
- Timeout handling

### 2. Node Executors (`enhancedNodeExecutors/`)

Specialized executors for different node types that perform operations:
- `apiExecutor.ts` - Makes API calls to internal or external endpoints
- `databaseOperationExecutor.ts` - Performs database operations via API

### 3. Node Registry (`enhancedNodeExecutors/index.ts`)

Manages the registration and execution of node types:
- Registering node executors
- Executing nodes with appropriate executors
- Providing information about available node types

### 4. API Proxy (Server-Side)

An API proxy endpoint (`/api/proxy`) that securely makes external API requests:
- Protects API keys from exposure to the client
- Avoids CORS issues with external APIs
- Provides consistent error handling

### 5. Enhanced Workflow Engine (`enhancedWorkflowEngine.ts`)

The main workflow execution engine that:
- Resolves execution order based on node dependencies
- Manages node inputs and outputs
- Handles errors and state changes
- Provides execution hooks for monitoring

## Node Types

### API Node

The API node allows workflows to make requests to internal and external APIs:

**Features:**
- API type selection (internal/external)
- HTTP method selection (GET, POST, PUT, etc.)
- Dynamic endpoint URL based on input
- JSON data support
- Header configuration

### Database Operation Node

The Database Operation node allows workflows to interact with the database:

**Features:**
- Operation selection (get, getAll, create, update, delete)
- Entity type selection (agent, workflow, node, log)
- Dynamic entity ID from input
- Data mapping from input to database operations

## Benefits of Client-Centric Architecture

1. **Improved User Experience**
   - Lower latency for workflow operations
   - Reduced server load for common operations
   - Immediate local feedback during execution

2. **Better Development Experience**
   - Easier testing and debugging
   - Clearer separation of concerns
   - More modular architecture

3. **Enhanced Security**
   - Keep sensitive operations server-side
   - Protect API keys with proxy endpoint
   - Validate data on both client and server

4. **Scalability**
   - Reduced server load
   - Better utilization of client resources
   - More efficient API usage

## Workflow Execution Process

1. A workflow is loaded from the server
2. The client resolves the execution order based on node dependencies
3. Nodes are executed one by one:
   - For API nodes, requests are made through the API client
   - For database nodes, operations are performed via API endpoints
   - For other nodes, specialized executors handle the logic
4. Node outputs are passed to downstream nodes as inputs
5. Execution results are logged to the server
6. The workflow completes and returns the final result