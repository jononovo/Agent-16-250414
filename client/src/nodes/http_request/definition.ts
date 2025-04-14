/**
 * HTTP Request Node Definition
 * Defines the HTTP request node's properties, appearance, and behavior
 */

import schema from './schema';

// Use a simplified structure that doesn't depend on external interfaces
// This will be adapted to the required interface formats in index.ts
const definition = {
  type: 'http_request',
  name: 'HTTP Request',
  description: 'Make HTTP requests to external APIs and web services',
  category: 'integration',
  version: '1.0.0',
  icon: 'globe',
  inputs: {
    body: {
      type: 'object',
      description: 'Input data to use as the request body',
      required: false
    },
    headers: {
      type: 'object',
      description: 'Headers to merge with the request',
      required: false
    }
  },
  outputs: {
    response: {
      type: 'object',
      description: 'Full response object from the request'
    },
    data: {
      type: 'object',
      description: 'Response data (typically JSON)'
    },
    status: {
      type: 'number',
      description: 'HTTP status code of the response'
    }
  },
  configOptions: [
    {
      key: 'url',
      type: 'string',
      default: '',
      description: 'URL to send the request to'
    },
    {
      key: 'method',
      type: 'select',
      default: 'GET',
      description: 'HTTP method to use',
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    },
    {
      key: 'headers',
      type: 'json',
      default: { 'Content-Type': 'application/json' },
      description: 'Default headers to include with the request'
    },
    {
      key: 'body',
      type: 'text',
      default: '',
      description: 'Default request body (JSON string or other format)'
    },
    {
      key: 'timeout',
      type: 'number',
      default: 10000,
      description: 'Request timeout in milliseconds'
    }
  ]
};

export default definition;