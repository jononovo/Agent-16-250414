/**
 * Text Prompt Node Schema
 * 
 * Defines the inputs, outputs, and parameters for the text prompt node.
 */

import { NodeSchema } from '../types';

// Schema definition
const schema: NodeSchema = {
  // This node has dynamic inputs that will be created by the user
  inputs: {
    // Can be extended dynamically at runtime
  },
  
  // It outputs the processed prompt text
  outputs: {
    output: {
      type: 'string',
      description: 'The processed prompt text'
    }
  },
  
  // Parameters that can be configured
  parameters: {
    prompt: {
      type: 'string',
      description: 'The prompt template text',
      default: '',
      required: true
    },
    label: {
      type: 'string',
      description: 'A label for the prompt',
      default: 'Text Prompt'
    },
    description: {
      type: 'string',
      description: 'Description of what this prompt does',
      default: 'Enter your prompt text here'
    }
  }
};

export default schema;