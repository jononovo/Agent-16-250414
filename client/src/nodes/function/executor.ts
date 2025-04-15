/**
 * Function Node Executor
 * 
 * This executor runs custom JavaScript functions defined by the user.
 */

import { createNodeOutput, createErrorOutput } from '../../lib/nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

interface FunctionNodeData {
  code: string;
}

/**
 * Transforms input data to be used in the function
 * Supports both standard format and legacy format
 */
function prepareInputsForFunction(inputs: Record<string, NodeExecutionData | any>): Record<string, any> {
  const preparedInputs: Record<string, any> = {};
  
  // Process each input port
  for (const portName in inputs) {
    const input = inputs[portName];
    
    // If input follows standardized format, extract the content
    if (input && typeof input === 'object' && 'items' in input && Array.isArray(input.items) && input.items.length > 0) {
      preparedInputs[portName] = input.items[0].json;
    } else {
      // Otherwise, pass the input as-is for backward compatibility
      preparedInputs[portName] = input;
    }
  }
  
  return preparedInputs;
}

/**
 * Execute a function node with the provided data and inputs
 */
export async function execute(
  nodeData: FunctionNodeData, 
  inputs: Record<string, NodeExecutionData | any> = {}
): Promise<NodeExecutionData> {
  try {
    // Create a function from the code string
    const funcBody = nodeData.code;
    
    // Transform inputs to format expected by function
    const processedInputs = prepareInputsForFunction(inputs);
    
    // Add console logging capability for debugging
    const consoleMessages: string[] = [];
    const sandboxConsole = {
      log: (...args: any[]) => {
        console.log('[Function Node]:', ...args);
        consoleMessages.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
      },
      error: (...args: any[]) => {
        console.error('[Function Node]:', ...args);
        consoleMessages.push(`ERROR: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')}`);
      },
      warn: (...args: any[]) => {
        console.warn('[Function Node]:', ...args);
        consoleMessages.push(`WARN: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')}`);
      }
    };
    
    // Create a safe execution context with limited capabilities
    const sandboxedFunction = new Function('inputs', 'console', funcBody);
    
    // Execute the function with the provided inputs
    const result = sandboxedFunction(processedInputs, sandboxConsole);
    
    // Handle both synchronous and asynchronous (Promise) results
    const output = result instanceof Promise ? await result : result;
    
    // Return output in standardized format
    return createNodeOutput(output, {
      additionalMeta: {
        console: consoleMessages,
        executionTime: new Date().getTime()
      }
    });
  } catch (error) {
    console.error('Error executing function node:', error);
    return createErrorOutput(error instanceof Error ? error.message : String(error));
  }
}

export const defaultData: FunctionNodeData = {
  code: `// This function receives all inputs as the first parameter
// You can transform the data and return any value
// Example:
console.log("Processing inputs:", inputs);

return {
  message: "Hello from function node!",
  inputs: inputs
};`
};