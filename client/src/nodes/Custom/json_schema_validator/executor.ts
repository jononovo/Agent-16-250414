/**
 * JSON Schema Validator Node Executor
 * 
 * This file contains the logic for executing the JSON schema validator node.
 * It validates JSON data against a JSON schema using Ajv and returns validation results.
 */

import { createNodeOutput, createErrorOutput } from '../../../nodes/lib/nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

// We'll use vanilla JS validation since we don't want to add Ajv as a dependency
// for this example, but in a real implementation you might want to use Ajv

export interface JsonSchemaValidatorNodeData {
  schemaContent: string;
  strictMode: boolean;
  allowAdditionalProperties: boolean;
}

// Simple validation function
function validateJson(data: any, schema: any, allowAdditionalProperties: boolean): any {
  // Results object
  const result = {
    isValid: true,
    errors: [] as string[]
  };

  // Basic type validation
  if (schema.type && typeof data !== schema.type) {
    result.isValid = false;
    result.errors.push(`Invalid type: expected ${schema.type}, got ${typeof data}`);
    return result;
  }

  // Object validation
  if (schema.type === 'object' && data !== null && typeof data === 'object') {
    // Required properties check
    if (schema.required && Array.isArray(schema.required)) {
      for (const prop of schema.required) {
        if (!(prop in data)) {
          result.isValid = false;
          result.errors.push(`Missing required property: ${prop}`);
        }
      }
    }

    // Properties validation
    if (schema.properties && typeof schema.properties === 'object') {
      const properties = schema.properties;
      
      // Check each property against schema
      for (const [propName, propSchema] of Object.entries(properties)) {
        if (propName in data) {
          // Recursive validation for nested properties
          const propResult = validateJson(data[propName], propSchema as any, allowAdditionalProperties);
          if (!propResult.isValid) {
            result.isValid = false;
            result.errors.push(...propResult.errors.map((err: string) => `${propName}: ${err}`));
          }
        }
      }

      // Check for additional properties
      if (!allowAdditionalProperties && schema.additionalProperties === false) {
        for (const propName of Object.keys(data)) {
          if (!(propName in properties)) {
            result.isValid = false;
            result.errors.push(`Additional property not allowed: ${propName}`);
          }
        }
      }
    }
  }

  // Array validation
  if (schema.type === 'array' && Array.isArray(data)) {
    // Items validation
    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        const itemResult = validateJson(data[i], schema.items, allowAdditionalProperties);
        if (!itemResult.isValid) {
          result.isValid = false;
          result.errors.push(...itemResult.errors.map((err: string) => `[${i}]: ${err}`));
        }
      }
    }

    // Length validation
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      result.isValid = false;
      result.errors.push(`Array too short: ${data.length} < ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      result.isValid = false;
      result.errors.push(`Array too long: ${data.length} > ${schema.maxItems}`);
    }
  }

  return result;
}

export const execute = async (
  nodeData: JsonSchemaValidatorNodeData,
  inputs?: any
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // Check for input JSON
    if (!inputs || !inputs.json) {
      return createErrorOutput('No JSON data provided for validation', 'json_schema_validator');
    }
    
    const jsonData = inputs.json;
    
    // Get schema - either from inputs or from node data
    let schema: any;
    
    if (inputs.schema) {
      // Use schema from inputs if available
      schema = inputs.schema;
    } else {
      // Parse schema from node data
      try {
        schema = JSON.parse(nodeData.schemaContent);
      } catch (error: any) {
        return createErrorOutput(`Invalid JSON schema: ${error.message}`, 'json_schema_validator');
      }
    }
    
    // Validate the JSON data against the schema
    const validationResult = validateJson(
      jsonData, 
      schema, 
      nodeData.allowAdditionalProperties
    );
    
    // Create output with validation results
    const output = {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      validJson: validationResult.isValid ? jsonData : null
    };
    
    // Return standardized output
    return createNodeOutput(output, {
      startTime,
      additionalMeta: {
        strictMode: nodeData.strictMode,
        allowAdditionalProperties: nodeData.allowAdditionalProperties
      }
    });
  } catch (error: any) {
    console.error('Error in json_schema_validator executor:', error);
    return createErrorOutput(
      error.message || 'Error validating JSON data',
      'json_schema_validator'
    );
  }
};