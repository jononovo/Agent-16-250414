# AI Agent Workflow Platform

## Mission

We enable non-technical people to build, manage, and optimize incredible workflows with AI. Our platform allows users to create and orchestrate AI agents through a visual workflow builder, making complex AI interactions accessible to everyone.

## Core Features

- **Visual Workflow Builder**: Drag-and-drop interface using React Flow
- **Modular Node System**: Folder-based architecture for scalable node development
- **Agent Orchestration**: Higher-level agents can coordinate other agents
- **Chat Interface**: Natural language interaction with agents
- **Dynamic Validation**: Runtime checking of node and workflow integrity

## Architecture Overview

The platform consists of these key components:

1. **Agents**: Core entities representing AI assistants with specific purposes
2. **Workflows**: Visual representations of agent logic built with React Flow
3. **Nodes**: Individual components in workflows, each with a specific function
4. **Endpoints**: API interfaces for agent interaction and management

### Folder-Based Node System

The platform has been upgraded to use a folder-based node architecture where:

- Each node type is contained in its own folder with standardized files
- Node components (definition, executor, UI) are clearly separated
- Nodes are discovered and registered dynamically
- No central registry files need to be manually maintained

```
nodes/
  └── text_input/               # Self-contained node folder
      ├── definition.ts         # Node metadata and interface
      ├── executor.ts           # Runtime execution logic
      └── ui.tsx                # React component for rendering
```

### Benefits of Folder-Based Architecture

- **Maintainability**: Changes to one node don't affect others
- **Developer Experience**: Standardized structure for all nodes
- **Performance**: Dynamic loading of nodes only when needed
- **Scalability**: Easy to add or remove node types

## Core Principles

- **Client-centric**: Browser execution with API backend communication
- **Registry-based**: Use registries, not code modifications
- **API-first**: Well-defined interfaces between components
- **Separation**: Platform ≠ Workflows

## Standards & Best Practices

### ✅ DO

- Use the folder-based system for adding new nodes
- Follow standard interfaces and validation requirements
- Keep platform and workflows separate
- Use built-in validation for ensuring node correctness
- Leverage component libraries for consistent UI

### ⚠️ DON'T

- Modify core files
- Hardcode workflows into platform
- Create special cases
- Add console.log to production
- Build custom test endpoints
- Create centralized registries for nodes

## Available Node Types

The system currently includes the following node types:

| Type | Category | Description |
|------|----------|-------------|
| `text_input` | Input | Provides text input for workflows |
| `claude` | AI | Integration with Claude AI model |
| `http_request` | Integration | Makes HTTP requests to external APIs |
| `text_template` | Transformation | Creates text from templates with variables |
| `data_transform` | Transformation | Transforms data between formats |
| `decision` | Logic | Makes decisions based on conditions |
| `function` | Code | Executes custom JavaScript code |
| `json_path` | Data | Extracts data using JSONPath expressions |

## Getting Started

1. Run the application and explore the UI to understand the workflow builder
2. Review a simple workflow to see the basic structure
3. Examine the node definitions to understand their capabilities
4. Try creating a simple workflow with a few connected nodes

## For detailed documentation, see:

- [ARCHITECTURE.md](./ARCHITECTURE.md): Technical details of the system architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md): Guide to creating and working with nodes

Remember: Build ON the platform, not IN it.