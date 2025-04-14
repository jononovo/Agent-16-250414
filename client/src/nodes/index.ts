/**
 * Node System Index
 * 
 * This file exports all node-related functionality as a single module.
 * It provides the public API for accessing nodes and node registry functions.
 * 
 * Note: This is the new folder-based implementation that replaces the legacy registry.
 */

import { NodeDefinition } from './types';
import fs from 'fs'; // Not actually used at runtime - just for types

/**
 * Dynamic folder-based node system
 * 
 * Instead of using a static registry, we now dynamically load nodes
 * from their folders. This makes the system more maintainable and
 * allows for easier addition of new nodes.
 */

// These functions provide a compatibility layer with the old registry
// but implement the functionality using the folder structure.

/**
 * Dynamically import a node definition at runtime
 * (This happens in the browser, not at build time)
 */
export async function importNodeDefinition(nodeType: string): Promise<NodeDefinition | null> {
  try {
    // Dynamic import based on node type
    // Using @vite-ignore to suppress warnings about dynamic imports
    const module = await import(/* @vite-ignore */ `./${nodeType}/definition`);
    return module.default || module.nodeDefinition;
  } catch (error) {
    console.warn(`Failed to import node definition for type ${nodeType}:`, error);
    return null;
  }
}

/**
 * Get metadata for a specific node type
 */
export async function getNode(nodeType: string): Promise<any> {
  const definition = await importNodeDefinition(nodeType);
  if (!definition) return null;
  
  return {
    type: definition.type,
    name: definition.name,
    description: definition.description,
    category: definition.category,
    icon: definition.icon,
  };
}

/**
 * Get all available node types from the folder structure
 * Note: This would require server-side implementation or a static list
 * since browser JS cannot read directories
 */
export function getAllNodes(): any[] {
  // This is just a static list of the node types we know are implemented
  // In a real implementation, this would be generated from the folder structure
  return [
    { 
      type: 'text_input',
      name: 'Text Input',
      description: 'Input text into the workflow',
      category: 'ai',
      icon: 'type'
    },
    { 
      type: 'claude',
      name: 'Claude API',
      description: 'Generate content with Claude AI',
      category: 'ai', 
      icon: 'sparkles'
    },
    { 
      type: 'http_request',
      name: 'HTTP Request',
      description: 'Make HTTP requests to external APIs',
      category: 'actions',
      icon: 'globe'
    },
    { 
      type: 'data_transform',
      name: 'Data Transform',
      description: 'Transform data between nodes',
      category: 'data',
      icon: 'repeat'
    }
  ];
}

/**
 * Get available node categories
 */
export function getNodeCategories(): string[] {
  // Get unique categories from all nodes
  const nodes = getAllNodes();
  const categories = nodes.map(node => node.category);
  
  // Use Array.filter instead of Set for compatibility
  const uniqueCategories: string[] = [];
  categories.forEach(category => {
    if (uniqueCategories.indexOf(category) === -1) {
      uniqueCategories.push(category);
    }
  });
  
  return uniqueCategories;
}

/**
 * Get nodes by category
 */
export function getNodesByCategory(category: string): any[] {
  const nodes = getAllNodes();
  return nodes.filter(node => node.category === category);
}

// Default export is a compatibility object with the main functions
export default {
  getNode,
  getAllNodes,
  getNodeCategories,
  getNodesByCategory
};