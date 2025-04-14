/**
 * Text Input Node - Main Export File
 */
import TextInputNode from './TextInputNode';
import executor from './executor';
import metadata from './metadata';

// Export everything from this node
export {
  TextInputNode,  // UI Component
  executor,       // Execution Logic
  metadata        // Node Definition
};

// Default export for direct import
export default {
  component: TextInputNode,
  executor,
  metadata
};