# Technical Guide: Implementing Automatic Node Discovery in the AI Agent Workflow Platform

## Problem Statement

The current architecture requires manual registration of nodes in multiple places:
1. `SYSTEM_NODE_TYPES` and `CUSTOM_NODE_TYPES` arrays in `nodeValidator.ts`
2. `NODE_TYPES` array in `NodesPanel.tsx`
3. `implementedNodeTypes` array in `NodesPanel.tsx`
4. Default node types in `FlowEditor.tsx`

This creates redundancy and requires updating multiple files when adding a new node, making the system brittle and error-prone.

## Solution Overview

Implement a unified node discovery system that automatically:
1. Discovers nodes from the filesystem based on folder structure
2. Loads their metadata and registrations
3. Makes them available to the UI without manual registration

## Detailed Implementation Instructions

### Step 1: Create a Centralized Node Registry

Create a new file `client/src/lib/nodeRegistry.ts`:

```typescript
/**
 * Node Registry - Single Source of Truth for Node Discovery
 * 
 * This module provides a centralized registry for all nodes in the system.
 * It discovers nodes dynamically from the filesystem and provides access
 * to their metadata, avoiding the need for manual registration in multiple places.
 */

import { NodeDefinition } from '../nodes/types';

// Interface for node metadata
export interface NodeTypeInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  folderPath: string; // System or Custom
}

// Storage for discovered nodes
let discoveredNodes: Map<string, NodeTypeInfo> = new Map();
let nodeDiscoveryComplete = false;

/**
 * Initialize the node registry by discovering all available nodes
 */
export async function initNodeRegistry(): Promise<void> {
  if (nodeDiscoveryComplete) return;
  
  try {
    // Discover system nodes
    const systemDefinitionModules = import.meta.glob('../nodes/System/*/definition.ts', { eager: true });
    await processNodeDefinitions(systemDefinitionModules, 'System');
    
    // Discover custom nodes
    const customDefinitionModules = import.meta.glob('../nodes/Custom/*/definition.ts', { eager: true });
    await processNodeDefinitions(customDefinitionModules, 'Custom');
    
    // Legacy node discovery (root folder)
    const rootDefinitionModules = import.meta.glob('../nodes/*/definition.ts', { eager: true });
    await processNodeDefinitions(rootDefinitionModules, 'Root');
    
    nodeDiscoveryComplete = true;
    console.log(`Node Registry initialized with ${discoveredNodes.size} nodes`);
  } catch (error) {
    console.error('Error initializing node registry:', error);
  }
}

/**
 * Process definition modules and register nodes
 */
async function processNodeDefinitions(modules: Record<string, any>, folderPath: string): Promise<void> {
  for (const path in modules) {
    try {
      const module = modules[path];
      const definition = module.default;
      
      if (!definition || !definition.type) {
        console.warn(`Skipping invalid node definition at ${path}`);
        continue;
      }
      
      // Register the node
      discoveredNodes.set(definition.type, {
        id: definition.type,
        name: definition.name || definition.type,
        description: definition.description || '',
        category: definition.category || 'custom',
        icon: definition.icon || null,
        folderPath
      });
    } catch (error) {
      console.error(`Error processing node definition at ${path}:`, error);
    }
  }
}

/**
 * Get all discovered node types
 */
export function getAllNodeTypes(): NodeTypeInfo[] {
  return Array.from(discoveredNodes.values());
}

/**
 * Get node info by type
 */
export function getNodeInfo(nodeType: string): NodeTypeInfo | undefined {
  return discoveredNodes.get(nodeType);
}

/**
 * Check if a node type exists
 */
export function hasNodeType(nodeType: string): boolean {
  return discoveredNodes.has(nodeType);
}

/**
 * Get path to node UI component
 */
export function getNodeUIPath(nodeType: string): string {
  const info = discoveredNodes.get(nodeType);
  if (!info) return '';
  
  return `../nodes/${info.folderPath}/${nodeType}/ui`;
}

/**
 * Get path to node executor
 */
export function getNodeExecutorPath(nodeType: string): string {
  const info = discoveredNodes.get(nodeType);
  if (!info) return '';
  
  return `../nodes/${info.folderPath}/${nodeType}/executor`;
}

// Initialize registry when module is loaded
initNodeRegistry();
```

