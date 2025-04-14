/**
 * Enhanced Node Executors
 * 
 * This file provides a registry for node executors used in the enhanced workflow engine.
 * It connects the folder-based node system with the workflow execution engine.
 */

import { registerNodeExecutorsFromRegistry } from './nodeSystem';
import { EnhancedNodeExecutor } from './types/workflow';

// Registry to store node executors
const executorRegistry: Record<string, Function> = {};

/**
 * Register a node executor
 */
export function registerNodeExecutor(nodeType: string, executor: Function): void {
  executorRegistry[nodeType] = executor;
  console.log(`Registered executor for node type: ${nodeType}`);
}

/**
 * Get a node executor by type
 */
export function getNodeExecutor(nodeType: string): Function | null {
  return executorRegistry[nodeType] || null;
}

/**
 * Check if a node executor exists
 */
export function hasNodeExecutor(nodeType: string): boolean {
  return !!executorRegistry[nodeType];
}

/**
 * List all registered node types
 */
export function getRegisteredNodeTypes(): string[] {
  return Object.keys(executorRegistry);
}

/**
 * Register all enhanced node executors
 * This connects our folder-based node system with the workflow execution engine
 */
export function registerAllNodeExecutors(): void {
  // Register folder-based node executors
  registerNodeExecutorsFromRegistry();
  
  // Additional built-in executors can be registered here
  
  // Text Input Node - direct implementation in case the folder-based one fails
  if (!executorRegistry['text_input']) {
    registerNodeExecutor('text_input', async (nodeData: any) => {
      const inputText = nodeData.inputText || '';
      
      return {
        meta: {
          status: 'success',
          message: 'Text input processed successfully',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString()
        },
        items: [
          {
            json: { text: inputText },
            binary: null
          }
        ]
      };
    });
  }
}