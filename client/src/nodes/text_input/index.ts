/**
 * Text Input Node - Main Export File
 */
import UI from './ui';
import executor from './executor';
import definition from './definition';
import icon from './icon';

// Export everything from this node
export {
  UI,             // UI Component
  executor,       // Execution Logic
  definition,     // Node Definition
  icon            // Node Icon
};

// Default export for direct import
export default {
  type: definition.type,
  component: UI,
  executor,
  definition,
  icon
};