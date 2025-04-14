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
  
  // Register the React component for ReactFlow
  nodeTypes[type] = component;
  
  // Add to the registry
  nodeRegistry[type] = nodeEntry;
  
  console.log(`Node registered: ${type}`);
}

// Import and register all nodes
// This will be populated automatically with dynamic imports
// for each node in the nodes directory

// Import the text_input node
import textInputNode from './text_input';
registerNode(textInputNode as NodeRegistryEntry);

// Other node imports will be added here
// The long-term goal is to make this automatic with a build step
// that scans the directory for node folders

// Export for easy consumption
export default {
  nodeTypes,
  nodeRegistry,
  registerNode
};