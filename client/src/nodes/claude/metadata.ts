/**
 * Claude Node Metadata
 * Defines the Claude node's properties, appearance, and behavior
 */

export const metadata = {
  type: 'claude',
  name: 'Claude API',
  description: 'Generate content with Anthropic\'s Claude AI model',
  icon: 'sparkles',
  category: 'ai',
  version: '1.0.0',
  inputs: {
    prompt: {
      type: 'string',
      description: 'Input prompt to send to Claude'
    },
    systemPrompt: {
      type: 'string',
      description: 'System instructions for Claude',
      optional: true
    }
  },
  outputs: {
    response: {
      type: 'string',
      description: 'Generated response from Claude'
    },
    metadata: {
      type: 'object',
      description: 'Additional metadata about the response'
    }
  },
  configOptions: [
    {
      key: 'model',
      type: 'select',
      description: 'Claude model to use',
      default: 'claude-3-opus-20240229',
      options: [
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
      ]
    },
    {
      key: 'temperature',
      type: 'number',
      description: 'Temperature for response generation',
      default: 0.7,
      min: 0,
      max: 1
    },
    {
      key: 'maxTokens',
      type: 'number',
      description: 'Maximum tokens to generate',
      default: 1000
    }
  ]
};

export default metadata;