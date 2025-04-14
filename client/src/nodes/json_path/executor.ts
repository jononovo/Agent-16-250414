/**
 * JSON Path Node Executor
 * 
 * This file contains the execution logic for the JSON Path node,
 * which extracts data from JSON objects using JSONPath expressions.
 */

export interface JsonPathNodeData {
  path: string;
  defaultValue?: string;
  multiple?: boolean;
}

/**
 * Simple implementation of JSONPath extraction
 * This is a basic implementation and would need to be replaced with a full JSONPath library
 * in a production environment
 */
function getValueByPath(obj: any, path: string): any {
  if (!path || !obj) return undefined;
  
  // Handle root object reference
  if (path === '$') return obj;
  
  // Remove $ from the beginning if present
  const normalizedPath = path.startsWith('$') ? path.slice(1) : path;
  
  // Split path by dots and brackets
  const parts = normalizedPath
    .replace(/\[(\w+)\]/g, '.$1') // convert [0] to .0
    .replace(/^\./, '') // remove leading dot
    .split('.');
  
  let current = obj;
  
  for (const part of parts) {
    if (!current) return undefined;
    
    // Handle array access with wildcards - returns array of all matches
    if (part === '*' && Array.isArray(current)) {
      return current;
    }
    
    current = current[part];
  }
  
  return current;
}

/**
 * Execute the JSON Path node
 * 
 * @param nodeData The node configuration data
 * @param inputs Optional inputs from connected nodes
 * @returns The execution result
 */
export const execute = async (nodeData: JsonPathNodeData, inputs?: any): Promise<any> => {
  try {
    const startTime = new Date().toISOString();
    
    // Check if we have JSON data to process
    if (!inputs?.json) {
      throw new Error('No JSON data provided');
    }
    
    // Get the JSONPath expression
    const path = nodeData.path || '$.data';
    
    // Extract the data
    let result = getValueByPath(inputs.json, path);
    
    // Use default value if result is undefined
    if (result === undefined && nodeData.defaultValue !== undefined) {
      result = nodeData.defaultValue;
    }
    
    // Multiple results vs single result
    if (!nodeData.multiple && Array.isArray(result)) {
      result = result[0];
    }
    
    const endTime = new Date().toISOString();
    return {
      meta: {
        status: 'success',
        message: 'JSONPath extraction successful',
        startTime,
        endTime
      },
      items: [
        {
          json: {
            result
          },
          binary: null
        }
      ]
    };
  } catch (error: any) {
    return {
      meta: {
        status: 'error',
        message: error.message || 'Error during JSONPath extraction',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack
        }
      },
      items: [
        {
          json: {
            error: error.message
          },
          binary: null
        }
      ]
    };
  }
};