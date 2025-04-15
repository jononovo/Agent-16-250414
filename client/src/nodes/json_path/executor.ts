/**
 * JSON Path Node Executor
 * 
 * This executor extracts data from JSON using JSONPath expressions.
 */

import { createNodeOutput, createErrorOutput } from '../../lib/nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

// Define the shape of the node's data
export interface JSONPathNodeData {
  path: string;
}

/**
 * A very simple implementation of JSONPath
 * Note: In a production environment, you'd use a full JSONPath library
 */
function getValueByPath(obj: any, path: string): any {
  if (!path) return obj;
  
  // Handle root object indicator
  if (path === '$') return obj;
  
  // Remove root indicator if present
  const normalizedPath = path.startsWith('$.') ? path.slice(2) : path;
  
  // Split path into segments
  const segments = normalizedPath.split('.');
  
  // Traverse the object according to the path
  let current = obj;
  for (const segment of segments) {
    // Handle array indexing with [n] notation
    if (segment.includes('[') && segment.includes(']')) {
      const bracketStart = segment.indexOf('[');
      const bracketEnd = segment.indexOf(']');
      const property = segment.substring(0, bracketStart);
      const index = parseInt(segment.substring(bracketStart + 1, bracketEnd), 10);
      
      current = current[property][index];
    } else {
      current = current[segment];
    }
    
    if (current === undefined || current === null) {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Extract data from standardized input format
 */
function extractInputData(input: NodeExecutionData | any): any {
  // If input follows standardized format
  if (input && input.items && input.items.length > 0) {
    return input.items[0].json;
  }
  // Return the input itself for backward compatibility
  return input;
}

/**
 * Execute a JSONPath node with the provided data and inputs
 */
export async function execute(
  nodeData: JSONPathNodeData, 
  inputs: Record<string, NodeExecutionData | any> = {}
): Promise<NodeExecutionData> {
  const { path } = nodeData;
  
  try {
    // Extract input data using standardized format
    const rawInputData = inputs.data;
    const inputData = extractInputData(rawInputData);
    
    if (!inputData) {
      return createErrorOutput('No input data provided');
    }
    
    if (!path) {
      return createErrorOutput('No JSONPath expression provided');
    }
    
    // Extract value using JSONPath
    const extractedValue = getValueByPath(inputData, path);
    
    // If value is undefined, it might mean the path doesn't exist
    if (extractedValue === undefined) {
      return createNodeOutput(null, {
        additionalMeta: {
          warning: `Path "${path}" did not match any element in the input data`
        }
      });
    }
    
    // Return the extracted value in standardized format
    return createNodeOutput(extractedValue);
  } catch (error) {
    console.error('Error executing JSONPath:', error);
    return createErrorOutput(error instanceof Error ? error.message : String(error));
  }
}

export const defaultData: JSONPathNodeData = {
  path: '$.data'
};