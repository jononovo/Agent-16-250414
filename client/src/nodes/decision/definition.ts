/**
 * Decision Node Definition
 * 
 * This file defines both the metadata and schema for the Decision node.
 */

import { NodeSchema } from '../registry';

/**
 * Node metadata - describes the node for display in the UI
 */
export const metadata = {
  name: "Decision",
  description: "Create conditional branches based on input data",
  category: "flow",
  version: "1.0.0",
  tags: ["flow", "condition", "branch", "if-else"],
  color: "#4CAF50"
};

/**
 * Node schema - defines inputs, outputs, and parameters
 */
export const schema: NodeSchema = {
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