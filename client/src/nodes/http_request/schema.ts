/**
 * HTTP Request Node Schema
 * 
 * Defines the inputs, outputs, and parameters for the HTTP request node.
 */

import { NodeSchema } from '../registry';

// Schema definition
const schema: NodeSchema = {
  // Inputs to the node
  inputs: {
    body: {
      type: 'any',
      description: 'The request body (for POST, PUT, PATCH)'
    },
    headers: {
      type: 'object',
      description: 'Additional headers to include in the request'
    }
  },
  
  // Outputs from the node
  outputs: {
    response: {
      type: 'object',
      description: 'The full response from the API'
    },
    data: {
      type: 'any',
      description: 'The response data (parsed JSON if available)'
    },
    status: {
      type: 'number',
      description: 'The HTTP status code'
    }
  },
  
  // Parameters that can be configured
  parameters: {
    url: {
      type: 'string',
      description: 'The URL to send the request to',
      default: '',
      required: true
    },
    method: {
      type: 'string',
      description: 'The HTTP method to use',
      default: 'GET',
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    },
    headers: {
      type: 'object',
      description: 'Headers to include in the request',
      default: { 'Content-Type': 'application/json' }
    },
    body: {
      type: 'string',
      description: 'Body content for POST, PUT, PATCH requests',
      default: ''
    },
    timeout: {
      type: 'number',
      description: 'Request timeout in milliseconds',
      default: 10000
    }
  }
};

export default schema;