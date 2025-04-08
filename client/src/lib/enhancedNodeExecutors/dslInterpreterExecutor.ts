/**
 * DSL Interpreter Node Executor
 * 
 * This node executor interprets natural language prompts and converts them
 * to workflow definitions that can be visualized in ReactFlow and executed
 * by the workflow engine.
 */

import { EnhancedNodeExecutor, NodeExecutionData, WorkflowItem, createWorkflowItem } from '../types/workflow';
import { apiClient } from '../apiClient';

/**
 * Generate a workflow structure from a natural language prompt
 */
async function generateWorkflowFromPrompt(
  prompt: string, 
  settings: Record<string, any> = {}
): Promise<any> {
  try {
    console.log('Generating workflow from prompt:', prompt);
    
    // Call the workflow generation service
    const response = await apiClient.post('/api/generate-workflow', {
      prompt,
      settings
    });
    
    console.log('Generated workflow structure:', response);
    
    // Return the generated workflow structure
    return response;
  } catch (error) {
    console.error('Error generating workflow from prompt:', error);
    throw error;
  }
}

/**
 * DSL Interpreter Node Executor Definition
 */
export const dslInterpreterExecutor: EnhancedNodeExecutor = {
  definition: {
    type: 'dsl_interpreter',
    displayName: 'Workflow Builder',
    description: 'Builds workflows from natural language descriptions',
    icon: 'wand-sparkles',
    category: 'AI',
    version: '1.0.0',
    inputs: {
      prompt: {
        type: 'string',
        displayName: 'Prompt',
        description: 'The natural language description of the workflow to build',
        required: true
      }
    },
    outputs: {
      workflow: {
        type: 'object',
        displayName: 'Workflow Definition',
        description: 'The generated workflow definition including nodes and edges'
      }
    }
  },
  
  execute: async (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    console.log('DSL Interpreter Node - Starting execution', nodeData);
    
    try {
      // Extract the prompt from inputs
      const promptData = inputs.prompt?.items?.[0]?.json;
      if (!promptData) {
        throw new Error('No prompt data provided');
      }
      
      // Get the prompt text
      const prompt = typeof promptData === 'string' 
        ? promptData 
        : (promptData.text || promptData.prompt || JSON.stringify(promptData));
      
      // Extract settings from nodeData
      const settings = nodeData.settings || {};
      
      // Generate the workflow from the prompt
      const flowDefinition = await generateWorkflowFromPrompt(prompt, settings);
      
      // Create the output workflow item
      const workflowItem: WorkflowItem = createWorkflowItem(flowDefinition, 'generated');
      
      // Return the workflow definition
      return {
        items: [workflowItem],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          status: 'success'
        }
      };
    } catch (error) {
      console.error('DSL Interpreter Node - Execution error:', error);
      
      // Return error response
      return {
        items: [
          createWorkflowItem(
            { 
              error: error instanceof Error ? error.message : String(error),
              status: 'error'
            }, 
            'error'
          )
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          status: 'error',
          message: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
};

export default dslInterpreterExecutor;