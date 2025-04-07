/**
 * Enhanced Node Executors Registry
 * 
 * This file registers and manages node type executors for the client-centric
 * workflow architecture. Each node type has its own specialized executor
 * for handling its unique functionality.
 */

import { executeApiNode } from './apiExecutor';
import { executeDatabaseOperationNode } from './databaseOperationExecutor';

// Registry of node executors
const nodeExecutors: Record<string, (nodeData: any, input: any) => Promise<any>> = {};

/**
 * Register a node executor for a specific node type
 * 
 * @param nodeType - The type of node
 * @param executor - The executor function for this node type
 */
export function registerNodeExecutor(
  nodeType: string,
  executor: (nodeData: any, input: any) => Promise<any>
): void {
  nodeExecutors[nodeType] = executor;
  console.log(`Registered executor for node type: ${nodeType}`);
}

/**
 * Execute a node with the appropriate executor
 * 
 * @param nodeType - The type of node to execute
 * @param nodeData - The node configuration data
 * @param input - The input data to the node
 * @returns The execution result
 */
export async function executeNode(
  nodeType: string,
  nodeData: any,
  input: any
): Promise<any> {
  if (!nodeExecutors[nodeType]) {
    throw new Error(`No executor registered for node type: ${nodeType}`);
  }

  return nodeExecutors[nodeType](nodeData, input);
}

/**
 * Check if a node type has a registered executor
 * 
 * @param nodeType - The type of node to check
 * @returns True if the node type has an executor
 */
export function hasExecutor(nodeType: string): boolean {
  return !!nodeExecutors[nodeType];
}

/**
 * Get a list of all registered node types
 * 
 * @returns Array of registered node types
 */
export function getRegisteredNodeTypes(): string[] {
  return Object.keys(nodeExecutors);
}

/**
 * Register all built-in node executors
 */
export function registerAllNodeExecutors(): void {
  // Register API executor
  registerNodeExecutor('api', executeApiNode);
  
  // Register database operation executor
  registerNodeExecutor('database_operation', executeDatabaseOperationNode);
  
  // Additional executors can be registered here
  
  console.log('All node executors registered successfully');
}