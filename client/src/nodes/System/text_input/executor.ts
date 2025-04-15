/**
 * Text Input Node Executor
 * 
 * This file contains the logic for executing the text input node.
 * It simply takes the configured text input and returns it as output.
 */

export const execute = async (nodeData: any, inputs?: any): Promise<any> => {
  try {
    // Get the input text from the node data
    const inputText = nodeData.inputText || '';
    
    // Return the result in a structured format
    return {
      meta: {
        status: 'success',
        message: 'Text input processed successfully',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: [
        {
          json: {
            text: inputText
          },
          binary: null
        }
      ]
    };
  } catch (error: any) {
    // Handle errors
    return {
      meta: {
        status: 'error',
        message: error.message || 'Error processing text input',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: []
    };
  }
};