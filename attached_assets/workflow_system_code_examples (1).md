# Workflow System Implementation Examples

This document provides code examples for key components of the workflow system implementation. These examples can be used as reference when rebuilding or extending the system.

## Table of Contents

1. [Node Component Structure](#node-component-structure)
2. [Node Registration](#node-registration) 
3. [Edge Connection](#edge-connection)
4. [Node Data Management](#node-data-management)

## Node Component Structure

### Basic Node Structure Template

```tsx
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';
import { Icon } from 'lucide-react';

interface MyNodeProps {
  data: {
    label?: string;
    // Add specific node data structure here
  };
  isConnectable?: boolean;
  selected?: boolean;
}

export function MyNode({ data, isConnectable = true, selected }: MyNodeProps) {
  return (
    <div className={cn('my-node-class group/node relative border rounded-md bg-background shadow transition-all',
      selected ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-border')}>
      <div className="node-header p-3 border-b flex items-center justify-between">
        <div className="font-medium text-sm flex items-center">
          <Icon className="h-4 w-4 mr-2 text-primary" />
          {data.label || 'My Node'}
        </div>
      </div>
      <div className="node-body p-3">
        {/* Node content goes here */}
      </div>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 left-0 bg-primary border-2 border-background"
      />
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 right-0 bg-primary border-2 border-background"
      />
    </div>
  );
}
```

### Complete Example: Generate Text Node

```tsx
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';
import { LightbulbIcon, PlayIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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

export function GenerateTextNode({ data, isConnectable = true, selected }: GenerateTextNodeProps) {
  const config = data.config || { model: 'gpt-3.5-turbo', systemPrompt: '', outputs: [] };
  const status = data.status || 'idle';
  
  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'complete': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'error': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className={cn('generate-text-node group/node relative border rounded-md bg-background shadow transition-all',
      selected ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-border')}>
      <div className="node-header p-3 border-b flex items-center justify-between">
        <div className="font-medium text-sm flex items-center">
          <LightbulbIcon className="h-4 w-4 mr-2 text-purple-500" />
          {data.label || 'Generate Text'}
        </div>
        <Badge variant="outline" className={cn('text-xs', getStatusColor())}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
      <div className="node-body p-3 space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-medium">Model</div>
          <Select defaultValue={config.model}>
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
              <SelectItem value="llama-3-70b">Llama 3 70B</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="text-xs font-medium">System Prompt</div>
          <Textarea 
            value={config.systemPrompt} 
            placeholder="Enter system prompt..." 
            className="min-h-20 text-xs"
          />
        </div>
        
        {config.outputs && config.outputs.length > 0 && (
          <div className="space-y-2 bg-muted/50 p-2 rounded-md">
            <div className="text-xs font-medium">Output</div>
            <div className="text-xs whitespace-pre-wrap">
              {config.outputs[0]}
            </div>
          </div>
        )}
        
        <Button variant="outline" size="sm" className="w-full text-xs h-7 flex items-center">
          <PlayIcon className="h-3 w-3 mr-1" />
          Run
        </Button>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 left-0 bg-primary border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 right-0 bg-primary border-2 border-background"
      />
    </div>
  );
}
```

## Node Registration

Node registration maps node type identifiers to their respective React components:

```tsx
// In client/src/components/flow-orchestrator/FlowOrchestrator.tsx

import { TextInputNode } from '@/components/flow/text-input-node';
import { GenerateTextNode } from '@/components/flow/generate-text-node';
import { VisualizeTextNode } from '@/components/flow/visualize-text-node';
import { PromptCrafterNode } from '@/components/flow/prompt-crafter-node';
import { AINodeComponent } from '@/components/flow-orchestrator/node-types/AINode';
import { DataNodeComponent } from '@/components/flow-orchestrator/node-types/DataNode';
import { TriggerNodeComponent } from '@/components/flow-orchestrator/node-types/TriggerNode';
import { ActionNodeComponent } from '@/components/flow-orchestrator/node-types/ActionNode';

// Node type registry
const nodeTypes = {
  // Specialized node types
  text_input: TextInputNode,
  generate_text: GenerateTextNode,
  visualize_text: VisualizeTextNode,
  prompt_crafter: PromptCrafterNode,
  
  // Basic node types
  ai_node: AINodeComponent,
  ai_text: GenerateTextNode, // Maps to specialized version
  ai_chat: AINodeComponent,
  
  // Generic node types by category
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

export function FlowOrchestrator({ initialWorkflow, onSave, readOnly = false }: FlowOrchestratorProps) {
  // ...implementation...
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      {...otherProps}
    >
      {/* Flow content */}
    </ReactFlow>
  );
}
```

## Edge Connection

Example of edge connection handling with proper handle management:

```tsx
// In client/src/pages/workflows/advanced-editor.tsx

const onConnect = useCallback(
  (params: Connection) => {
    // Ensure sourceHandle and targetHandle are defined
    const connection = {
      ...params,
      sourceHandle: params.sourceHandle || "output", // Default source handle
      targetHandle: params.targetHandle || "input",  // Default target handle
    };
    
    // Add the new connection to edges
    setEdges((eds) => addEdge(connection, eds));
    
    // Prepare edge data for backend
    const edgeData: WorkflowEdge = {
      id: connection.id || `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    };
    
    // Update workflow data
    setWorkflowData(prev => ({
      ...prev,
      edges: [...prev.edges, edgeData],
    }));
  },
  [setEdges, setWorkflowData]
);
```

## Node Data Management

Example of handling node updates:

```tsx
// In client/src/pages/workflows/advanced-editor.tsx

const handleNodeDataUpdate = (nodeId: string, newData: Record<string, any>) => {
  // Update node data in ReactFlow
  setNodes(nds => 
    nds.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...newData,
          },
        };
      }
      return node;
    })
  );
  
  // Update node data in workflow state
  setWorkflowData(prev => ({
    ...prev,
    nodes: prev.nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...newData,
          },
        };
      }
      return node;
    }),
  }));
};

// Use this when updating a node via UI
const onConfigPanelUpdate = (data: Record<string, any>) => {
  if (selectedNode) {
    handleNodeDataUpdate(selectedNode.id, data);
  }
};
```

These code examples provide a foundation for implementing and extending the workflow system with consistent patterns across components.
