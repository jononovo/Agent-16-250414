/**
 * Function Node Definition
 * 
 * This file defines the metadata and schema for the Function node.
 */

import { NodeDefinition } from '../types';

// Define node definition
const definition: NodeDefinition = {
  type: 'function',
  name: 'Function',
  description: 'Execute custom JavaScript functions',
  category: 'code',
  version: '1.0.0',
  icon: 'code',
  
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
  
  configOptions: [
    {
      key: 'functionBody',
      type: 'string',
      description: 'JavaScript function body (will be wrapped in an async function)',
      default: 'return data;'
    },
    {
      key: 'timeout',
      type: 'number',
      description: 'Maximum execution time in milliseconds',
      default: 5000
    }
  ],
  
  defaultData: {
    functionBody: 'return data;',
    timeout: 5000
  }
};

// Additional metadata for UI/rendering (optional)
export const nodeMetadata = {
  tags: ['code', 'function', 'javascript', 'custom'],
  color: '#2196F3'
};

export default definition;