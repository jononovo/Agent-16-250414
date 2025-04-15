/**
 * Node Validation System
 * 
 * A unified system for node definition validation, registration, and discovery.
 * This module replaces the separate nodeValidation.ts and validateAllNodes.ts files
 * with a more concise implementation.
 */

import { NodeDefinition, PortDefinition } from '../nodes/types';

// List of all node types implemented using the folder-based structure
export const FOLDER_BASED_NODE_TYPES = [
  'text_input',
  'claude',
  'http_request',
  'text_template',
  'data_transform',
  'decision',
  'function',
  'json_path',
  'json_parser'
];

// List of custom user-created node types (will be populated at runtime)
export let CUSTOM_NODE_TYPES: string[] = [];

// Required fields for node definitions
const REQUIRED_NODE_FIELDS = [
  'type',
  'name',
  'description',
  'category',
  'version',
  'inputs',
  'outputs',
  'defaultData'
];

// Required fields for port definitions
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
 * Validates a node definition
 */
export function validateNode(node: Partial<NodeDefinition>): ValidationResult {
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

  // Validate semantic versioning format
  if (node.version && !/^\d+\.\d+\.\d+$/.test(node.version)) {
    result.warnings.push(`Version should follow semantic versioning (e.g., 1.0.0), got: ${node.version}`);
  }

  // Validate inputs
  if (node.inputs) {
    validatePorts('input', node.inputs, result);
  }
  
  // Validate outputs
  if (node.outputs) {
    validatePorts('output', node.outputs, result);
  }

  // Check if icon is provided
  if (!node.icon) {
    result.warnings.push('No icon specified for node');
  }

  return result;
}

/**
 * Validates port definitions
 */
function validatePorts(
  portType: 'input' | 'output',
  ports: Record<string, PortDefinition>,
  result: ValidationResult
): void {
  const portNames = Object.keys(ports);
  
  // Outputs should have at least one port
  if (portNames.length === 0 && portType === 'output') {
    result.warnings.push(`Node has no ${portType} ports defined`);
  }

  // Validate each port
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
 * Validates all node definitions in the system
 */
export async function validateAllNodes(verbose = true): Promise<boolean> {
  if (verbose) {
    console.group('🔍 Node Definition Validation');
    console.log('Validating all node definitions in the system...');
  }
  
  // Import all node definitions dynamically from both System and Custom folders
  const systemNodeModules = import.meta.glob('../nodes/System/*/definition.ts', { eager: true });
  const customNodeModules = import.meta.glob('../nodes/Custom/*/definition.ts', { eager: true });
  // Also look in the root nodes folder for backward compatibility
  const rootNodeModules = import.meta.glob('../nodes/*/definition.ts', { eager: true });
  
  // Combine all modules
  const nodeModules = { ...systemNodeModules, ...customNodeModules, ...rootNodeModules };
  const nodeDefinitions: Record<string, NodeDefinition> = {};
  const validationResults: Record<string, ValidationResult> = {};
  
  // Extract and store node definitions
  for (const path in nodeModules) {
    try {
      const module = nodeModules[path] as any;
      const nodeDef = module.default as NodeDefinition;
      
      if (nodeDef && nodeDef.type) {
        nodeDefinitions[nodeDef.type] = nodeDef;
        validationResults[nodeDef.type] = validateNode(nodeDef);
      }
    } catch (error) {
      console.error(`Error loading node definition from ${path}:`, error);
    }
  }
  
  if (verbose) {
    console.log(`Found ${Object.keys(nodeDefinitions).length} node definitions to validate`);
    logValidationResults(validationResults);
  }
  
  // Check if any validation failed
  const isValid = !Object.values(validationResults).some(result => !result.valid);
  
  if (verbose) {
    if (isValid) {
      console.log('✅ All node definitions passed validation!');
    } else {
      console.error('❌ Node validation failed! Some nodes have errors that need to be fixed.');
    }
    console.groupEnd();
  }
  
  return isValid;
}

/**
 * Logs validation results to the console
 */
export function logValidationResults(results: Record<string, ValidationResult>): void {
  for (const [nodeType, result] of Object.entries(results)) {
    if (result.errors.length > 0) {
      console.error(`❌ ${nodeType}: ${result.errors.length} errors, ${result.warnings.length} warnings`);
      
      for (const error of result.errors) {
        console.error(`   - ${error}`);
      }
      
      for (const warning of result.warnings) {
        console.warn(`   - ${warning}`);
      }
    } else if (result.warnings.length > 0) {
      console.warn(`⚠️ ${nodeType}: ${result.warnings.length} warnings`);
      
      for (const warning of result.warnings) {
        console.warn(`   - ${warning}`);
      }
    } else {
      console.log(`✅ ${nodeType}: Valid`);
    }
  }
}

/**
 * Check if a node type is implemented
 */
export function isNodeTypeImplemented(nodeType: string): boolean {
  return FOLDER_BASED_NODE_TYPES.includes(nodeType) || CUSTOM_NODE_TYPES.includes(nodeType);
}

/**
 * Register a custom node type
 */
export function registerCustomNodeType(nodeType: string): void {
  if (!CUSTOM_NODE_TYPES.includes(nodeType)) {
    CUSTOM_NODE_TYPES.push(nodeType);
  }
}

/**
 * Register multiple custom node types
 */
export function registerCustomNodeTypes(nodeTypes: string[]): void {
  nodeTypes.forEach(nodeType => {
    if (!CUSTOM_NODE_TYPES.includes(nodeType)) {
      CUSTOM_NODE_TYPES.push(nodeType);
    }
  });
}

/**
 * Gets the path to a node's executor
 * Attempts to find the node in System, Custom, or root folders
 */
export function getNodeExecutorPath(nodeType: string): string {
  // Check System folder first (preferred for built-in nodes)
  if (FOLDER_BASED_NODE_TYPES.includes(nodeType)) {
    return `../nodes/System/${nodeType}/executor`;
  }
  
  // Then check Custom folder (for user-generated nodes)
  if (CUSTOM_NODE_TYPES.includes(nodeType)) {
    return `../nodes/Custom/${nodeType}/executor`;
  }
  
  // Fallback to root folder for backward compatibility
  return `../nodes/${nodeType}/executor`;
}

/**
 * Gets the path to a node's definition
 * Attempts to find the node in System, Custom, or root folders
 */
export function getNodeDefinitionPath(nodeType: string): string {
  // Check System folder first (preferred for built-in nodes)
  if (FOLDER_BASED_NODE_TYPES.includes(nodeType)) {
    return `../nodes/System/${nodeType}/definition`;
  }
  
  // Then check Custom folder (for user-generated nodes)
  if (CUSTOM_NODE_TYPES.includes(nodeType)) {
    return `../nodes/Custom/${nodeType}/definition`;
  }
  
  // Fallback to root folder for backward compatibility
  return `../nodes/${nodeType}/definition`;
}