/**
 * Node Registry
 * 
 * This file contains the registry for node types, facilitating discovery and loading.
 */

import { NodeRegistryEntry } from '../lib/types';

// Import all node types from their respective directories
import TextInputNode from './text_input';
import ClaudeNode from './claude';
import HttpRequestNode from './http_request';
import TextTemplateNode from './text_template';
import DataTransformNode from './data_transform';
import DecisionNode from './decision';
import FunctionNode from './function';
import JSONPathNode from './json_path';

// Node schema type
export interface NodeSchema {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  parameters: Record<string, any>;
}

// Registry of all available nodes
const registry: Record<string, NodeRegistryEntry> = {
  text_input: TextInputNode,
  claude: ClaudeNode,
  http_request: HttpRequestNode,
  text_template: TextTemplateNode,
  data_transform: DataTransformNode,
  decision: DecisionNode,
  function: FunctionNode,
  json_path: JSONPathNode,
};

/**
 * Get all registered node types
 */
export const getAllNodes = (): NodeRegistryEntry[] => {
  return Object.values(registry);
};

/**
 * Get a specific node by type
 */
export const getNode = (type: string): NodeRegistryEntry | undefined => {
  return registry[type];
};

/**
 * Get nodes grouped by category
 */
export const getNodesByCategory = (): Record<string, NodeRegistryEntry[]> => {
  const categories: Record<string, NodeRegistryEntry[]> = {};
  
  for (const node of getAllNodes()) {
    const category = node.metadata.category || 'other';
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push(node);
  }
  
  return categories;
};

/**
 * Get all available node categories
 */
export const getNodeCategories = (): string[] => {
  return Object.keys(getNodesByCategory());
};

/**
 * Get nodes in a specific category
 */
export const getNodesInCategory = (category: string): NodeRegistryEntry[] => {
  const nodesByCategory = getNodesByCategory();
  return nodesByCategory[category] || [];
};

export default registry;