/**
 * Visualize Text Node Executor
 * 
 * Handles the execution of visualize text nodes, which display text in the workflow.
 */

import { EnhancedNodeExecutor } from '../types/workflow';

export const visualizeTextExecutor: EnhancedNodeExecutor = {
  nodeType: 'visualize_text',
  
  execute: async (nodeData, inputs) => {
    try {
      // Get the input from the connected node
      const inputKeys = Object.keys(inputs);
      let textToVisualize = '';
      
      if (inputKeys.length > 0) {
        const firstInputKey = inputKeys[0];
        const firstInput = inputs[firstInputKey];
        
        // Try to extract text from the input
        if (typeof firstInput.text === 'string') {
          textToVisualize = firstInput.text;
        } else if (typeof firstInput.output === 'string') {
          textToVisualize = firstInput.output;
        } else if (typeof firstInput === 'string') {
          textToVisualize = firstInput;
        } else if (firstInput && typeof firstInput === 'object') {
          textToVisualize = JSON.stringify(firstInput, null, 2);
        }
      }
      
      // Store in the node data for visualization
      nodeData.visualizedText = textToVisualize;
      
      // Return the visualized text (pass through)
      return {
        success: true,
        outputs: {
          text: textToVisualize,
          output: textToVisualize,
          visualized: textToVisualize
        }
      };
    } catch (error: any) {
      console.error(`Error executing visualize text node:`, error);
      return {
        success: false,
        error: error.message || 'Error processing visualize text',
        outputs: {}
      };
    }
  }
};