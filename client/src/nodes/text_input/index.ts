/**
 * Text Input Node
 * 
 * This node provides a simple text input that can be connected to other nodes.
 * It's a fundamental building block for workflows.
 */

import { NodeRegistryEntry } from '../registry';
import metadata from './metadata.json';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { MessageSquare } from 'lucide-react';
import React from 'react';

// Text Input Node Implementation
const TextInputNode: NodeRegistryEntry = {
  type: 'text_input',
  metadata,
  schema,
  executor,
  ui: {
    component: ui.component,
    defaultData: ui.defaultData,
    validator: ui.validator
  },
  icon: React.createElement(MessageSquare, { size: 16 })
};

export default TextInputNode;