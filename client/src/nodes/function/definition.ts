/**
 * Function Node Definition
 * 
 * This file defines both the metadata and schema for the Function node.
 */

import { NodeSchema } from '../registry';

/**
 * Node metadata - describes the node for display in the UI
 */
export const metadata = {
  name: "Function",
  description: "Execute custom JavaScript functions",
  category: "code",
  version: "1.0.0",
  tags: ["code", "function", "javascript", "custom"],
  color: "#2196F3"
};

/**
 * Node schema - defines inputs, outputs, and parameters
 */
export const schema: NodeSchema = {
  inputs: {
    data: {
      type: 'object',
      description: 'Input data to process with the function'
    }
  },
  outputs: {
    result: {
      type: 'any',
      description: 'The result returned by the function'
    },
    error: {
      type: 'string',
      description: 'Error message if function execution failed'
    }
  },
  parameters: {
    functionBody: {
      type: 'string',
      description: 'JavaScript function body (will be wrapped in an async function)',
      default: 'return data;'
    },
    timeout: {
      type: 'number',
      description: 'Maximum execution time in milliseconds',
      default: 5000
    }
  }
};