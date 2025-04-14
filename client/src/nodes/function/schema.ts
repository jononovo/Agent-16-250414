/**
 * Function Node Schema
 * 
 * This file defines the inputs, outputs, and parameters for the function node.
 */

import { NodeSchema } from '../registry';

const schema: NodeSchema = {
  inputs: {
    data: {
      type: 'object',
      description: 'Input data to be processed by the function'
    }
  },
  outputs: {
    result: {
      type: 'object',
      description: 'The result returned by the function'
    },
    error: {
      type: 'string',
      description: 'Error message if the function execution failed'
    }
  },
  parameters: {
    code: {
      type: 'string',
      description: 'JavaScript code to execute',
      default: 'function process(data) {\n  // Your code here\n  return data;\n}\n\nreturn process(inputs.data);'
    },
    timeout: {
      type: 'number',
      description: 'Maximum execution time in milliseconds',
      default: 5000
    }
  }
};

export default schema;