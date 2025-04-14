/**
 * Function Node Executor
 * 
 * This file contains the execution logic for the function node,
 * which allows executing custom JavaScript code.
 */

export interface FunctionNodeData {
  functionBody: string;
  timeout: number;
}

/**
 * Execute the function node
 * 
 * @param nodeData The node configuration data
 * @param inputs Optional inputs from connected nodes
 * @returns The execution result
 */
export const execute = async (nodeData: FunctionNodeData, inputs?: any): Promise<any> => {
  try {
    const startTime = new Date().toISOString();
    
    // Get the function body and timeout
    const functionBody = nodeData.functionBody || 'return data;';
    const timeout = nodeData.timeout || 5000;
    
    // Create a promise that resolves with the result of the function or rejects after timeout
    const functionPromise = new Promise((resolve, reject) => {
      try {
        // Create a function from the function body
        const fn = new Function('data', 'context', `
          try {
            ${functionBody}
          } catch (error) {
            throw error;
          }
        `);
        
        // Execute the function with the input data
        const result = fn(inputs?.data || {}, {
          // Add any context variables here that should be available to the function
          currentTime: new Date().toISOString(),
          timestamp: Date.now(),
        });
        
        // Resolve with the result
        resolve(result);
      } catch (error) {
        // Reject with the error
        reject(error);
      }
    });
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Function execution timed out after ${timeout}ms`));
      }, timeout);
    });
    
    // Race the function promise against the timeout
    const result = await Promise.race([functionPromise, timeoutPromise]);
    
    const endTime = new Date().toISOString();
    return {
      meta: {
        status: 'success',
        message: 'Function executed successfully',
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
        message: error.message || 'Error executing function',
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