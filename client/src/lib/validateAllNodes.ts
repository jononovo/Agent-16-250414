/**
 * Node System Validation
 * 
 * This module validates all registered node definitions to ensure
 * they meet the required structure and format.
 */

import { validateNodes, logValidationResults } from './nodeValidation';
import { NodeDefinition } from '../nodes/types';

// Import all node definitions
const nodeModules = import.meta.glob('../nodes/*/definition.ts', { eager: true });

/**
 * Validates all node definitions in the system
 * 
 * @param verbose Whether to log the validation results to the console
 * @returns True if all nodes are valid, false otherwise
 */
export function validateAllNodes(verbose = true): boolean {
  console.group('🔍 Node Definition Validation');
  console.log('Validating all node definitions in the system...');
  
  const nodeDefinitions: Record<string, Partial<NodeDefinition>> = {};
  let moduleCount = 0;
  
  // Extract node definitions from modules
  for (const path in nodeModules) {
    try {
      const module = nodeModules[path] as any;
      const nodeDef = module.default as NodeDefinition;
      
      if (nodeDef) {
        moduleCount++;
        nodeDefinitions[nodeDef.type || path] = nodeDef;
      }
    } catch (error) {
      console.error(`Error loading node definition from ${path}:`, error);
    }
  }
  
  console.log(`Found ${moduleCount} node modules to validate`);
  
  // Validate all node definitions
  const results = validateNodes(nodeDefinitions);
  
  // Log results if verbose mode is enabled
  if (verbose) {
    logValidationResults(results);
  }
  
  // Check if any node has validation errors
  let hasErrors = false;
  for (const result of Object.values(results)) {
    if (!result.valid) {
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    console.error('❌ Node validation failed! Some nodes have errors that need to be fixed.');
  } else {
    console.log('✅ All node definitions passed validation!');
  }
  
  console.groupEnd();
  return !hasErrors;
}

export default validateAllNodes;