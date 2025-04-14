/**
 * Claude AI Node
 * 
 * This node provides integration with the Claude AI API for text generation.
 */

import { NodeRegistryEntry } from '../../lib/types';
import metadata from './metadata.json';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { Sparkles } from 'lucide-react';
import React from 'react';

// Claude Node Implementation
const ClaudeNode: NodeRegistryEntry = {
  type: 'claude',
  metadata,
  schema,
  executor,
  ui: {
    component: ui.component,
    defaultData: ui.defaultData,
    validator: ui.validator
  },
  icon: React.createElement(Sparkles, { size: 16 })
};

export default ClaudeNode;