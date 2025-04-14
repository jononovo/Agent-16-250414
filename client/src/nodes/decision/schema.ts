/**
 * Decision Node Schema
 * 
 * This file defines the inputs, outputs, and parameters for the decision node.
 */

import { NodeSchema } from '../registry';

const schema: NodeSchema = {
  inputs: {
    data: {
      type: 'object',
      description: 'Input data to evaluate conditions against'
    }
  },
  outputs: {
    true: {
      type: 'object',
      description: 'Output when condition evaluates to true'
    },
    false: {
      type: 'object',
      description: 'Output when condition evaluates to false'
    },
    error: {
      type: 'string',
      description: 'Error message if condition evaluation failed'
    }
  },
  parameters: {
    condition: {
      type: 'string',
      description: 'JavaScript expression that evaluates to true or false',
      default: 'data.value > 10'
    },
    trueData: {
      type: 'object',
      description: 'Data to pass when condition is true',
      default: {}
    },
    falseData: {
      type: 'object',
      description: 'Data to pass when condition is false',
      default: {}
    }
  }
};

export default schema;