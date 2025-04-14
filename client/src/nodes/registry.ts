/**
 * Node Registry
 * 
 * This file is responsible for registering and managing all available node types.
 * It provides functions to access nodes by type, category, etc.
 */

import { NodeRegistryEntry } from '../lib/types';
import textInputNode from './text_input';
import claudeNode from './claude';
import httpRequestNode from './http_request';
import textTemplateNode from './text_template';
import dataTransformNode from './data_transform';
import decisionNode from './decision';
import functionNode from './function';
import jsonPathNode from './json_path';

// Register all available nodes
const registeredNodes: NodeRegistryEntry[] = [
  textInputNode,
  claudeNode,
  httpRequestNode,
  textTemplateNode,
  dataTransformNode,
  decisionNode,
  functionNode,
  jsonPathNode
];

// Create a mapping of node types to registry entries
const nodeRegistry: Record<string, NodeRegistryEntry> = {};
registeredNodes.forEach(node => {
  nodeRegistry[node.type] = node;
});

/**
 * Get a node registry entry by its type
 */
export function getNode(type: string): NodeRegistryEntry | undefined {
  return nodeRegistry[type];
}

/**
 * Get all registered nodes
 */
export function getAllNodes(): NodeRegistryEntry[] {
  return registeredNodes;
}

/**
 * Get all available node categories
 */
export function getNodeCategories(): string[] {
  const categories = new Set<string>();
  
  registeredNodes.forEach(node => {
    if (node.metadata.category) {
      categories.add(node.metadata.category);
    }
  });
  
  return Array.from(categories);
}

/**
 * Get nodes by category
 */
export function getNodesByCategory(): Record<string, NodeRegistryEntry[]> {
  const categorizedNodes: Record<string, NodeRegistryEntry[]> = {};
  
  // Initialize categories
  getNodeCategories().forEach(category => {
    categorizedNodes[category] = [];
  });
  
  // Group nodes by category
  registeredNodes.forEach(node => {
    if (node.metadata.category) {
      if (!categorizedNodes[node.metadata.category]) {
        categorizedNodes[node.metadata.category] = [];
      }
      
      categorizedNodes[node.metadata.category].push(node);
    }
  });
  
  return categorizedNodes;
}

export default {
  getNode,
  getAllNodes,
  getNodeCategories,
  getNodesByCategory
};