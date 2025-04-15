/**
 * Node Output Utilities
 * 
 * Simple utility functions for creating standardized node outputs
 */

import { WorkflowItem, NodeExecutionData } from '@shared/nodeTypes';

/**
 * Creates a standardized node output
 */
export function createNodeOutput(data: any): NodeExecutionData {
  // Create a single workflow item from the data
  const workflowItem: WorkflowItem = {
    json: data,
    text: typeof data === 'string' ? data : JSON.stringify(data)
  };
  
  // Create the full node execution data
  return {
    items: [workflowItem],
    meta: {
      startTime: new Date(),
      endTime: new Date()
    }
  };
}

/**
 * Creates an error output
 */
export function createErrorOutput(errorMessage: string): NodeExecutionData {
  return createNodeOutput({ error: errorMessage });
}