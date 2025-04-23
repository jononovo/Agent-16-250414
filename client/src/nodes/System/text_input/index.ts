/**
 * Text Input Node
 * 
 * This node provides a simple text input that can be connected to other nodes.
 * It's a fundamental building block for workflows.
 */

import { NodeRegistryEntry } from '../../../lib/types';
import definition from './definition';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { MessageSquare } from 'lucide-react';
import React from 'react';

// Ensure the definition complies with NodeMetadata interface
const metadata = {
  name: definition.name,
  description: definition.description,
  category: definition.category,
  version: definition.version
  // Add other optional fields if needed
};

// Text Input Node Implementation
const TextInputNode: NodeRegistryEntry = {
  type: 'text_input',
  metadata,
  schema,
  executor: {
    execute: executor.execute,
    defaultData: ui.defaultData // Move defaultData from UI to executor as per interface
  },
  ui: ui.component,
  validator: ui.validator,
  icon: React.createElement(MessageSquare, { size: 16 })
};

// Export the component directly for the dynamic loader
export const component = ui.component;

export default TextInputNode;