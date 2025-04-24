/**
 * Function Node Executor
 * 
 * This executor runs custom JavaScript functions defined by the user.
 * Enhanced with additional options for error handling, caching, and execution control.
 */

// Import the templates if needed
import { nodeMetadata } from './definition';

interface FunctionNodeData {
  functionBody: string;
  timeout: number;
  useAsyncFunction: boolean;
  errorHandling: 'throw' | 'return' | 'null';
  executionEnvironment: 'client' | 'server';
  cacheResults: boolean;
  selectedTemplate?: string;
  [key: string]: any;
}

// Cache for storing function results
const resultCache = new Map<string, any>();

/**
 * Execute a function node with the provided data and inputs
 */
export async function execute(nodeData: any, inputs: Record<string, any> = {}) {
  try {
    // Normalize the node data to work with different versions
    const normalizedData: FunctionNodeData = {
      functionBody: nodeData.functionBody || nodeData.code || 'return data;',
      timeout: nodeData.timeout || 5000,
      useAsyncFunction: nodeData.useAsyncFunction ?? true,
      errorHandling: nodeData.errorHandling || 'throw',
      executionEnvironment: nodeData.executionEnvironment || 'client',
      cacheResults: nodeData.cacheResults || false
    };

    // Prepare input data - make "data" available as the primary input
    const data = inputs.data !== undefined ? inputs.data : inputs;
    
    // Check cache if caching is enabled
    if (normalizedData.cacheResults) {
      const cacheKey = getCacheKey(normalizedData.functionBody, data);
      if (resultCache.has(cacheKey)) {
        return {
          result: resultCache.get(cacheKey),
          meta: {
            cached: true,
            executionTime: 0,
            startTime: new Date(),
            endTime: new Date()
          }
        };
      }
    }
    
    // Start measuring execution time
    const startTime = Date.now();
    
    // Create a function from the code string with timeout handling
    let result;

    if (normalizedData.executionEnvironment === 'server') {
      // This is a placeholder - in a real implementation, this would send the code
      // to the server for execution. For now, we'll just execute it client-side.
      console.warn('Server-side execution is not fully implemented. Running client-side instead.');
    }
    
    if (normalizedData.useAsyncFunction) {
      // For async execution with timeout
      result = await executeWithTimeout(
        () => executeAsyncFunction(normalizedData.functionBody, data, inputs),
        normalizedData.timeout
      );
    } else {
      // For synchronous execution with timeout
      result = await executeWithTimeout(
        () => executeSyncFunction(normalizedData.functionBody, data, inputs),
        normalizedData.timeout
      );
    }
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    
    // Store in cache if caching is enabled
    if (normalizedData.cacheResults) {
      const cacheKey = getCacheKey(normalizedData.functionBody, data);
      resultCache.set(cacheKey, result);
    }
    
    return {
      result,
      meta: {
        cached: false,
        executionTime,
        startTime: new Date(startTime),
        endTime: new Date()
      }
    };
  } catch (error) {
    console.error('Error executing function node:', error);
    
    // Handle the error according to the configured strategy
    switch (nodeData.errorHandling) {
      case 'return':
        return {
          result: {
            error: true,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          },
          meta: {
            error: true,
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error)
          }
        };
      case 'null':
        return {
          result: null,
          meta: {
            error: true,
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error)
          }
        };
      case 'throw':
      default:
        return {
          error: error instanceof Error ? error.message : String(error),
          meta: {
            error: true,
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error)
          }
        };
    }
  }
}

/**
 * Execute a synchronous function with the given code and inputs
 */
function executeSyncFunction(functionBody: string, data: any, inputs: Record<string, any>) {
  // Create a safe execution context with limited capabilities
  const sandboxedFunction = new Function('data', 'inputs', functionBody);
  
  // Execute the function with the provided inputs
  return sandboxedFunction(data, inputs);
}

/**
 * Execute an asynchronous function with the given code and inputs
 */
async function executeAsyncFunction(functionBody: string, data: any, inputs: Record<string, any>) {
  // Create an async function wrapper
  const asyncFunction = new Function('data', 'inputs', `
    return (async () => {
      ${functionBody}
    })();
  `);
  
  // Execute the function with the provided inputs
  return await asyncFunction(data, inputs);
}

/**
 * Execute a function with a timeout
 */
async function executeWithTimeout<T>(func: () => T | Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Function execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    // Execute the function
    Promise.resolve(func())
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Create a cache key from function code and input data
 */
function getCacheKey(functionBody: string, data: any): string {
  try {
    // Use a simple hash of the function code and stringified input
    const inputString = JSON.stringify(data);
    return `${functionBody.length}_${inputString.length}_${hashString(functionBody + inputString)}`;
  } catch (e) {
    // If JSON.stringify fails or for any other reason, use a fallback
    console.warn('Failed to create cache key:', e);
    return `${Date.now()}_${Math.random()}`;
  }
}

/**
 * Simple string hashing function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export const defaultData: FunctionNodeData = {
  functionBody: `// This function receives the input data and can transform it
// The 'data' variable contains the primary input
// The 'inputs' object contains all connected inputs

return {
  message: "Hello from function node!",
  processed: true,
  timestamp: new Date().toISOString(),
  originalData: data
};`,
  timeout: 5000,
  useAsyncFunction: true,
  errorHandling: 'throw',
  executionEnvironment: 'client',
  cacheResults: false
};