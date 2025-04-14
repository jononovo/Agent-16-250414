/**
 * Function Node Executor
 * 
 * This node allows execution of custom JavaScript code.
 */

import { NodeExecutor } from '../workflowEngine';
import { execute as functionNodeExecute } from '../../nodes/function/executor';

// Function executor
export const functionExecutor: NodeExecutor = {
  execute: async (nodeData, inputs) => {
    try {
      console.log('Function node executor - executing code');
      
      const code = nodeData.code || nodeData.settings?.functionBody || nodeData.settings?.code;
      
      // For compatibility with older workflows
      if (!code && nodeData.settings?.transformCode) {
        nodeData.code = nodeData.settings.transformCode;
      }
      
      // Execute the function
      const result = await functionNodeExecute(nodeData, inputs);
      
      // Return the result properly formatted
      return {
        output: [{ 
          text: typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
          json: result.result
        }]
      };
    } catch (error) {
      console.error('Function node execution error:', error);
      
      return {
        error: [{ 
          text: error instanceof Error ? error.message : String(error)
        }]
      };
    }
  }
};