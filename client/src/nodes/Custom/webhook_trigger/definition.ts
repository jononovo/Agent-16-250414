/**
 * Webhook Trigger Node Definition
 * 
 * This node creates a webhook endpoint that can be called by external systems
 * to trigger the workflow.
 */

import { z } from 'zod';

import { Webhook } from 'lucide-react';

const definition = {
  type: 'webhook_trigger',
  name: 'Webhook Trigger',
  description: 'Creates a webhook URL that can trigger this workflow when called from external systems',
  category: 'triggers',
  icon: Webhook,
  version: '1.0.0',
  inputs: {},
  outputs: {
    payload: {
      type: 'object',
      description: 'The payload received from the webhook call'
    },
    headers: {
      type: 'object',
      description: 'HTTP headers from the webhook request'
    },
    method: {
      type: 'string',
      description: 'HTTP method used in the webhook request'
    }
  },
  settings: [
    {
      key: 'path',
      type: 'string',
      label: 'Webhook Path',
      description: 'Custom path for the webhook URL (optional)',
      placeholder: 'my-custom-endpoint',
      required: false
    },
    {
      key: 'secret',
      type: 'string',
      label: 'Secret Key',
      description: 'Secret key for validating webhook requests',
      placeholder: 'your-secret-key',
      required: false
    },
    {
      key: 'authType',
      type: 'select',
      label: 'Authentication Type',
      description: 'Method of authentication for the webhook',
      options: [
        { label: 'None', value: 'none' },
        { label: 'API Key', value: 'apiKey' },
        { label: 'Bearer Token', value: 'bearer' }
      ],
      default: 'none'
    },
    {
      key: 'methods',
      type: 'multiselect',
      label: 'Allowed HTTP Methods',
      description: 'HTTP methods this webhook will accept',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' }
      ],
      default: ['POST']
    }
  ],
  validation: z.object({
    path: z.string().optional(),
    secret: z.string().optional(),
    authType: z.enum(['none', 'apiKey', 'bearer']).default('none'),
    methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE'])).default(['POST'])
  })
};

export default definition;