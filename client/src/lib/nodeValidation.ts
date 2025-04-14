/**
 * Node Definition Validation Utilities
 * 
 * This file contains utilities for validating node definitions to ensure they
 * meet the required structure and format requirements.
 */

import { NodeDefinition, PortDefinition } from '../nodes/types';

/**
 * Required fields for node definition validation
 */
const REQUIRED_NODE_FIELDS = [
  'type',
  'name',
  'description',
  'category',
  'version',
  'inputs',
  'outputs'
];

/**
 * Required fields for port definition validation
 */
const REQUIRED_PORT_FIELDS = [
  'type',
  'description'
];

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a node definition for completeness and correctness
 * 
 * @param node The node definition to validate
 * @returns A validation result with any errors or warnings
 */
export function validateNodeDefinition(node: Partial<NodeDefinition>): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Check required fields
  for (const field of REQUIRED_NODE_FIELDS) {
    if (node[field as keyof NodeDefinition] === undefined) {
      result.valid = false;
      result.errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate version format (semantic versioning)
  if (node.version && !/^\d+\.\d+\.\d+$/.test(node.version)) {
    result.warnings.push(`Version should follow semantic versioning (e.g., 1.0.0), got: ${node.version}`);
  }

  // Validate inputs and outputs
  if (node.inputs) {
    validatePorts('input', node.inputs, result);
  }
  
  if (node.outputs) {
    validatePorts('output', node.outputs, result);
  }

  // Check if icon is provided
  if (!node.icon) {
    result.warnings.push('No icon specified for node');
  }

  // Check for defaultData when configOptions are present
  if (node.configOptions && node.configOptions.length > 0 && !node.defaultData) {
    result.warnings.push('Node has configOptions but no defaultData defined');
  }

  return result;
}

/**
 * Validates port definitions for a node
 * 
 * @param portType The type of ports (input or output)
 * @param ports The port definitions to validate
 * @param result The validation result to update
 */
function validatePorts(
  portType: 'input' | 'output',
  ports: Record<string, PortDefinition>,
  result: ValidationResult
): void {
  const portNames = Object.keys(ports);
  
  if (portNames.length === 0 && portType === 'output') {
    result.warnings.push(`Node has no ${portType} ports defined`);
  }

  for (const portName of portNames) {
    const port = ports[portName];
    
    // Check required port fields
    for (const field of REQUIRED_PORT_FIELDS) {
      if (port[field as keyof PortDefinition] === undefined) {
        result.valid = false;
        result.errors.push(`Missing required field '${field}' for ${portType} port: ${portName}`);
      }
    }
  }
}

/**
 * Validates multiple node definitions
 * 
 * @param nodes The node definitions to validate
 * @returns A map of validation results by node type
 */
export function validateNodes(
  nodes: Record<string, Partial<NodeDefinition>>
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};
  
  for (const [nodeType, nodeDef] of Object.entries(nodes)) {
    results[nodeType] = validateNodeDefinition(nodeDef);
  }
  
  return results;
}

/**
 * Logs validation results to the console
 * 
 * @param results The validation results to log
 */
export function logValidationResults(
  results: Record<string, ValidationResult>
): void {
  let hasErrors = false;
  let hasWarnings = false;
  
  console.group('Node Definition Validation Results');
  
  for (const [nodeType, result] of Object.entries(results)) {
    if (result.errors.length > 0) {
      hasErrors = true;
      console.error(`❌ ${nodeType}: ${result.errors.length} errors, ${result.warnings.length} warnings`);
      
      for (const error of result.errors) {
        console.error(`   - ${error}`);
      }
      
      for (const warning of result.warnings) {
        console.warn(`   - ${warning}`);
      }
    } else if (result.warnings.length > 0) {
      hasWarnings = true;
      console.warn(`⚠️ ${nodeType}: ${result.warnings.length} warnings`);
      
      for (const warning of result.warnings) {
        console.warn(`   - ${warning}`);
      }
    } else {
      console.log(`✅ ${nodeType}: Valid`);
    }
  }
  
  if (hasErrors) {
    console.error(`❌ Validation failed with errors`);
  } else if (hasWarnings) {
    console.warn(`⚠️ Validation passed with warnings`);
  } else {
    console.log(`✅ All node definitions are valid`);
  }
  
  console.groupEnd();
}