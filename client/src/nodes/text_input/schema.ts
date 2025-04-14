/**
 * Text Input Node Schema
 * Defines the node's inputs, outputs, and properties
 */

// Schema for the text input node
export const schema = {
  // Inputs this node can receive
  inputs: {},
  
  // Outputs this node produces
  outputs: {
    text: {
      type: 'string',
      description: 'The input text'
    }
  },

  // Properties/configuration options for this node
  properties: {
    placeholder: {
      type: 'string',
      default: 'Enter your text here...',
      description: 'Placeholder text to display in the input field'
    },
    defaultValue: {
      type: 'string',
      default: '',
      description: 'Default text to pre-fill in the input field'
    },
    label: {
      type: 'string',
      default: 'Text Input',
      description: 'Label to display for this node'
    },
    required: {
      type: 'boolean',
      default: false,
      description: 'Whether input is required'
    }
  }
};

export default schema;