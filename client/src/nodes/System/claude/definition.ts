/**
 * Claude API Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../../types';

const definition: NodeDefinition = {
  type: 'claude',
  name: 'Claude API',
  description: 'Generates text using the Claude AI model',
  icon: 'sparkles',
  category: 'ai',
  version: '1.0.0',
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
  configOptions: [
    {
      key: 'model',
      type: 'select',
      default: 'claude-3-sonnet-20240229',
      options: [
        { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
        { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
        { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' }
      ],
      description: 'Claude model to use for generation'
    },
    {
      key: 'temperature',
      type: 'range',
      default: 0.7,
      min: 0,
      max: 1,
      step: 0.1,
      description: 'Controls randomness of the output (higher = more random)'
    },
    {
      key: 'maxTokens',
      type: 'number',
      default: 2000,
      min: 1,
      max: 100000,
      description: 'Maximum number of tokens to generate'
    },
    {
      key: 'systemPrompt',
      type: 'textarea',
      default: '',
      description: 'Optional system instructions for Claude'
    },
    {
      key: 'apiKey',
      type: 'password',
      default: '',
      description: 'Your Anthropic API key (leave empty to use environment variable)'
    }
  ],
  defaultData: {
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: '',
    apiKey: ''
  }
};

export default definition;