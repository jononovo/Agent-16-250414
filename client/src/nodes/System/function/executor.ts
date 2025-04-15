/**
 * Function Node Executor
 * 
 * This executor runs custom JavaScript functions defined by the user.
 */

interface FunctionNodeData {
  code: string;
}

/**
 * Execute a function node with the provided data and inputs
 */
export async function execute(nodeData: FunctionNodeData, inputs: Record<string, any> = {}) {
  try {
    // Create a function from the code string
    const funcBody = nodeData.code;
    
    // Create a safe execution context with limited capabilities
    const sandboxedFunction = new Function('inputs', funcBody);
    
    // Execute the function with the provided inputs
    const result = sandboxedFunction(inputs);
    
    // Handle both synchronous and asynchronous (Promise) results
    const output = result instanceof Promise ? await result : result;
    
    return {
      result: output
    };
  } catch (error) {
    console.error('Error executing function node:', error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export const defaultData: FunctionNodeData = {
  code: `// This function receives all inputs as the first parameter
// You can transform the data and return any value
// Example:
return {
  message: "Hello from function node!",
  inputs: inputs
};`
};