/**
 * Text Input Node Schema
 * 
 * Defines the inputs, outputs, and parameters for the text input node.
 */

import { NodeSchema } from '../types';

// Schema definition
const schema: NodeSchema = {
  // This node has no inputs as it's typically a starting point
  inputs: {},
  
  // It outputs a text string
  outputs: {
    text: {
      type: 'string',
      description: 'The text entered by the user'
    }
  },
  
  // Parameters that can be configured
  parameters: {
    inputText: {
      type: 'string',
      description: 'The input text',
      default: '',
      required: true
    },
    label: {
      type: 'string',
      description: 'A label for the input field',
      default: 'Input Text'
    },
    placeholder: {
      type: 'string',
      description: 'Placeholder text when empty',
      default: 'Enter text here...'
    }
  }
};

export default schema;