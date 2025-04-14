/**
 * JSON Path Node Schema
 * 
 * This file defines the inputs, outputs, and parameters for the JSON Path node.
 */

import { NodeSchema } from '../registry';

const schema: NodeSchema = {
  inputs: {
    json: {
      type: 'object',
      description: 'JSON data to extract from'
    }
  },
  outputs: {
    result: {
      type: 'any',
      description: 'The extracted data'
    },
    error: {
      type: 'string',
      description: 'Error message if extraction failed'
    }
  },
  parameters: {
    path: {
      type: 'string',
      description: 'JSONPath expression to extract data',
      default: '$.data'
    },
    defaultValue: {
      type: 'string',
      description: 'Default value to return if path is not found',
      default: ''
    },
    multiple: {
      type: 'boolean',
      description: 'Whether to return multiple results or just the first match',
      default: false
    }
  }
};

export default schema;