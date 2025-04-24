/**
 * Perplexity API Node Definition
 * 
 * This node provides integration with the Perplexity AI API for text generation.
 */

import { NodeDefinition } from '@/nodes/types';
import { defaultData } from './executor';

export const definition: NodeDefinition = {
  type: 'perplexity_api',
  name: 'Perplexity API',
  description: 'Generate text using Perplexity\'s AI models',
  icon: 'brain',
  category: 'ai',
  version: '1.0.0',
  inputs: {
    prompt: {
      type: 'string',
      description: 'Text prompt to send to Perplexity'
    },
    system: {
      type: 'string',
      description: 'System instructions (optional)',
      optional: true
    }
  },
  outputs: {
    response: {
      type: 'string',
      description: 'Generated text response'
    },
    metadata: {
      type: 'object',
      description: 'Response metadata like tokens used',
      optional: true
    }
  },
  // Add defaultData property required by the validator
  defaultData: defaultData
};

export default definition;