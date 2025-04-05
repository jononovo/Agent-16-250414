/**
 * Text Input Node Executor
 * 
 * Handles the execution of text input nodes, which collect text input from users.
 */

import { EnhancedNodeExecutor } from '../types/workflow';

export const textInputExecutor: EnhancedNodeExecutor = {
  nodeType: 'text_input',
  
  execute: async (nodeData, inputs) => {
    try {
      // Get input value (either from UI or passed from another node)
      const inputValue = nodeData.inputValue || '';
      
      // Return the input text as the node output
      return {
        success: true,
        outputs: {
          text: inputValue,
          output: inputValue // For backward compatibility
        },
        items: [],
        meta: {}
      };
    } catch (error: any) {
      console.error(`Error executing text input node:`, error);
      return {
        success: false,
        error: error.message || 'Error processing text input',
        outputs: {},
        items: [],
        meta: {}
      };
    }
  }
};