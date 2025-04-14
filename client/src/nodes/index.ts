/**
 * Nodes Index
 * 
 * This file exports all available nodes in the application.
 * It re-exports everything from the registry for convenience.
 */

import { 
  nodeTypes, 
  nodeRegistry, 
  registerNode, 
  getAllCategories, 
  getNodesInCategory, 
  getNodeByType, 
  getAllNodes,
  NodeSchema,
  NodeMetadata,
  NodeExecutor,
  NodeUI,
  NodeRegistryEntry
} from './registry';

// Individual node exports
import TextInputNode from './text_input';
import ClaudeNode from './claude';
import HttpRequestNode from './http_request';

export {
  // Node registry and types
  nodeTypes,
  nodeRegistry,
  registerNode,
  getAllCategories,
  getNodesInCategory,
  getNodeByType,
  getAllNodes,
  
  // Node interfaces
  NodeSchema,
  NodeMetadata,
  NodeExecutor,
  NodeUI,
  NodeRegistryEntry,
  
  // Individual nodes
  TextInputNode,
  ClaudeNode,
  HttpRequestNode
};

// Default export includes everything
export default {
  nodeTypes,
  nodeRegistry,
  registerNode,
  getAllCategories,
  getNodesInCategory,
  getNodeByType,
  getAllNodes
};