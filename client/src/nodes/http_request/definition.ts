/**
 * HTTP Request Node Definition
 * Defines the HTTP request node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../../lib/types/workflow';
import schema from './schema';

export const nodeDefinition: NodeDefinition = {
  type: 'http_request',
  name: 'HTTP Request',
  description: 'Make HTTP requests to external APIs and web services',
  category: 'integration',
  version: '1.0.0',
  icon: 'globe',
  color: '#3B82F6',
  tags: ['api', 'http', 'integration', 'network'],
  inputs: {
    body: {
      type: 'object',
      description: 'Input data to use as the request body',
      optional: true
    },
    headers: {
      type: 'object',
      description: 'Headers to merge with the request',
      optional: true
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
  parameters: [
    {
      name: 'url',
      label: 'URL',
      type: 'string',
      description: 'URL to send the request to',
      required: true
    },
    {
      name: 'method',
      label: 'Method',
      type: 'select',
      description: 'HTTP method to use',
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
      default: 'GET'
    },
    {
      name: 'headers',
      label: 'Headers',
      type: 'json',
      description: 'Default headers to include with the request',
      default: { 'Content-Type': 'application/json' }
    },
    {
      name: 'body',
      label: 'Body',
      type: 'text',
      description: 'Default request body (JSON string or other format)',
      default: ''
    },
    {
      name: 'timeout',
      label: 'Timeout (ms)',
      type: 'number',
      description: 'Request timeout in milliseconds',
      default: 10000
    }
  ]
};

// Metadata for node registry
export const nodeMetadata = {
  type: 'http_request',
  name: nodeDefinition.name,
  description: nodeDefinition.description,
  category: nodeDefinition.category
};

export default nodeDefinition;