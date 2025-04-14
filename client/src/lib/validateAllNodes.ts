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
  const nodeDefinitions: Record<string, Partial<NodeDefinition>> = {};
  
  // Extract node definitions from modules
  for (const path in nodeModules) {
    try {
      const module = nodeModules[path] as any;
      const nodeDef = module.default as NodeDefinition;
      
      if (nodeDef) {
        nodeDefinitions[nodeDef.type || path] = nodeDef;
      }
    } catch (error) {
      console.error(`Error loading node definition from ${path}:`, error);
    }
  }
  
  // Validate all node definitions
  const results = validateNodes(nodeDefinitions);
  
  // Log results if verbose mode is enabled
  if (verbose) {
    logValidationResults(results);
  }
  
  // Check if any node has validation errors
  for (const result of Object.values(results)) {
    if (!result.valid) {
      return false;
    }
  }
  
  return true;
}

export default validateAllNodes;