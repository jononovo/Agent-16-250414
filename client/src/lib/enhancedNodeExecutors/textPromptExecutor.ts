/**
 * Text Prompt Node Executor
 * 
 * Handles the execution of text prompt nodes, which provide static text for the workflow.
 */

import { EnhancedNodeExecutor, createWorkflowItem, createExecutionDataFromValue, NodeDefinition } from '../types/workflow';

// Define the node definition
const definition: NodeDefinition = {
  type: 'text_prompt',
  displayName: 'Text Prompt',
  description: 'Provide static text prompts to your workflow',
  icon: 'message-square',
  category: 'AI',
  version: '1.0',
  inputs: {},
  outputs: {
    text: {
      type: 'string',
      displayName: 'Text',
      description: 'The text prompt'
    }
  }
};

export const textPromptExecutor: EnhancedNodeExecutor = {
  // Provide the node definition
  definition,
  
  // Execute function
  execute: async (nodeData, inputs) => {
    try {
      // Get the prompt text from node configuration
      const promptText = nodeData.configuration?.promptText || nodeData.configuration?.text || '';
      
      // Return the node execution data with our output
      return createExecutionDataFromValue({
        text: promptText,
        output: promptText // For backward compatibility
      }, 'text_prompt');
    } catch (error: any) {
      console.error(`Error executing text prompt node:`, error);
      
      // Create error execution data
      return {
        items: [],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          error: error.message || 'Error processing text prompt',
          sourceOperation: 'text_prompt'
        }
      };
    }
  }
};