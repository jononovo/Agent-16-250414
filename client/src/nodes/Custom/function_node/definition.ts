/**
 * Function Node Definition
 * 
 * This definition file provides the metadata required for validating
 * and properly registering the function_node in the system.
 */

import { NodeDefinition } from '../../types';

const definition: NodeDefinition = {
  type: 'function_node',
  name: 'Function',
  description: 'Custom JavaScript function that transforms data',
  category: 'code',
  version: '1.0.0',
  inputs: {
    input: {
      type: 'any',
      description: 'Input data to process'
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'Processed output data'
    }
  },
  defaultData: {
    label: 'Function',
    description: 'Custom JavaScript function',
    code: 'function process(input) {\n  // Your code here\n  return input;\n}'
  },
  icon: 'code'
};

export default definition;