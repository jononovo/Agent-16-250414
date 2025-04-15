/**
 * Execute Workflow Tool
 * 
 * This tool executes a workflow with the provided input.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

// Import from routes.ts - this is a bit of a hack but avoids circular dependencies
// Would be better to move runWorkflow to a separate utility file in a production app
import { runWorkflow } from '../../../routes';

const executeWorkflowTool: Tool = {
  name: 'executeWorkflow',
  description: 'Execute a workflow with the provided input',
  category: 'workflow',
  parameters: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'number',
        description: 'The ID of the workflow to execute',
      },
      input: {
        type: 'object',
        description: 'The input data for the workflow',
        default: {}
      },
      debug: {
        type: 'boolean',
        description: 'Whether to include debug information in the result',
        default: false
      }
    },
    required: ['workflowId'],
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { workflowId, input = {}, debug = false } = params;
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      
      if (!workflow) {
        return {
          success: false,
          error: `Workflow with ID ${workflowId} not found`
        };
      }
      
      // Check if the workflow is active
      if (workflow.status !== 'active') {
        return {
          success: false,
          error: `Workflow with ID ${workflowId} is not active (status: ${workflow.status})`
        };
      }
      
      // Execute the workflow
      const result = await runWorkflow(workflowId, input, { 
        includeDetail: debug,
        debug
      });
      
      return {
        success: true,
        message: `Executed workflow "${workflow.name}" successfully`,
        data: result,
      };
    } catch (error) {
      console.error('Error executing workflow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error executing workflow',
      };
    }
  },
};

export default executeWorkflowTool;