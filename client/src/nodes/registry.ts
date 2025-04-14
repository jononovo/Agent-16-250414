/**
 * Node Registry
 * 
 * Manages registration and discovery of all available nodes in the application.
 * This centralizes node type information for both the UI components and executors.
 */
import { ReactNode } from 'react';
import { NodeProps } from 'reactflow';
import { NodeExecutionData } from '../lib/types/workflow';

// Node types for ReactFlow
export const nodeTypes: Record<string, React.ComponentType<NodeProps>> = {};

// Node registry containing metadata, executors, etc.
export interface NodeRegistryEntry {
  type: string;
  component: React.ComponentType<NodeProps>;
  executor: {
    execute: (nodeData: any, inputs: Record<string, NodeExecutionData>) => Promise<NodeExecutionData>;
  };
  schema: {
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    properties: Record<string, any>;
  };
  metadata: {
    name: string;
    description: string;
    category: string;
    icon: string;
    version: string;
    [key: string]: any;
  };
  icon: ReactNode | string;
}

// The registry storing all node information
export const nodeRegistry: Record<string, NodeRegistryEntry> = {};

/**
 * Register a node in the registry
 * 
 * @param nodeEntry The node entry to register
 */
export function registerNode(nodeEntry: NodeRegistryEntry): void {
  const { type, component } = nodeEntry;
  
  if (!type) {
    console.error('Cannot register node without a type');
    return;
  }
  
  // Register the React component for ReactFlow
  nodeTypes[type] = component;
  
  // Add to the registry
  nodeRegistry[type] = nodeEntry;
  
  console.log(`Node registered: ${type}`);
}

// Function to get node by type
export function getNode(type: string): NodeRegistryEntry | undefined {
  return nodeRegistry[type];
}

// Function to get nodes by category
export function getNodesByCategory(category: string): NodeRegistryEntry[] {
  return Object.values(nodeRegistry).filter(
    node => node.metadata.category.toLowerCase() === category.toLowerCase()
  );
}

// Function to get all available categories
export function getNodeCategories(): string[] {
  const categories = new Set<string>();
  
  Object.values(nodeRegistry).forEach(node => {
    if (node.metadata.category) {
      categories.add(node.metadata.category);
    }
  });
  
  return Array.from(categories);
}

// Import and register all nodes
// In a production environment, this would be done with a build step
// that automatically imports all node folders

// Import the text_input node
import textInputNode from './text_input';
// Import the claude node
import claudeNode from './claude';

// Convert node exports to registry entries and register them
registerNode({
  type: textInputNode.type,
  component: textInputNode.component,
  executor: textInputNode.executor,
  schema: textInputNode.schema,
  metadata: textInputNode.metadata,
  icon: textInputNode.icon
});

registerNode({
  type: claudeNode.type,
  component: claudeNode.component,
  executor: claudeNode.executor,
  schema: claudeNode.schema,
  metadata: claudeNode.metadata,
  icon: claudeNode.icon
});

// The long-term goal is to make registration automatic with a build step
// that scans the directory for node folders. This could be implemented using
// a Vite plugin or similar for automatic node discovery.

// Export for easy consumption
export default {
  nodeTypes,
  nodeRegistry,
  registerNode,
  getNode,
  getNodesByCategory,
  getNodeCategories
};