/**
 * Claude Node Schema
 * Defines the node's inputs, outputs, and properties
 */

// Schema for the Claude node
export const schema = {
  // Inputs this node can receive
  inputs: {
    prompt: {
      type: 'string',
      description: 'Input prompt to send to Claude'
    },
    systemPrompt: {
      type: 'string',
      description: 'System instructions for Claude',
      required: false
    }
  },
  
  // Outputs this node produces
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

  // Properties/configuration options for this node
  properties: {
    model: {
      type: 'string',
      enum: [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ],
      default: 'claude-3-opus-20240229',
      description: 'Claude model to use'
    },
    temperature: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      default: 0.7,
      description: 'Temperature for response generation'
    },
    maxTokens: {
      type: 'number',
      minimum: 1,
      maximum: 4096,
      default: 1000,
      description: 'Maximum tokens to generate'
    },
    apiKey: {
      type: 'string',
      description: 'API key for Claude (will use system default if empty)',
      required: false
    }
  }
};

export default schema;