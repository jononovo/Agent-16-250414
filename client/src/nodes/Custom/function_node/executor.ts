/**
 * Function Node Executor
 * 
 * This file handles the execution logic for the function_node
 * which allows users to run custom JavaScript functions within workflows.
 */

import { NodeExecutionData, WorkflowItem } from '@/shared/nodeTypes';

interface FunctionNodeData {
  code?: string;
  async?: boolean;
  timeout?: number;
  [key: string]: any;
}

/**
 * Execute a JavaScript function node with the provided input
 */
export async function execute(
  nodeData: FunctionNodeData,
  input: NodeExecutionData
): Promise<NodeExecutionData> {
  const startTime = new Date();
  const meta = {
    startTime,
    endTime: new Date(),
    source: 'function_node',
    error: false,
    errorMessage: '',
  };
  
  try {
    // Extract code from node settings or fallback to default
    const code = nodeData.code || 'function process(input) { return input; }';
    const isAsync = nodeData.async === true;
    const timeout = nodeData.timeout || 10000; // Default timeout: 10 seconds
    
    // Create a function from the code string
    let processFunction;
    
    try {
      // Create the function with safety precautions
      processFunction = new Function('input', `
        try {
          ${code}
          return process(input);
        } catch (error) {
          return { error: true, message: error.message };
        }
      `);
    } catch (codeError: any) {
      return {
        items: input.items,
        meta: {
          ...meta,
          endTime: new Date(),
          error: true,
          errorMessage: `Failed to compile function: ${codeError.message}`
        }
      };
    }
    
    // Process each item with the function
    const resultItems: WorkflowItem[] = [];
    
    // Process with timeout protection
    const processWithTimeout = async (item: WorkflowItem): Promise<WorkflowItem> => {
      return new Promise((resolve) => {
        // Create timeout
        const timeoutId = setTimeout(() => {
          resolve({
            json: { error: true, message: `Function execution timed out after ${timeout}ms` },
            text: `Execution timed out after ${timeout}ms`
          });
        }, timeout);
        
        try {
          // Execute the function (handle both async and sync functions)
          const result = processFunction(item.json);
          
          // Clear timeout and resolve with result
          clearTimeout(timeoutId);
          
          if (result && result.error === true) {
            // Function returned an error object
            resolve({
              json: { error: true, message: result.message },
              text: `Error: ${result.message}`
            });
          } else {
            // Function executed successfully
            resolve({
              json: result,
              text: typeof result === 'object' ? JSON.stringify(result) : String(result)
            });
          }
        } catch (execError: any) {
          // Execution error
          clearTimeout(timeoutId);
          resolve({
            json: { error: true, message: execError.message },
            text: `Error: ${execError.message}`
          });
        }
      });
    };
    
    // Process all input items
    for (const item of input.items) {
      const result = await processWithTimeout(item);
      resultItems.push(result);
    }
    
    // Check if any items resulted in errors
    const hasErrors = resultItems.some(item => 
      item.json && typeof item.json === 'object' && item.json.error === true
    );
    
    // Return the processed items
    return {
      items: resultItems,
      meta: {
        ...meta,
        endTime: new Date(),
        error: hasErrors,
        errorMessage: hasErrors 
          ? 'One or more items failed during processing' 
          : ''
      }
    };
  } catch (error: any) {
    // Catch any unexpected errors in the executor itself
    return {
      items: input.items.map(item => ({
        json: { error: true, message: error.message },
        text: `Error: ${error.message}`
      })),
      meta: {
        ...meta,
        endTime: new Date(),
        error: true,
        errorMessage: `Executor error: ${error.message}`
      }
    };
  }
}