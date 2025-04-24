# AI Agent Workflow Platform: Technical Documentation

## Node Discovery System

### Architecture

The platform implements a convention-over-configuration pattern using a centralized registry that automatically discovers and loads node components based on filesystem structure.

```
nodes/
├── System/          # Core system nodes
│   └── {node_type}/
│       ├── definition.ts   # Metadata and interface
│       ├── ui.tsx          # React component
│       └── executor.ts     # Runtime logic
└── Custom/          # User-defined nodes
    └── {node_type}/
        ├── definition.ts
        ├── ui.tsx
        └── executor.ts
```

### Implementation

#### Node Registry (`client/src/lib/nodeRegistry.ts`)

```typescript
/**
 * Central authority for node discovery and registration
 * Uses Vite's import.meta.glob for compile-time discovery
 */
let discoveredNodes: Map<string, NodeTypeInfo> = new Map();

// Initialize registry by scanning filesystem
export async function initNodeRegistry(): Promise<void> {
  // Discover system nodes
  const systemDefinitionModules = import.meta.glob('../nodes/System/*/definition.ts', { eager: true });
  await processNodeDefinitions(systemDefinitionModules, 'System');
  
  // Discover custom nodes
  const customDefinitionModules = import.meta.glob('../nodes/Custom/*/definition.ts', { eager: true });
  await processNodeDefinitions(customDefinitionModules, 'Custom');
}

// Core functions exposed by registry
export function getAllNodeTypes(): NodeTypeInfo[]
export function getNodeInfo(nodeType: string): NodeTypeInfo | undefined
export function hasNodeType(nodeType: string): boolean
export function getNodeUIPath(nodeType: string): string
export function getNodeExecutorPath(nodeType: string): string
```

#### FlowEditor Component Integration

```typescript
// Create initial nodeTypes with fallbacks
const createNodeTypes = () => {
  const baseNodeTypes: NodeTypes = {
    loading: LoadingNode,
  };
  
  // Add all nodes from registry with DefaultNode as fallback
  getAllNodeTypes().forEach(nodeInfo => {
    baseNodeTypes[nodeInfo.id] = DefaultNode;
  });
  
  return baseNodeTypes;
};

// Dynamic component loading with React hooks
const [dynamicNodeTypes, setDynamicNodeTypes] = useState<NodeTypes>({});
const nodeTypes = useMemo(() => ({ ...baseNodeTypes, ...dynamicNodeTypes }), [dynamicNodeTypes]);

// Load components lazily when needed
const loadNodeComponent = async (type: string): Promise<void> => {
  const nodeUIPath = getNodeUIPath(type);
  const module = await import(/* @vite-ignore */ nodeUIPath);
  
  setDynamicNodeTypes(prev => ({
    ...prev,
    [type]: module.default || module.component
  }));
};
```

#### NodesPanel Component Integration

```typescript
// Use registry to populate node panel
useEffect(() => {
  const registryNodes = getAllNodeTypes().map((nodeInfo) => ({
    id: id++,
    name: nodeInfo.name,
    type: nodeInfo.id,
    description: nodeInfo.description,
    icon: resolveIcon(nodeInfo.icon),
    category: nodeInfo.category
  }));
  
  setFolderBasedNodes(registryNodes);
}, []);
```

## Event Handling System

### NodeHoverMenu Component (`client/src/components/nodes/common/NodeHoverMenu.tsx`)

```typescript
export interface NodeHoverMenuAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: (e?: React.MouseEvent) => void;  // Optional event parameter
}

// Defensive event handling with null safety
<Button
  onClick={(e) => {
    if (e) e.stopPropagation();  // Null check prevents runtime errors
    action.onClick(e);           // Pass event to handler
  }}
>
  {action.icon}
</Button>
```

### Action Creators

```typescript
// Type-safe action creators with optional event parameters
export const createSettingsAction = (onClick: (e?: React.MouseEvent) => void): NodeHoverMenuAction => ({
  id: 'settings',
  icon: <Settings className="h-4 w-4" />,
  label: 'Node Settings',
  onClick
});

export const createAddNoteAction = (onClick: (e?: React.MouseEvent) => void): NodeHoverMenuAction => ({
  id: 'add-note',
  icon: <StickyNote className="h-4 w-4" />,
  label: 'Add/Edit Note',
  onClick
});
```

## Node Implementation Guide

### Required Files

1. **definition.ts**
```typescript
const definition: NodeDefinition = {
  type: 'my_node',        // Unique identifier
  name: 'My Node',        // Display name
  description: '...',     // User-friendly description
  category: 'data',       // Organization category
  icon: FileText,         // Lucide icon component
  version: '1.0.0',
  inputs: {               // Input port definitions
    input1: { type: 'string', description: 'Primary input' }
  },
  outputs: {              // Output port definitions
    output1: { type: 'string', description: 'Processed result' }
  },
  defaultData: {}         // Default configuration
};
export default definition;
```

2. **ui.tsx**
```typescript
export const component = (props: any) => {
  // React component for node visualization
  return <DefaultNode {...props} />;
};
export default component;
```

3. **executor.ts**
```typescript
export default async function execute(
  items: WorkflowItem[],
  params: Record<string, any>
): Promise<NodeExecutionData> {
  // Node runtime logic
  return {
    items: [],
    meta: { startTime: new Date(), endTime: new Date() }
  };
}
```

## Architecture Benefits

1. **Convention over Configuration**: Nodes are discovered automatically by following structural conventions
2. **Single Source of Truth**: Central registry eliminates duplicate registration
3. **Performance Optimization**: 
   - Eager discovery with lazy component loading
   - React memoization prevents unnecessary re-renders
4. **Type Safety**: TypeScript interfaces ensure consistent implementation
5. **Defensive Programming**: Null-safe event handling prevents runtime errors
6. **Developer Experience**: Adding new nodes requires no manual registration

## Key Files

- `client/src/lib/nodeRegistry.ts`: Central node type registry
- `client/src/components/flow/FlowEditor.tsx`: Workflow editor
- `client/src/components/flow/NodesPanel.tsx`: Node selection panel
- `client/src/components/nodes/common/NodeHoverMenu.tsx`: Node action menu
- `client/src/lib/nodeValidator.ts`: Node validation utility
- `server/services/workflowGenerationService.ts`: AI workflow generation