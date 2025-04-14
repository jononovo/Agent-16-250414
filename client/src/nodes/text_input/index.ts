/**
 * Text Input Node - Main Export File
 */
import UIComponent from './ui';
import executor from './executor';
import schema from './schema';
// Import metadata from JSON
import metadata from './metadata.json';
// For SVG imports, we can use URL import
import iconUrl from './icon.svg';

// Node type from metadata
const TYPE = metadata.type;

// Export individual pieces
export {
  UIComponent,    // UI Component
  executor,       // Execution Logic
  schema,         // Node Schema
  metadata,       // Node Metadata
  iconUrl         // Node Icon URL
};

// Create the node definition object that follows the registry structure
const textInputNode = {
  type: TYPE,
  component: UIComponent,
  executor,
  schema,
  metadata,
  icon: metadata.icon // Using the icon name from metadata for Lucide icons
};

// Default export for direct import and registration
export default textInputNode;