### Step 2: Modify NodeValidator.ts

Replace static arrays with the registry in `client/src/lib/nodeValidator.ts`:

```typescript
import { NodeDefinition, PortDefinition } from '../nodes/types';
import { hasNodeType, getNodeInfo, getAllNodeTypes } from './nodeRegistry';

// Required fields for node definitions
const REQUIRED_NODE_FIELDS = [
  'type',
  'name',
  'description',
  'category',
  'version',
  'inputs',
  'outputs',
  'defaultData'
];

// Required fields for port definitions
const REQUIRED_PORT_FIELDS = [
  'type',
  'description'
];

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a node definition
 */
export function validateNode(node: Partial<NodeDefinition>): ValidationResult {
  // [existing validation logic]
}

/**
 * Gets the path to a node's executor
 * Uses the node registry to find the path
 */
export function getNodeExecutorPath(nodeType: string): string {
  // Use the registry to get the path
  return getNodeExecutorPath(nodeType);
}

/**
 * Gets the path to a node's definition
 * Uses the node registry to find the path
 */
export function getNodeDefinitionPath(nodeType: string): string {
  const info = getNodeInfo(nodeType);
  if (!info) {
    console.warn(`Could not find node type "${nodeType}" in registry`);
    return `../nodes/System/${nodeType}/definition`;
  }
  
  return `../nodes/${info.folderPath}/${nodeType}/definition`;
}

/**
 * Check if a node type is implemented
 */
export function isNodeTypeImplemented(nodeType: string): boolean {
  return hasNodeType(nodeType);
}
```

### Step 3: Update NodesPanel.tsx

Modify `client/src/components/flow/NodesPanel.tsx` to use the registry:

```typescript
import { useState, useEffect } from 'react';
import { Node } from '@shared/schema';
import { getAllNodeTypes } from '@/lib/nodeRegistry';
// [other imports]

const NodesPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [folderBasedNodes, setFolderBasedNodes] = useState<Node[]>([]);
  
  // Load nodes from the registry
  useEffect(() => {
    // Create nodes from the registry
    const registryNodes = getAllNodeTypes().map((nodeInfo, index) => {
      return {
        id: 1000 + index,
        name: nodeInfo.name,
        type: nodeInfo.id,
        description: nodeInfo.description,
        icon: nodeInfo.icon,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
        category: nodeInfo.category,
        configuration: {}
      } as Node;
    });
    
    setFolderBasedNodes(registryNodes);
  }, []);
  
  // [rest of the component]
};

export default NodesPanel;
```

### Step 4: Update FlowEditor.tsx

Modify `client/src/components/flow/FlowEditor.tsx` to use the registry for node loading:

```typescript
import { getAllNodeTypes, getNodeUIPath } from '@/lib/nodeRegistry';
// [other imports]

// Create initial nodeTypes with fallbacks
const createNodeTypes = () => {
  const baseNodeTypes: NodeTypes = {
    // Special loading node type
    loading: LoadingNode,
  };
  
  // Add all nodes from registry with DefaultNode as fallback
  getAllNodeTypes().forEach(nodeInfo => {
    baseNodeTypes[nodeInfo.id] = DefaultNode;
  });
  
  return baseNodeTypes;
};

// Helper function to load node components for a specific type
const loadNodeComponent = async (type: string): Promise<void> => {
  // Skip if this node type is already loaded or being loaded
  if (loadedNodeTypes[type]) return;
  
  console.log(`Loading component for node type: ${type}`);
  
  // Mark as being loaded to prevent duplicate loading attempts
  setLoadedNodeTypes(prev => ({ ...prev, [type]: true }));
  
  try {
    // Use registry to determine the path
    const nodeUIPath = getNodeUIPath(type);
    if (!nodeUIPath) {
      console.warn(`No UI path found for node type: ${type}`);
      return;
    }
    
    // Load the component dynamically
    const module = await import(/* @vite-ignore */ nodeUIPath);
    if (module && (module.default || module.component)) {
      // Update the nodeTypes with the loaded component
      setDynamicNodeTypes(prev => ({
        ...prev,
        [type]: module.default || module.component
      }));
      console.log(`Successfully loaded component for ${type}`);
    }
  } catch (error) {
    console.warn(`Failed to load component for ${type}:`, error);
  }
};
```

