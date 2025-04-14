/**
 * JSON Path Node Executor
 * 
 * This file contains the execution logic for the JSON Path node,
 * which extracts data from JSON objects using JSONPath expressions.
 */

// Note: In a real implementation, we would use a proper JSONPath library
// This is a simplified version for demonstration purposes

export interface JSONPathNodeData {
  path: string;
  returnFirst: boolean;
  defaultValue: string;
}

// Helper function to safely traverse a JSON object given a path
function getValueByPath(obj: any, path: string, defaultValue: any = undefined) {
  try {
    // Remove the leading $ if present (JSONPath standard)
    const normalizedPath = path.replace(/^\$\.?/, '');
    
    // Split the path into segments
    const segments = normalizedPath.split('.');
    
    // Traverse the object
    let current = obj;
    for (const segment of segments) {
      // Handle array indices in the path (e.g., items[0])
      const arrayMatch = segment.match(/^([^\[]+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [_, arrayName, indexStr] = arrayMatch;
        const index = parseInt(indexStr, 10);
        
        if (!current[arrayName] || !Array.isArray(current[arrayName]) || current[arrayName].length <= index) {
          return defaultValue;
        }
        
        current = current[arrayName][index];
        continue;
      }
      
      // Handle regular object properties
      if (current === undefined || current === null || !(segment in current)) {
        return defaultValue;
      }
      
      current = current[segment];
    }
    
    return current;
  } catch (error) {
    console.error('Error in getValueByPath:', error);
    return defaultValue;
  }
}

/**
 * Execute the JSON Path node
 * 
 * @param nodeData The node configuration data
 * @param inputs Optional inputs from connected nodes
 * @returns The execution result
 */
export const execute = async (nodeData: JSONPathNodeData, inputs?: any): Promise<any> => {
  try {
    const startTime = new Date().toISOString();
    
    // Check if we have data to query
    if (!inputs?.data) {
      throw new Error('No data provided for JSONPath query');
    }
    
    // Get the path and options
    const path = nodeData.path || '$.data';
    const returnFirst = nodeData.returnFirst || false;
    const defaultValue = nodeData.defaultValue || '';
    
    // Extract the data using the JSONPath
    let result = getValueByPath(inputs.data, path, defaultValue);
    
    // If result is an array and returnFirst is true, return just the first element
    if (Array.isArray(result) && returnFirst && result.length > 0) {
      result = result[0];
    }
    
    const endTime = new Date().toISOString();
    return {
      meta: {
        status: 'success',
        message: 'JSONPath query executed successfully',
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
        message: error.message || 'Error executing JSONPath query',
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