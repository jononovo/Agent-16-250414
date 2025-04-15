/**
 * Text Prompt Node
 * 
 * This node provides a customizable text prompt with dynamic input support.
 * It's designed to connect well with the Claude AI and other LLM nodes.
 */

import { NodeRegistryEntry } from '../../lib/types';
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
};

// Text Prompt Node Implementation
const TextPromptNode: NodeRegistryEntry = {
  type: 'text_prompt',
  metadata,
  schema,
  executor: {
    execute: executor.execute,
    defaultData: definition.defaultData
  },
  ui: ui.component,
  icon: React.createElement(MessageSquare, { size: 16 })
};

export default TextPromptNode;