### Step 5: Create a Node Registration Guide

Create a developer guide in `/client/src/nodes/README.md`:

```markdown
# Node Development Guide

This document explains how to create new nodes for the workflow platform.

## Node Structure

A node consists of three main files:
1. **definition.ts** - Contains metadata and interface definition
2. **ui.tsx** - Defines the visual representation
3. **executor.ts** - Contains the runtime logic

### Required Folder Structure

```
nodes/
├── System/          # System nodes (core functionality)
│   └── my_node/
│       ├── definition.ts
│       ├── ui.tsx
│       └── executor.ts
└── Custom/          # Custom nodes (user-created)
    └── another_node/
        ├── definition.ts
        ├── ui.tsx
        └── executor.ts
```

## Creating a New Node

1. Create a folder for your node in either System/ or Custom/ directory
2. Create the required files:

### definition.ts
```typescript
import { NodeDefinition } from '../../types';
import { FileText } from 'lucide-react';

const definition: NodeDefinition = {
  type: 'my_custom_node', // Unique identifier (used in code)
  name: 'My Custom Node', // Display name
  description: 'Does something amazing',
  category: 'data', // One of: ai, data, input, actions, triggers, etc.
  icon: FileText, // Lucide icon
  version: '1.0.0',
  inputs: {
    input1: {
      type: 'string',
      description: 'Primary input'
    }
  },
  outputs: {
    output1: {
      type: 'string',
      description: 'Primary output'
    }
  },
  defaultData: {
    // Default configuration
  }
};

export default definition;
```

### ui.tsx
```typescript
import React from 'react';
import { Handle, Position } from 'reactflow';
import DefaultNode from '@/nodes/Default/ui';

export const component = (props: any) => {
  const { data, id, selected, type } = props;
  
  // Your custom UI logic here
  
  // Use DefaultNode for consistent styling
  return (
    <DefaultNode
      id={id}
      type={type}
      data={{
        ...data,
        // Additional props
      }}
      selected={selected}
      dragHandle={''}
      zIndex={0}
      isConnectable={true}
      xPos={0}
      yPos={0}
    />
  );
};

export default component;
```

### executor.ts
```typescript
import { NodeExecutionData, WorkflowItem } from '../../../shared/nodeTypes';

export default async function execute(
  items: WorkflowItem[],
  params: Record<string, any>
): Promise<NodeExecutionData> {
  try {
    // Node execution logic here
    
    return {
      items: [], // Processed items
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        // Additional metadata
      }
    };
  } catch (error) {
    // Error handling
    return {
      items: [],
      meta: {
        error: true,
        errorMessage: error.message,
        startTime: new Date(),
        endTime: new Date(),
      }
    };
  }
}
```

## That's it!

No manual registration is required. The system will automatically discover and register your node. If your node follows the structure above and passes validation, it will appear in the node panel in the workflow editor.
```

## Why This Approach Works

This solution solves multiple problems:

1. **Single Source of Truth**: The node registry becomes the central authority for node information
2. **Automatic Discovery**: Nodes are automatically discovered based on filesystem structure
3. **Reduced Redundancy**: No need to update multiple lists when adding/removing nodes
4. **Improved Developer Experience**: Just create a node in the right folder with the right files, and it appears
5. **Better Maintainability**: The system is more resilient to changes since it's based on convention rather than configuration

## Implementation Notes

1. This approach uses Vite's `import.meta.glob` for dynamic file discovery, which works at build time
2. The node registry is initialized eagerly when imported, ensuring nodes are discovered before they're needed
3. UI components are loaded lazily when needed, improving performance
4. The DefaultNode is used as a fallback while specialized components are loading

By adopting this pattern, you'll create a more maintainable and developer-friendly system that follows the principle of "convention over configuration," making it easier to extend with new nodes without manual registration steps.