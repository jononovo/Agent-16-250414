/**
 * Nodes Exporter
 * 
 * This file exports all available nodes for use throughout the application.
 */

import registry, { 
  getAllNodes, 
  getNode, 
  getNodesByCategory, 
  getNodeCategories,
  getNodesInCategory 
} from './registry';

// Export individual nodes by name
export { default as TextInputNode } from './text_input';
export { default as ClaudeNode } from './claude';
export { default as HttpRequestNode } from './http_request';
export { default as TextTemplateNode } from './text_template';
export { default as DataTransformNode } from './data_transform';
export { default as DecisionNode } from './decision';
export { default as FunctionNode } from './function';
export { default as JSONPathNode } from './json_path';

// Export registry and helper functions
export {
  getAllNodes,
  getNode,
  getNodesByCategory,
  getNodeCategories,
  getNodesInCategory,
};

// Export the full registry as default
export default registry;