/**
 * Node Output Utilities
 * 
 * Simple utility functions for creating standardized node outputs
 */

import { WorkflowItem, NodeExecutionData } from './types/workflow';

/**
 * Options for createNodeOutput function
 */
interface NodeOutputOptions {
  source?: string;
  additionalMeta?: Record<string, any>;
  startTime?: Date;
}

/**
 * Creates a standardized node output
 * 
 * @param data - The data to include in the output
 * @param options - Optional configuration
 * @returns A standardized NodeExecutionData object
 */
export function createNodeOutput(data: any, options?: NodeOutputOptions): NodeExecutionData {
  const startTime = options?.startTime || new Date();
  const endTime = new Date();
  
  // Create a single workflow item from the data
  const workflowItem: WorkflowItem = {
    json: data,
    meta: {
      source: options?.source || 'unknown'
    }
  };
  
  // Create the full node execution data
  return {
    items: [workflowItem],
    meta: {
      startTime,
      endTime,
      source: options?.source,
      ...options?.additionalMeta
    }
  };
}

/**
 * Creates an error output
 * 
 * @param errorMessage - The error message
 * @param source - Optional source identifier
 * @param options - Additional options
 * @returns A standardized error NodeExecutionData
 */
export function createErrorOutput(
  errorMessage: string, 
  source?: string, 
  options?: Omit<NodeOutputOptions, 'source'>
): NodeExecutionData {
  const startTime = options?.startTime || new Date();
  
  return {
    items: [],
    meta: {
      startTime,
      endTime: new Date(),
      error: true,
      errorMessage,
      source,
      ...options?.additionalMeta
    }
  };
}