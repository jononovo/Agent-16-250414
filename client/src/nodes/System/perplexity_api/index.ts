/**
 * Perplexity API Node
 * 
 * This node provides integration with the Perplexity AI API for text generation.
 */

import { NodeRegistryEntry } from '../../../lib/types';
import { definition } from './definition';
import * as executor from './executor';
import * as ui from './ui';
import { Brain } from 'lucide-react';
import React from 'react';

// Ensure the definition complies with NodeMetadata interface
const metadata = {
  name: definition.name,
  description: definition.description,
  category: definition.category,
  version: definition.version
};

// Create a wrapper for the execute function that handles the interface differences
const executeWrapper = (data: any, inputs?: Record<string, any>) => {
  return executor.execute(data, inputs || {});
};

// Perplexity API Node Implementation
const PerplexityApiNode: NodeRegistryEntry = {
  type: 'perplexity_api',
  metadata,
  schema: definition,
  executor: {
    execute: executeWrapper,
    defaultData: executor.defaultData
  },
  ui: ui.component as React.FC<any>, // Cast to expected type
  validator: ui.validator,
  icon: React.createElement(Brain, { size: 16 })
};

export default PerplexityApiNode;