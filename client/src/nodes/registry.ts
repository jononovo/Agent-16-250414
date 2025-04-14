/**
 * Node Registry
 * 
 * This file defines the node registry system that manages all available nodes
 * in the application. It provides functions to register, retrieve, and manage nodes.
 */

// Import specific node implementations
import TextInputNode from './text_input';
import ClaudeNode from './claude';
import HttpRequestNode from './http_request';

// Node registry interfaces
export interface NodeSchema {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  parameters: Record<string, any>;
}

export interface NodeMetadata {
  name: string;
  description: string;
  category: string;
  version: string;
  icon?: string;
  color?: string;
  tags?: string[];
}

export interface NodeExecutor {
  execute: (nodeData: any, inputs?: any) => Promise<any>;
}

export interface NodeUI {
  component: any; // React component
  defaultData?: any;
  validator?: (data: any) => { valid: boolean; errors?: string[] };
}

export interface NodeRegistryEntry {
  type: string;
  metadata: NodeMetadata;
  schema: NodeSchema;
  executor: NodeExecutor;
  ui: NodeUI;
  icon?: any;
}

// Internal node registry storage
const registry: Record<string, NodeRegistryEntry> = {};

/**
 * Register a node with the registry
 * 
 * @param nodeType The unique type identifier for the node
 * @param node The node implementation
 */
export function registerNode(nodeType: string, node: NodeRegistryEntry): void {
  if (registry[nodeType]) {
    console.warn(`Node type '${nodeType}' is already registered. Overwriting...`);
  }
  
  registry[nodeType] = node;
  console.log(`Registered node: ${nodeType} (${node.metadata.name})`);
}

/**
 * Get all node types for use with ReactFlow
 */
export function nodeTypes(): Record<string, any> {
  return Object.entries(registry).reduce((acc, [type, node]) => {
    if (node.ui && node.ui.component) {
      acc[type] = node.ui.component;
    }
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Get the node registry (all registered nodes)
 */
export function nodeRegistry(): Record<string, NodeRegistryEntry> {
  return { ...registry };
}

/**
 * Get all categories of registered nodes
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  
  Object.values(registry).forEach(node => {
    if (node.metadata && node.metadata.category) {
      categories.add(node.metadata.category);
    }
  });
  
  return Array.from(categories).sort();
}

/**
 * Get all nodes in a specific category
 */
export function getNodesInCategory(category: string): NodeRegistryEntry[] {
  return Object.values(registry)
    .filter(node => node.metadata && node.metadata.category === category)
    .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
}

/**
 * Get a node by its type
 */
export function getNodeByType(type: string): NodeRegistryEntry | undefined {
  return registry[type];
}

/**
 * Get all registered nodes
 */
export function getAllNodes(): NodeRegistryEntry[] {
  return Object.values(registry);
}

// Register all built-in nodes
function registerBuiltInNodes() {
  // Text input node
  registerNode('text_input', TextInputNode);
  
  // Claude node
  registerNode('claude', ClaudeNode);
  
  // HTTP request node
  registerNode('http_request', HttpRequestNode);
  
  // More nodes will be registered here as they are implemented
}

// Initialize the registry with built-in nodes
registerBuiltInNodes();