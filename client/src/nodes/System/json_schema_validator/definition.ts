/**
 * JSON Schema Validator Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../../Custom/types';

export const definition: NodeDefinition = {
  type: 'json_schema_validator',
  name: 'JSON Schema Validator',
  description: 'Validates JSON data against a schema',
  icon: 'check-square',
  category: 'data',
  version: '1.0.0',
  inputs: {
    json: {
      type: 'object',
      description: 'The JSON data to validate'
    },
    schema: {
      type: 'object',
      description: 'JSON schema to validate against',
      optional: true
    }
  },
  outputs: {
    validJson: {
      type: 'object',
      description: 'The validated JSON data (if valid)'
    },
    isValid: {
      type: 'boolean',
      description: 'Whether the JSON data is valid according to the schema'
    },
    errors: {
      type: 'array',
      description: 'Validation errors (if any)'
    }
  },
  configOptions: [
    {
      key: 'schemaContent',
      type: 'textarea',
      default: '{}',
      description: 'JSON schema to validate against (if not provided via input)'
    },
    {
      key: 'strictMode',
      type: 'boolean',
      default: true,
      description: 'Enforce strict validation'
    },
    {
      key: 'allowAdditionalProperties',
      type: 'boolean',
      default: false,
      description: 'Allow properties not defined in the schema'
    }
  ],
  defaultData: {
    schemaContent: '{}',
    strictMode: true,
    allowAdditionalProperties: false,
    label: 'JSON Schema Validator'
  }
};

export default definition;