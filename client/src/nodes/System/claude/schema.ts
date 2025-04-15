/**
 * Claude Node Schema
 * 
 * Defines the inputs, outputs, and parameters for the Claude AI node.
 */

import { NodeSchema } from '../types';

// Schema definition
const schema: NodeSchema = {
  // Inputs to the node
  inputs: {
    prompt: {
      type: 'string',
      description: 'The input text to send to Claude'
    }
  },
  
  // Outputs from the node
  outputs: {
    response: {
      type: 'string',
      description: 'The text response from Claude'
    },
    fullResponse: {
      type: 'object',
      description: 'The complete response object from the Claude API'
    }
  },
  
  // Parameters that can be configured
  parameters: {
    prompt: {
      type: 'string',
      description: 'The prompt to send to Claude',
      default: '',
      required: true
    },
    model: {
      type: 'string',
      description: 'The Claude model to use',
      default: 'claude-3-haiku-20240307',
      options: [
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
      ]
    },
    maxTokens: {
      type: 'number',
      description: 'Maximum tokens to generate (1-4096)',
      default: 1000
    },
    temperature: {
      type: 'number',
      description: 'Temperature for response generation (0-1)',
      default: 0.7
    },
    systemPrompt: {
      type: 'string',
      description: 'System prompt that guides Claude behavior',
      default: ''
    }
  }
};

export default schema;