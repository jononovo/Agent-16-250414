/**
 * JSON Path Node Definition
 * 
 * This file defines both the metadata and schema for the JSON Path node.
 */

import { NodeSchema } from '../registry';

/**
 * Node metadata - describes the node for display in the UI
 */
export const metadata = {
  name: "JSON Path",
  description: "Extract data from JSON objects using JSONPath expressions",
  category: "data",
  version: "1.0.0",
  tags: ["data", "json", "extract", "query"],
  color: "#2196F3"
};

/**
 * Node schema - defines inputs, outputs, and parameters
 */
export const schema: NodeSchema = {
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