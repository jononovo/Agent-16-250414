/**
 * Data Transform Node Definition
 * 
 * This file defines both the metadata and schema for the Data Transform node.
 */

import { NodeSchema } from '../registry';

/**
 * Node metadata - describes the node for display in the UI
 */
export const metadata = {
  name: "Data Transform",
  description: "Transform data using mapping expressions and operations",
  category: "data",
  version: "1.0.0",
  tags: ["data", "transform", "map", "filter"],
  color: "#FF5722"
};

/**
 * Node schema - defines inputs, outputs, and parameters
 */
export const schema: NodeSchema = {
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