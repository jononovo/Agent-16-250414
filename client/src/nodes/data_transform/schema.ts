/**
 * Data Transform Node Schema
 * 
 * This file defines the inputs, outputs, and parameters for the data transform node.
 */

import { NodeSchema } from '../registry';

const schema: NodeSchema = {
  inputs: {
    data: {
      type: 'object',
      description: 'Input data to transform'
    }
  },
  outputs: {
    result: {
      type: 'object',
      description: 'The transformed data'
    },
    error: {
      type: 'string',
      description: 'Error message if transformation failed'
    }
  },
  parameters: {
    transformations: {
      type: 'array',
      description: 'List of transformations to apply',
      default: [
        { field: 'name', operation: 'map', expression: 'data.firstName + " " + data.lastName' },
        { field: 'age', operation: 'map', expression: 'data.age' }
      ]
    },
    outputTemplate: {
      type: 'object',
      description: 'Template for the output structure',
      default: {}
    }
  }
};

export default schema;