# Workflow Node System: Technical Documentation

This document provides technical specifications for the workflow node system architecture, explaining the structure, categorization, and implementation details of each node type.

## Table of Contents

1. [System Overview](#system-overview)
2. [Node Architecture](#node-architecture)
3. [Tab Categories](#tab-categories)
4. [Node Registry](#node-registry)
   - [AI Nodes](#ai-nodes)
   - [Data Nodes](#data-nodes)
   - [Trigger Nodes](#trigger-nodes)
   - [Action Nodes](#action-nodes)
5. [Node Implementation](#node-implementation)
6. [Edge Connection System](#edge-connection-system)
7. [Component Organization](#component-organization)

## System Overview

The workflow system is built on React Flow, with specialized node components that provide enhanced visualization and configurability. Each node has a specific purpose in the workflow, with standardized inputs and outputs to ensure proper connectivity.

The system prioritizes specialized, advanced node components with detailed UI representations and expanded panels. Nodes are categorized into tabs (AI, Data, Triggers, Actions) and registered in a central node registry to ensure consistent type mapping.

## Node Architecture

Each node in the system follows this architecture:

```typescript
interface WorkflowNode {
  id: string;          // Unique identifier
  type: string;        // Node type (matches registry key)
  position: {          // Position on canvas
    x: number; 
    y: number;
  };
  data: Record<string, any>; // Node configuration data
}

interface WorkflowEdge {
  id: string;           // Unique identifier
  source: string;       // Source node ID
  target: string;       // Target node ID
  sourceHandle?: string; // Output port identifier (default: "output")
  targetHandle?: string; // Input port identifier (default: "input")
}
```

Nodes are connected via edges with sourceHandle and targetHandle properties to specify exactly which input/output ports are connected.

## Tab Categories

The nodes are organized into four main categories, each represented by a tab in the UI:

1. **AI** - Nodes for AI model interactions, prompt engineering, and text generation
2. **Data** - Nodes for data visualization, transformation, and filtering
3. **Triggers** - Nodes that initiate workflows based on events or schedules
4. **Actions** - Nodes that perform operations such as API requests or database queries

The default tab is set to "AI" to prioritize the specialized AI node functionality.

## Node Registry

The node registry maps node type identifiers to their respective component implementations:

```typescript
const nodeTypes = {
  // Specialized advanced node types
  text_input: TextInputNode,
  generate_text: GenerateTextNode,
  visualize_text: VisualizeTextNode,
  prompt_crafter: PromptCrafterNode,
  
  // Legacy/basic node types (with mapping to specialized versions)
  ai_node: AINodeComponent,
  ai_text: GenerateTextNode,
  ai_chat: AINodeComponent,
  
  // Generic node types
  trigger: TriggerNodeComponent,
  webhook: TriggerNodeComponent,
  scheduler: TriggerNodeComponent,
  email_trigger: TriggerNodeComponent,
  
  action: ActionNodeComponent,
  http_request: ActionNodeComponent,
  email_send: ActionNodeComponent,
  database_query: ActionNodeComponent,
  
  data_transform: DataNodeComponent,
  filter: DataNodeComponent
};
```

### AI Nodes

| Node ID | Component | Description | UI Elements |
|---------|-----------|-------------|------------|
| `text_input` | TextInputNode | Provides static text input to the workflow | Text area, output handle |
| `generate_text` | GenerateTextNode | Creates AI-generated text with model | Model selector, system prompt, status badge, output handles |
| `prompt_crafter` | PromptCrafterNode | Designs templated prompts with variables | Template editor, variable indicators, output handle |
| `ai_node` | AINodeComponent | Legacy AI data processing node | Basic configuration, input/output handles |
| `ai_text` | GenerateTextNode | Maps to specialized GenerateTextNode | Same as generate_text |
| `ai_chat` | AINodeComponent | Legacy AI chat node | Basic configuration, input/output handles |

### Data Nodes

| Node ID | Component | Description | UI Elements |
|---------|-----------|-------------|------------|
| `visualize_text` | VisualizeTextNode | Displays text output in workflow | Text display area, input handle |
| `data_transform` | DataNodeComponent | Transforms data structure | Configuration panel, input/output handles |
| `filter` | DataNodeComponent | Filters data based on conditions | Condition editor, input/output handles |

### Trigger Nodes

| Node ID | Component | Description | UI Elements |
|---------|-----------|-------------|------------|
| `trigger` | TriggerNodeComponent | Generic trigger node | Base trigger configuration, output handle |
| `webhook` | TriggerNodeComponent | Triggers workflow from HTTP request | Webhook URL configuration, output handle |
| `scheduler` | TriggerNodeComponent | Runs workflow on schedule | Schedule configuration, output handle |
| `email_trigger` | TriggerNodeComponent | Triggers from email events | Email criteria configuration, output handle |

### Action Nodes

| Node ID | Component | Description | UI Elements |
|---------|-----------|-------------|------------|
| `action` | ActionNodeComponent | Generic action node | Base action configuration, input/output handles |
| `http_request` | ActionNodeComponent | Makes API requests | URL, method, headers config, input/output handles |
| `email_send` | ActionNodeComponent | Sends email messages | Email configuration, input handle |
| `database_query` | ActionNodeComponent | Performs database operations | Query editor, input/output handles |

## Node Implementation

Each specialized node implements its own render function with specific UI components and connection handles. For example, the GenerateTextNode has this structure:

```typescript
export interface GenerateTextNodeProps {
  data: {
    label?: string;
    config?: {
      model: string;
      systemPrompt: string;
      outputs?: string[];
    };
    status?: 'idle' | 'running' | 'complete' | 'error';
  };
  isConnectable?: boolean;
  selected?: boolean;
}
```

The node features:
- Expandable sections for detailed configuration
- Status indicators (idle/running/complete/error)
- Model selector dropdown
- System prompt text area
- Output visualization with result formatting
- Handles for connecting to other nodes

## Edge Connection System

The edge connection system standardizes on source/target handles to ensure proper connectivity:

1. Each node defines specific input and output handles
2. Default handle IDs: "input" for target, "output" for source
3. Edges store both the node IDs and the specific handle IDs
4. When creating connections, handles are automatically assigned if not specified

Implementation:
```typescript
// Converting edges to ReactFlow format, ensuring handles are defined
const flowEdges = initialWorkflow.edges.map(edge => ({
  ...edge,
  sourceHandle: edge.sourceHandle || "output", // Default to 'output' for source
  targetHandle: edge.targetHandle || "input"   // Default to 'input' for target
}));

// When creating a new connection
const onConnect = useCallback(
  (params: Connection) => {
    const connection = {
      ...params,
      sourceHandle: params.sourceHandle || "output",
      targetHandle: params.targetHandle || "input",
    };
    setEdges(eds => addEdge(connection, eds));
  },
  [setEdges]
);
```

## Component Organization

The system is organized into these main components:

1. **Node Components** (`client/src/components/flow/`) - Specialized node implementations
2. **Flow Orchestrator** (`client/src/components/flow-orchestrator/`) - Canvas management and node registry
3. **Node Sidebar** (`client/src/components/flow-orchestrator/NodeSidebar.tsx`) - Node palette with categorized tabs
4. **Node Inspector** (`client/src/components/flow-orchestrator/NodeInspector.tsx`) - Configuration panel for selected nodes
5. **Workflow Editor** (`client/src/pages/workflows/advanced-editor.tsx`) - Main workflow editor page

Each specialized node is defined in its own file to provide clear separation of concerns and facilitate future extension of the node library.
