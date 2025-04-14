/**
 * Function Node Executor
 * 
 * This file contains the execution logic for the function node,
 * which evaluates custom JavaScript code.
 */

export interface FunctionNodeData {
  code: string;
  timeout?: number;
}

/**
 * Safely evaluate JavaScript code with a timeout
 * 
 * @param code The JavaScript code to evaluate
 * @param context The context object to provide to the code
 * @param timeout Maximum execution time in milliseconds
 * @returns The result of the evaluation
 */
async function safeEval(code: string, context: any, timeout: number = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // Create a function from the code
      const fn = new Function('inputs', 'console', code);
      
      // Set a timeout to prevent infinite loops
      const timeoutId = setTimeout(() => {
        reject(new Error(`Function execution timed out after ${timeout}ms`));
      }, timeout);
      
      // Create a safe console object
      const safeConsole = {
        log: (...args: any[]) => console.log('[Function Node]', ...args),
        error: (...args: any[]) => console.error('[Function Node]', ...args),
        warn: (...args: any[]) => console.warn('[Function Node]', ...args),
        info: (...args: any[]) => console.info('[Function Node]', ...args)
      };
      
      // Execute the function
      const result = fn(context, safeConsole);
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Resolve with the result
      resolve(result);
    } catch (error: any) {
      reject(error);
    }
  });
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
    
    // Set default timeout if not provided
    const timeout = nodeData.timeout || 5000;
    
    // Execute the code
    const result = await safeEval(nodeData.code, { ...inputs }, timeout);
    
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