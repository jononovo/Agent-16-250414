/**
 * Custom Function Node Executor
 * 
 * This file contains the logic for executing the custom function node.
 * It dynamically evaluates the user-provided JavaScript code to process inputs.
 */

export const execute = async (nodeData: any, inputs?: any): Promise<any> => {
  try {
    const code = nodeData.code || '';
    
    // Extract the first input value or use an empty object
    const inputValue = inputs && inputs.input ? 
      (inputs.input.items && inputs.input.items.length > 0 ? inputs.input.items[0].json : {}) : 
      {};
    
    // Create a wrapper function to safely execute user-provided code
    const executeUserCode = new Function('input', `
      // Convert user code to valid function
      ${code}
      
      // Execute the process function with input
      return process(input);
    `);
    
    // Execute the user code with input
    const result = executeUserCode(inputValue);
    
    // Return the result in a structured format
    return {
      meta: {
        status: 'success',
        message: 'Function executed successfully',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: [
        {
          json: result,
          binary: null
        }
      ]
    };
  } catch (error: any) {
    // Handle errors
    return {
      meta: {
        status: 'error',
        message: error.message || 'Error executing function',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: []
    };
  }
};

export default execute;