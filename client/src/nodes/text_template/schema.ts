/**
 * Text Template Node Schema
 * 
 * This file defines the inputs, outputs, and parameters for the text template node.
 */

import { NodeSchema } from '../registry';

const schema: NodeSchema = {
  inputs: {
    variables: {
      type: 'object',
      description: 'Variables to use in the template'
    }
  },
  outputs: {
    text: {
      type: 'string',
      description: 'The processed text with variables replaced'
    },
    error: {
      type: 'string',
      description: 'Error message if template processing failed'
    }
  },
  parameters: {
    template: {
      type: 'string',
      description: 'The text template with {{variable}} placeholders',
      default: 'Hello, {{name}}!'
    },
    escapeHTML: {
      type: 'boolean',
      description: 'Whether to escape HTML in the variables',
      default: false
    },
    fallbackValue: {
      type: 'string',
      description: 'Value to use when a variable is not found',
      default: ''
    }
  }
};

export default schema;