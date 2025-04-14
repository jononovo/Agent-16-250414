/**
 * JSON Path Node Schema
 * 
 * This file defines the inputs, outputs, and parameters for the JSON Path node.
 */

import { NodeSchema } from '../registry';

const schema: NodeSchema = {
  inputs: {
    data: {
      type: 'object',
      description: 'JSON data to query with JSONPath'
    }
  },
  outputs: {
    result: {
      type: 'any',
      description: 'The extracted data from the JSONPath query'
    },
    error: {
      type: 'string',
      description: 'Error message if JSONPath query failed'
    }
  },
  parameters: {
    path: {
      type: 'string',
      description: 'JSONPath expression to extract data',
      default: '$.data'
    },
    returnFirst: {
      type: 'boolean',
      description: 'Return only the first match if multiple results are found',
      default: false
    },
    defaultValue: {
      type: 'string',
      description: 'Default value to return if no matches are found',
      default: ''
    }
  }
};

export default schema;