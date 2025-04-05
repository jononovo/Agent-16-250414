/**
 * Output Node Executor
 * 
 * Handles the execution of output nodes, which display the final result of a workflow.
 */

import { EnhancedNodeExecutor } from '../types/workflow';

export const outputExecutor: EnhancedNodeExecutor = {
  nodeType: 'output',
  
  execute: async (nodeData, inputs) => {
    try {
      // Get the input from the connected node
      const inputKeys = Object.keys(inputs);
      let outputText = '';
      
      if (inputKeys.length > 0) {
        const firstInputKey = inputKeys[0];
        const firstInput = inputs[firstInputKey];
        
        // Try to extract text from the input
        if (typeof firstInput.text === 'string') {
          outputText = firstInput.text;
        } else if (typeof firstInput.output === 'string') {
          outputText = firstInput.output;
        } else if (typeof firstInput === 'string') {
          outputText = firstInput;
        } else if (firstInput && typeof firstInput === 'object') {
          outputText = JSON.stringify(firstInput, null, 2);
        }
      }
      
      // Return the output text
      return {
        success: true,
        outputs: {
          text: outputText,
          output: outputText,
          result: outputText
        }
      };
    } catch (error: any) {
      console.error(`Error executing output node:`, error);
      return {
        success: false,
        error: error.message || 'Error processing output',
        outputs: {}
      };
    }
  }
};