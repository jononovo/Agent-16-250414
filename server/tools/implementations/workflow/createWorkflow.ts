/**
 * Create Workflow Tool
 * 
 * This tool creates a new workflow in the system.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const createWorkflowTool: Tool = {
  name: 'createWorkflow',
  description: 'Creates a new workflow with the specified name and properties',
  category: 'workflow',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the workflow',
      },
      description: {
        type: 'string',
        description: 'A description of the workflow',
      },
      type: {
        type: 'string',
        description: 'The type of workflow (e.g., "custom", "template")',
      },
      agentId: {
        type: 'number',
        description: 'The ID of the agent this workflow belongs to (if any)',
      },
      status: {
        type: 'string',
        description: 'The status of the workflow',
        enum: ['active', 'inactive', 'draft'],
      },
    },
    required: ['name'],
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { name, description, type = 'custom', agentId, status = 'draft' } = params;
      
      // Create empty workflow structure
      const emptyFlowData = {
        nodes: [],
        edges: []
      };
      
      // Create the workflow
      const workflow = await storage.createWorkflow({
        name,
        description,
        type,
        agentId,
        status,
        flowData: emptyFlowData
      });
      
      return {
        success: true,
        message: `Workflow "${name}" created successfully with ID ${workflow.id}`,
        data: workflow,
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating workflow',
      };
    }
  },
};

export default createWorkflowTool;