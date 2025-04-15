/**
 * Text Prompt Node Executor
 * 
 * This file contains the logic for executing the text prompt node.
 * It processes the prompt text and any dynamic inputs to create a formatted output.
 */

export const execute = async (nodeData: any, inputs?: any): Promise<any> => {
  try {
    // Get the prompt text from the node data or settings
    const promptText = nodeData.prompt || nodeData.settings?.prompt || '';
    
    // Process any dynamic inputs that might be connected to this node
    let processedPrompt = promptText;
    
    // If we have dynamic inputs connected, incorporate them into the prompt
    if (inputs && Object.keys(inputs).length > 0) {
      // Replace variables in the prompt with input values
      Object.entries(inputs).forEach(([key, value]: [string, any]) => {
        // Safety check for the value
        if (value && value.items && value.items[0] && value.items[0].json) {
          const inputValue = value.items[0].json.text || '';
          // Replace {{input-name}} with the actual value
          const regex = new RegExp(`{{${key}}}`, 'g');
          processedPrompt = processedPrompt.replace(regex, inputValue);
        }
      });
    }
    
    // Return the result in a structured format
    return {
      meta: {
        status: 'success',
        message: 'Prompt processed successfully',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: [
        {
          json: {
            text: processedPrompt
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
        message: error.message || 'Error processing prompt',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: []
    };
  }
};