/**
 * Node System Index
 * 
 * This file exports all node-related functionality as a single module.
 * It provides the public API for accessing nodes and node registry functions.
 */

// Export registry functions
export { 
  getNode,
  getAllNodes,
  getNodeCategories,
  getNodesByCategory
} from './registry';

// Export default registry
export { default } from './registry';