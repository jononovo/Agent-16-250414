/**
 * Text Template Node Definition
 * 
 * This file defines both the metadata and schema for the Text Template node.
 */

import { NodeSchema } from '../registry';

/**
 * Node metadata - describes the node for display in the UI
 */
export const metadata = {
  name: "Text Template",
  description: "Process text templates with variable substitution",
  category: "text",
  version: "1.0.0",
  tags: ["text", "template", "formatting", "variables"],
  color: "#9C27B0"
};

/**
 * Node schema - defines inputs, outputs, and parameters
 */
export const schema: NodeSchema = {
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