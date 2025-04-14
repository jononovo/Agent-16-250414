/**
 * Node Registry Client
 * 
 * This file provides access to the node registry from the frontend application.
 * It allows other parts of the application to get node information and components.
 */

import { nodeRegistry, nodeTypes, getNode, getNodesByCategory, getNodeCategories } from '../nodes/registry';
import { NodeRegistryEntry } from '../nodes/registry';

/**
 * Get all registered node types for use in ReactFlow
 */
export function getReactFlowNodeTypes() {
  return nodeTypes;
}

/**
 * Get a node by its type
 */
export function getNodeByType(type: string): NodeRegistryEntry | undefined {
  return getNode(type);
}

/**
 * Get all nodes in a specific category
 */
export function getNodesInCategory(category: string): NodeRegistryEntry[] {
  return getNodesByCategory(category);
}

/**
 * Get all available node categories
 */
export function getAllCategories(): string[] {
  return getNodeCategories();
}

/**
 * Get all registered nodes
 */
export function getAllNodes(): NodeRegistryEntry[] {
  return Object.values(nodeRegistry);
}

/**
 * Creates a new node instance data with default properties
 */
export function createNodeInstance(type: string) {
  const nodeType = getNodeByType(type);
  
  if (!nodeType) {
    throw new Error(`Node type not found: ${type}`);
  }
  
  // Create default data from the node's schema
  const defaultData: Record<string, any> = {
    type,
    label: nodeType.metadata.name
  };
  
  // Add default values for all properties from schema
  if (nodeType.schema.properties) {
    for (const [key, prop] of Object.entries(nodeType.schema.properties)) {
      if ('default' in prop) {
        defaultData[key] = prop.default;
      }
    }
  }
  
  return defaultData;
}

export default {
  getReactFlowNodeTypes,
  getNodeByType,
  getNodesInCategory,
  getAllCategories,
  getAllNodes,
  createNodeInstance
};