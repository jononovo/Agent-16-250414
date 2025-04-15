/**
 * Text Input Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../types';

export const definition: NodeDefinition = {
  type: 'text_input',
  name: 'Text Input',
  description: 'Captures text input for use in workflows',
  icon: 'type',
  category: 'input',
  version: '1.0.0',
  inputs: {},
  outputs: {
    text: {
      type: 'string',
      description: 'The input text'
    }
  },
  configOptions: [
    {
      key: 'placeholder',
      type: 'string',
      default: 'Enter your text here...',
      description: 'Placeholder text to display in the input field'
    },
    {
      key: 'defaultValue',
      type: 'string',
      default: '',
      description: 'Default text to pre-fill in the input field'
    }
  ],
  defaultData: {
    placeholder: 'Enter your text here...',
    defaultValue: ''
  }
};

export default definition;