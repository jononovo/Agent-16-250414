/**
 * Claude API Node Schema
 * 
 * This file defines the zod schema for validating node data.
 */

import { NodeSchema } from '../../../lib/types';

const schema: NodeSchema = {
  inputs: {
    input: {
      type: 'string',
      description: 'The prompt text to send to Claude'
    }
  },
  outputs: {
    output: {
      type: 'string',
      description: 'The generated text response from Claude'
    }
  },
  parameters: {
    model: {
      type: 'string',
      description: 'Claude model to use for generation',
      default: 'claude-3-sonnet-20240229'
    },
    temperature: {
      type: 'number',
      description: 'Controls randomness of the output (higher = more random)',
      default: 0.7
    },
    maxTokens: {
      type: 'number',
      description: 'Maximum number of tokens to generate',
      default: 2000
    },
    systemPrompt: {
      type: 'string',
      description: 'Optional system instructions for Claude',
      default: ''
    },
    apiKey: {
      type: 'string',
      description: 'Your Anthropic API key (leave empty to use environment variable)',
      default: ''
    }
  }
};

export default schema;